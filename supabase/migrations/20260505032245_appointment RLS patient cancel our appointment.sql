alter table public."Appointments" enable row level security;

create policy "patients can cancel own appointments"
on public."Appointments"
for update
to authenticated
using (
  patient_id = auth.uid()
)
with check (
  patient_id = auth.uid()
  and appointment_status = 'canceled'
);