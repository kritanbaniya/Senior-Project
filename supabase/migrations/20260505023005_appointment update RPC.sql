create function public.update_appt(
  p_appointment_id uuid,
  p_appointment_date timestamp,
  p_patient_id uuid,
  p_clinician_id uuid,
  p_visit_type appointmenttypes,
  p_appointment_status appointment_status,
  p_nurse_note text
)
returns public."Appointments"
language plpgsql
security invoker
as $$
declare
  updated_appt public."Appointments";
  v_clinic_id uuid;
  v_role text;
begin
  -- rate limit (optional but consistent)
  perform public.check_rate_limit('update_appt', 20, 60);

  -- get role
  select role into v_role
  from public.profiles
  where id = auth.uid();

  -- get clinic from appointment
  select clinic_id into v_clinic_id
  from public."Appointments"
  where "Appointment_id" = p_appointment_id;

  if v_clinic_id is null then
    raise exception 'appointment not found';
  end if;

  -- permission logic
  if v_role = 'patient' then
  -- must own the appointment
  if not exists (
    select 1
    from public."Appointments"
    where "Appointment_id" = p_appointment_id
      and patient_id = auth.uid()
  ) then
    raise exception 'patients can only update their own appointments';
  end if;

  -- patients can only cancel
  if p_appointment_status <> 'canceled' then
    raise exception 'patients may only cancel appointments';
  end if;

  -- prevent modifying anything else
  if exists (
    select 1
    from public."Appointments"
    where "Appointment_id" = p_appointment_id
      and (
        appointment_date is distinct from p_appointment_date
        or clinician_id is distinct from p_clinician_id
        or visit_type is distinct from p_visit_type
        or nurse_note is distinct from p_nurse_note
      )
  ) then
    raise exception 'patients may not modify appointment details';
  end if;

  elsif v_role = 'nurse' then
    -- check staff_permissions
    if not exists (
      select 1
      from public.staff_permissions sp
      where sp.user_id = auth.uid()
        and sp.clinic_id = v_clinic_id
        and sp.manage_appointment = true
    ) then
      raise exception 'missing permission: manage_appointment';
    end if;

  else
    raise exception 'role not allowed to update appointment';
  end if;

  -- perform update
  update public."Appointments"
  set
    appointment_date = p_appointment_date,
    patient_id = p_patient_id,
    clinician_id = p_clinician_id,
    visit_type = p_visit_type,
    appointment_status = p_appointment_status,
    nurse_note = p_nurse_note
  where "Appointment_id" = p_appointment_id
  returning * into updated_appt;

  return updated_appt;
end;
$$;























