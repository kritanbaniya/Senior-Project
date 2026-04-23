-- Allow authenticated users to view doctor profiles for booking
-- This fixes provider dropdown visibility for first-time patients.

drop policy if exists "Patients can view doctor profiles in their clinic"
on public.profiles;

create policy "Patients can view doctor profiles for booking"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or role = 'doctor'
);