-- ============================================================
-- 1. add appointment_id column to queue_entries
-- ============================================================
-- nullable: null = walk-in, non-null = linked to a scheduled appointment.
alter table public.queue_entries
  add column appointment_id uuid null;

-- foreign key: cascade uuid updates, set null on appointment delete so
-- queue history is preserved even if the appointment is removed.
alter table public.queue_entries
  add constraint queue_entries_appointment_fk
  foreign key (appointment_id)
  references public."Appointments"("Appointment_id")
  on update cascade
  on delete set null;

-- partial index for lookups by appointment id.
create index queue_entries_appointment_idx
  on public.queue_entries (appointment_id)
  where appointment_id is not null;


-- ============================================================
-- 2. extend the before-update trigger with appointment_id immutability
-- ============================================================
-- appointment_id is a one-way write: null -> uuid is allowed (used by
-- complete_visit to backfill walk-in entries), but once set it cannot
-- be changed or cleared. this prevents accidental re-linkage.
create or replace function public.queue_entries_before_update()
returns trigger
language plpgsql
as $$
begin
  -- check 1: archive protection.
  -- once a row has is_active = false, it is frozen forever.
  -- no column on this row may be changed by anyone, including
  -- security-definer rpc functions.
  if old.is_active = false then
    raise exception 'cannot modify archived queue entry (id=%)', old.id;
  end if;

  -- check 2: status transition validation.
  -- only runs when the status column is actually changing.
  if old.status is distinct from new.status then
    if not (
      (old.status = 'pending'        and new.status in ('waiting', 'left', 'cancelled'))
      or (old.status = 'waiting'     and new.status in ('called', 'left'))
      or (old.status = 'called'      and new.status in ('in_progress', 'no_show'))
      or (old.status = 'in_progress' and new.status = 'completed')
    ) then
      raise exception 'invalid queue status transition: % -> %', old.status, new.status;
    end if;
  end if;

  -- check 3: auto-deactivation.
  -- when a row enters a terminal status, is_active is forced to false.
  if new.status in ('completed', 'cancelled', 'left', 'no_show') then
    new.is_active = false;
  end if;

  -- check 4: manual deactivation guard.
  if new.is_active = false and new.status not in ('completed', 'cancelled', 'left', 'no_show') then
    raise exception 'is_active can only be false for terminal statuses';
  end if;

  -- check 5: column immutability — core identity fields.
  if new.patient_id is distinct from old.patient_id then
    raise exception 'patient_id cannot be changed';
  end if;
  if new.clinic_id is distinct from old.clinic_id then
    raise exception 'clinic_id cannot be changed';
  end if;
  if new.queue_date is distinct from old.queue_date then
    raise exception 'queue_date cannot be changed';
  end if;

  -- check 5b: appointment_id immutability — one-way write only.
  -- null -> uuid: allowed (walk-in backfill by complete_visit).
  -- uuid -> null or uuid -> different uuid: never allowed.
  if old.appointment_id is not null
     and new.appointment_id is distinct from old.appointment_id then
    raise exception 'appointment_id is immutable once set';
  end if;

  -- check 6: auto-update updated_at.
  new.updated_at = now();

  return new;
end;
$$;


-- ============================================================
-- 3. new rpc: join_queue_for_appointment
-- ============================================================
-- patients use this instead of join_queue when they have an active
-- appointment coming up. it validates ownership and the check-in
-- window, inserts a pending queue entry linked to the appointment,
-- and stamps checkin_at on the appointment row.
create or replace function public.join_queue_for_appointment(
  p_appointment_id uuid,
  p_notes          text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id     uuid;
  v_patient_name text;
  v_clinic_id    uuid;
  v_appt_date    timestamp without time zone;
  v_appt_status  public.appointment_status;
  v_appt_patient uuid;
begin
  -- caller must be a patient.
  select full_name into v_patient_name
  from public.profiles
  where id = auth.uid() and role = 'patient';

  if not found then
    raise exception 'only patients can join queue';
  end if;

  -- load and validate the appointment.
  select clinic_id, appointment_date, appointment_status, patient_id
    into v_clinic_id, v_appt_date, v_appt_status, v_appt_patient
  from public."Appointments"
  where "Appointment_id" = p_appointment_id;

  if v_clinic_id is null then
    raise exception 'appointment not found';
  end if;

  if v_appt_patient <> auth.uid() then
    raise exception 'appointment does not belong to caller';
  end if;

  if v_appt_status <> 'active' then
    raise exception 'appointment is not active';
  end if;

  -- check-in window: 2 hours before to 1 hour after the appointment time.
  -- appointment_date is timestamp without time zone stored in utc, so
  -- compare against now() cast to the same type for consistency.
  if v_appt_date is null
     or (now() at time zone 'utc') < (v_appt_date - interval '2 hours')
     or (now() at time zone 'utc') > (v_appt_date + interval '1 hour') then
    raise exception 'appointment is outside the check-in window';
  end if;

  -- insert the pending queue entry with the appointment link.
  -- the rls insert policy (queue_insert_patient_pending) validates:
  -- patient_id = auth.uid(), role = patient, status = pending, is_active = true.
  -- appointment_id is an additional field not constrained by rls.
  insert into public.queue_entries (
    clinic_id,
    patient_id,
    status,
    notes,
    queue_order,
    patient_name,
    appointment_id
  ) values (
    v_clinic_id,
    auth.uid(),
    'pending',
    p_notes,
    null,
    coalesce(v_patient_name, 'patient'),
    p_appointment_id
  )
  returning id into v_entry_id;

  -- stamp checkin_at on the appointment if not already set.
  -- checkin_at is timestamp without time zone on the appointments table.
  update public."Appointments"
     set checkin_at = coalesce(checkin_at, (now() at time zone 'utc'))
   where "Appointment_id" = p_appointment_id;

  return v_entry_id;
end;
$$;

revoke all on function public.join_queue_for_appointment(uuid, text) from public;
grant execute on function public.join_queue_for_appointment(uuid, text)
  to anon, authenticated, service_role;
