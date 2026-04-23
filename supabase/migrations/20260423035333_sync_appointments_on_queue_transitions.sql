-- ============================================================
-- redefine start_visit
-- ============================================================
-- adds: when starting a visit for a scheduled (appointment-linked) entry,
-- stamp Appointments.seen_at if not already set.
-- all preflight logic (nurse check, clinic permission, per-clinic lock,
-- re-verify, queue compaction) is unchanged from the original.
create or replace function public.start_visit("p_entry_id" uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id      uuid;
  v_old_order      integer;
  v_appointment_id uuid;
  v_rec            record;
begin
  -- verify caller is a nurse.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'nurse'
  ) then
    raise exception 'only nurses can start visits';
  end if;

  -- preliminary read: get clinic_id, current position, and appointment link.
  select clinic_id, queue_order, appointment_id
    into v_clinic_id, v_old_order, v_appointment_id
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status = 'called';

  if v_clinic_id is null then
    raise exception 'entry not found or not in called status';
  end if;

  -- verify clinic-level permission.
  if not exists (
    select 1 from public.staff_permissions
    where clinic_id = v_clinic_id
      and user_id = auth.uid()
      and manage_queue = true
  ) then
    raise exception 'not authorized to manage queue at this clinic';
  end if;

  -- lock all active rows for this clinic.
  perform 1
  from public.queue_entries
  where clinic_id = v_clinic_id
    and is_active = true
  order by queue_order nulls first
  for update;

  -- re-read position after lock (it may have changed if a reorder was in
  -- progress when we acquired the lock).
  select queue_order, appointment_id
    into v_old_order, v_appointment_id
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status = 'called';

  if v_old_order is null then
    raise exception 'entry is no longer in called status';
  end if;

  -- transition: called -> in_progress.
  -- queue_order = 0 removes the patient from position-based ordering.
  -- started_at is stamped here.
  update public.queue_entries
     set status      = 'in_progress',
         queue_order = 0,
         started_at  = now()
   where id = p_entry_id;

  -- compact: shift everyone behind the removed position forward.
  for v_rec in (
    select id
    from public.queue_entries
    where clinic_id = v_clinic_id
      and is_active = true
      and status in ('waiting', 'called')
      and queue_order > v_old_order
    order by queue_order asc
  ) loop
    update public.queue_entries
       set queue_order = queue_order - 1
     where id = v_rec.id;
  end loop;

  -- sync linked appointment (scheduled path only).
  -- for walk-ins appointment_id is null, so this update is a no-op.
  -- seen_at is set only if not already recorded (coalesce guard).
  if v_appointment_id is not null then
    update public."Appointments"
       set seen_at = coalesce(seen_at, (now() at time zone 'utc'))
     where "Appointment_id" = v_appointment_id;
  end if;
end;
$$;


-- ============================================================
-- redefine complete_visit
-- ============================================================
-- adds two branches:
--   walk-in (appointment_id IS NULL):
--     1. insert a completed Appointments row for the visit.
--     2. backfill queue_entries.appointment_id (BEFORE the status flip so
--        the archive-protection trigger does not reject the write).
--     3. transition queue status -> completed (trigger archives the row).
--   scheduled (appointment_id IS NOT NULL):
--     1. mark the existing appointment completed.
--     2. transition queue status -> completed.
create or replace function public.complete_visit("p_entry_id" uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clinic_id      uuid;
  v_appointment_id uuid;
  v_patient_id     uuid;
  v_checked_in_at  timestamp with time zone;
  v_started_at     timestamp with time zone;
  v_new_appt_id    uuid;
begin
  -- verify caller is a nurse.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'nurse'
  ) then
    raise exception 'only nurses can complete visits';
  end if;

  -- preliminary read: get clinic_id plus all fields needed for either branch.
  select clinic_id, appointment_id, patient_id, checked_in_at, started_at
    into v_clinic_id, v_appointment_id, v_patient_id, v_checked_in_at, v_started_at
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status = 'in_progress';

  if v_clinic_id is null then
    raise exception 'entry not found or not in_progress';
  end if;

  -- verify clinic-level permission.
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

  -- re-verify after lock.
  if not exists (
    select 1 from public.queue_entries
    where id = p_entry_id
      and is_active = true
      and status = 'in_progress'
  ) then
    raise exception 'entry is no longer in_progress';
  end if;

  if v_appointment_id is null then
    -- walk-in branch: the patient had no scheduled appointment.
    -- create one retroactively so the visit appears in the patient's history.
    -- clinician_id = the nurse who completed the visit (auth.uid()).
    -- appointment_date / seen_at = started_at (when the visit actually began).
    -- checkin_at = when the patient originally checked into the queue.
    -- visit_type = 'Walk-in' (enum value added in the preceding migration).
    -- appointment_status = 'completed' immediately.
    insert into public."Appointments" (
      patient_id,
      clinic_id,
      clinician_id,
      appointment_date,
      checkin_at,
      seen_at,
      visit_type,
      appointment_status
    ) values (
      v_patient_id,
      v_clinic_id,
      auth.uid(),
      -- appointment_date is timestamp without time zone; convert from tz.
      (v_started_at at time zone 'utc'),
      (v_checked_in_at at time zone 'utc'),
      (v_started_at at time zone 'utc'),
      'Walk-in',
      'completed'
    )
    returning "Appointment_id" into v_new_appt_id;

    -- backfill the queue entry with the new appointment id.
    -- this update must happen BEFORE the status is flipped to 'completed'
    -- because the before-update trigger rejects any write to an archived row
    -- (is_active = false). the row is still active and in_progress here.
    update public.queue_entries
       set appointment_id = v_new_appt_id
     where id = p_entry_id;

  else
    -- scheduled branch: a linked appointment already exists.
    -- mark it completed and fill seen_at as a backstop if start_visit
    -- did not set it (e.g., the visit was started before this migration).
    update public."Appointments"
       set appointment_status = 'completed',
           seen_at = coalesce(seen_at, (v_started_at at time zone 'utc'))
     where "Appointment_id" = v_appointment_id;

  end if;

  -- transition: in_progress -> completed.
  -- the before-update trigger validates this transition and sets is_active = false.
  -- completed_at is stamped with the current transaction time.
  update public.queue_entries
     set status       = 'completed',
         completed_at = now()
   where id = p_entry_id;
end;
$$;
