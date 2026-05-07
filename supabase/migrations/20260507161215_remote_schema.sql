set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.am_i_patient_of_clinic(p_clinic_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public."Memberships" m
    join public.profiles p
      on p.id = m.user_id
    where m.user_id = auth.uid()
      and m.clinic_id = p_clinic_id
      and p.role = 'patient'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.get_appointment_types()
 RETURNS TABLE(value text)
 LANGUAGE sql
 STABLE
AS $function$
  select unnest(enum_range(null::public.appointmenttypes))::text as value;
$function$
;

CREATE OR REPLACE FUNCTION public.is_doctor_user(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.role = 'doctor'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_patient_user(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.role = 'patient'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_staff_of_clinic(p_clinic_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public."Memberships" m
    join public.profiles p
      on p.id = m.user_id
    where m.user_id = auth.uid()
      and m.clinic_id = p_clinic_id
      and p.role in ('nurse', 'doctor', 'clinic_admin')
  );
$function$
;

CREATE OR REPLACE FUNCTION public.patient_can_view_doctor_profile(p_target_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public."Memberships" me
    join public."Memberships" target
      on me.clinic_id = target.clinic_id
    join public.profiles my_profile
      on my_profile.id = me.user_id
    join public.profiles target_profile
      on target_profile.id = target.user_id
    where me.user_id = auth.uid()
      and target.user_id = p_target_user_id
      and my_profile.role = 'patient'
      and target_profile.role = 'doctor'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.staff_permissions_enforce_column_updates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
  is_subject_nurse boolean;
  is_clinic_admin boolean;
begin
  is_subject_nurse := (new.user_id = auth.uid());
  is_clinic_admin := exists (
    select 1
    from public.clinics c
    where c.clinic_id = new.clinic_id
      and c.admin_id = auth.uid()
  );

  if is_subject_nurse and not is_clinic_admin then
    -- nurse updating their own row: only invitation_status may change
    if new.clinic_id is distinct from old.clinic_id
       or new.user_id is distinct from old.user_id
       or new.manage_queue is distinct from old.manage_queue
       or new.manage_appointment is distinct from old.manage_appointment
    then
      raise exception 'nurses may only update invitation_status on staff_permissions';
    end if;

    -- optional: restrict transitions (recommended)
    if old.invitation_status = 'pending'
       and new.invitation_status not in ('accepted', 'rejected')
    then
      raise exception 'invalid invitation_status transition from pending';
    end if;
    if old.invitation_status <> 'pending' and new.invitation_status is distinct from old.invitation_status
    then
      raise exception 'invitation_status can only change from pending';
    end if;

  elsif is_clinic_admin and not is_subject_nurse then
    -- clinic admin updating someone else's row: only manage_queue may change
    if new.clinic_id is distinct from old.clinic_id
       or new.user_id is distinct from old.user_id
       or new.invitation_status is distinct from old.invitation_status
    then
      raise exception 'clinic admins may only update manage_queue on staff_permissions';
    end if;

  elsif is_subject_nurse and is_clinic_admin then
    -- same user is both (unusual): prefer nurse-only rules on own row
    if new.clinic_id is distinct from old.clinic_id
       or new.user_id is distinct from old.user_id
       or new.manage_queue is distinct from old.manage_queue
       or new.manage_appointment is distinct from old.manage_appointment
    then
      raise exception 'nurses may only update invitation_status on staff_permissions';
    end if;

  else
    raise exception 'not authorized to update this staff_permissions row';
  end if;

  return new;
end;$function$
;


  create policy "Allow Patients to submit a Request"
  on "public"."Appointments"
  as permissive
  for insert
  to public
with check (((( SELECT auth.uid() AS uid) = patient_id) AND (appointment_status = 'requested'::public.appointment_status)));



