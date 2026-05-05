create or replace function public.get_doctor_in_progress_queue()
returns table (
  queue_entry_id uuid,
  patient_id uuid,
  patient_name text,
  visit_type text,
  status text,
  started_at timestamptz,
  appointment_id uuid
)
language sql
security definer
set search_path = public
as $$
  select
    q.id as queue_entry_id,
    q.patient_id,
    q.patient_name,
    a.visit_type::text,
    q.status::text,
    q.started_at,
    q.appointment_id
  from public.queue_entries q
  join public."Appointments" a
    on a."Appointment_id" = q.appointment_id
  where q.status = 'in_progress'
    and q.is_active = true
    and a.clinician_id = auth.uid()
  order by q.started_at asc;
$$;

revoke all on function public.get_doctor_in_progress_queue() from public;
grant execute on function public.get_doctor_in_progress_queue() to authenticated;