create policy "Patients can create appointments"
on public."Appointments"
for insert
to authenticated
with check (
  patient_id = auth.uid()
  and exists (
    select 1
    from public.clinics c
    where c.clinic_id = "Appointments".clinic_id
      and c.approved = true
  )
);