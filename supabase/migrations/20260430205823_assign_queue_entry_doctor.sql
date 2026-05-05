create or replace function public.assign_queue_entry_doctor(
  p_entry_id uuid,
  p_doctor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id uuid;
  v_appointment_id uuid;
  v_patient_id uuid;
  v_checked_in_at timestamp with time zone;
  v_new_appointment_id uuid;
begin
  select clinic_id, appointment_id, patient_id, checked_in_at
    into v_clinic_id, v_appointment_id, v_patient_id, v_checked_in_at
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status in ('waiting', 'called', 'in_progress');

  if v_clinic_id is null then
    raise exception 'active queue entry not found';
  end if;

  if not exists (
    select 1
    from public.staff_permissions
    where clinic_id = v_clinic_id
      and user_id = auth.uid()
      and manage_queue = true
      and invitation_status = 'accepted'
  ) then
    raise exception 'not authorized to assign doctors for this clinic';
  end if;

  if not exists (
    select 1
    from public."Memberships" m
    join public.profiles p on p.id = m.user_id
    where m.clinic_id = v_clinic_id
      and m.user_id = p_doctor_id
      and p.role = 'doctor'
  ) then
    raise exception 'selected user is not a doctor at this clinic';
  end if;

  if v_appointment_id is null then
    insert into public."Appointments" (
      patient_id,
      clinic_id,
      clinician_id,
      appointment_date,
      checkin_at,
      visit_type,
      appointment_status
    ) values (
      v_patient_id,
      v_clinic_id,
      p_doctor_id,
      now() at time zone 'utc',
      v_checked_in_at at time zone 'utc',
      'Walk-in',
      'active'
    )
    returning "Appointment_id" into v_new_appointment_id;

    update public.queue_entries
       set appointment_id = v_new_appointment_id
     where id = p_entry_id;
  else
    update public."Appointments"
       set clinician_id = p_doctor_id
     where "Appointment_id" = v_appointment_id
       and clinic_id = v_clinic_id;
  end if;
end;
$$;

revoke all on function public.assign_queue_entry_doctor(uuid, uuid) from public;
grant execute on function public.assign_queue_entry_doctor(uuid, uuid)
  to authenticated, service_role;