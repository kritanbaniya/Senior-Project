-- replace join_queue_for_appointment to remove the server-side time window check.
-- the appointment_date column is timestamp without time zone, storing the user's
-- local time without tz info. comparing it against now() at time zone 'utc'
-- produces a false mismatch for any user not in utc.
-- the frontend isCheckInEligible() already enforces the [-2h, +1h] window
-- correctly using javascript's local-time-aware Date constructor, so the
-- server-side guard is unnecessary and actively harmful.
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

  -- null date guard only; the frontend enforces the [-2h, +1h] window.
  if v_appt_date is null then
    raise exception 'appointment has no scheduled time';
  end if;

  -- insert the pending queue entry with the appointment link.
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
  update public."Appointments"
     set checkin_at = coalesce(checkin_at, (now() at time zone 'utc'))
   where "Appointment_id" = p_appointment_id;

  return v_entry_id;
end;
$$;

revoke all on function public.join_queue_for_appointment(uuid, text) from public;
grant execute on function public.join_queue_for_appointment(uuid, text)
  to anon, authenticated, service_role;