-- Allow patients to view their own visit summaries
create policy "Patients can view own visit summaries"
on public.medical_history
for select
to authenticated
using (patient_id = auth.uid()::text);

-- Allow patients to view their own lab results
create policy "Patients can view own lab results"
on public.lab_results
for select
to authenticated
using (patient_id = auth.uid()::text);

-- Allow patients to view their own prescriptions / medications
create policy "Patients can view own prescriptions"
on public.prescriptions
for select
to authenticated
using (patient_id = auth.uid()::text);