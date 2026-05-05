create or replace function public.complete_visit(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_appointment_id uuid;
  v_started_at timestamp with time zone;
begin
  -- Only nurses can complete visits
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'nurse'
  ) then
    raise exception 'only nurses can complete visits';
  end if;

  -- preliminary read: check that the entry exists, is active, and in_progress
  select clinic_id, appointment_id, started_at
    into v_clinic_id, v_appointment_id, v_started_at
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status = 'in_progress';

  if v_clinic_id is null then
    raise exception 'entry not found or not in_progress';
  end if;

  -- verify clinic level permission.
  if not exists (
    select 1 from public.staff_permissions
    where clinic_id = v_clinic_id
      and user_id = auth.uid()
      and manage_queue = true
  ) then
    raise exception 'not authorized to manage queue at this clinic';
  end if;

  -- lock all active rows for this clinic.
  -- while complete_visit doesn't change queue ordering, locking maintains
  -- the uniform one-operation-at-a-time guarantee per clinic.
  perform 1
  from public.queue_entries
  where clinic_id = v_clinic_id
    and is_active = true
  order by queue_order nulls first
  for update;

  -- re-verify after lock
  if not exists (
    select 1 from public.queue_entries
    where id = p_entry_id
      and is_active = true
      and status = 'in_progress'
  ) then
    raise exception 'entry is no longer in_progress';
  end if;

  -- If an appointment is already linked, mark it completed.
  -- Do not create a new appointment here.
  if v_appointment_id is not null then
    update public."Appointments"
       set appointment_status = 'completed',
           seen_at = coalesce(seen_at, (v_started_at at time zone 'utc'))
     where "Appointment_id" = v_appointment_id;
  end if;

  update public.queue_entries
     set status = 'completed',
         completed_at = now()
   where id = p_entry_id;
end;
$$;