create or replace view public.appointmentList_display as 
select 
  a."Appointment_id", 
  a.appointment_date,

  u.full_name as patient_name,
  u.email as patient_email,

  d.full_name as clinician_name,

  c.clinic_name as clinic_name,

  a.checkin_at, 
  a.seen_at, 
  a.visit_type, 
  
  a.created_at, 
  a.nurse_note, 
  a.patient_note, 
  a.appointment_status, 
  
  a.patient_id,
  a.clinician_id,
  a.clinic_id

from public."Appointments" a

join public.profiles u
  on a.patient_id = u.id

left join public.profiles d
  on a.clinician_id = d.id

join public.clinics c
  on a.clinic_id = c.clinic_id;