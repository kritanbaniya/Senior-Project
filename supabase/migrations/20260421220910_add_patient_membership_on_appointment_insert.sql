-- Automatically add a patient to Memberships after they successfully create
-- an appointment at a clinic.
--
-- This runs regardless of appointment_status.
-- ON CONFLICT DO NOTHING prevents duplicate membership rows.

create or replace function public.add_patient_membership_on_appointment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."Memberships" (clinic_id, user_id)
  values (new.clinic_id, new.patient_id)
  on conflict (clinic_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_add_patient_membership_on_appointment_insert
on public."Appointments";

create trigger trg_add_patient_membership_on_appointment_insert
after insert on public."Appointments"
for each row
execute function public.add_patient_membership_on_appointment_insert();