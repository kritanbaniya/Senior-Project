


create or replace function public.create_appt(
  p_appointment_date timestamp,
  p_patient_id uuid,
  p_clinician_id uuid,
  p_clinic_id uuid,
  p_visit_type appointmenttypes,
  p_appointment_status appointment_status,
  p_nurse_note text,
  p_patient_note text
)
returns public."Appointments"
language plpgsql
security invoker
as $$
declare
  new_appt public."Appointments";
begin
  perform public.check_rate_limit('create_appt', 5, 60);
  insert into public."Appointments" (
    appointment_date,
    patient_id,
    clinician_id,
    clinic_id,
    checkin_at,
    seen_at,
    visit_type,
    appointment_status,
    nurse_note, 
    patient_note 
  )
  values (
    p_appointment_date,
    p_patient_id,
    p_clinician_id,
    p_clinic_id,
    null,
    null,
    p_visit_type,
    p_appointment_status,
    p_nurse_note, 
    p_patient_note 
  )
  returning * into new_appt;

  return new_appt;
end;
$$;


