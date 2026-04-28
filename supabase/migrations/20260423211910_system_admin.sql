-- system admin role support
--
-- changes in this migration:
--   1. widen profiles_role_check to allow 'system_admin'
--   2. replace handle_new_user: block system_admin from signup metadata
--   3. add is_system_admin() security definer helper (avoids rls recursion)
--   4. replace prevent_admin_overreach: carve out system_admin
--   5. add prevent_role_change trigger: regular users cannot change their role
--   6. rls update policy on clinics: system admins can update any clinic
--   7. rls select policy on profiles: system admins can read all profiles

-- ─── 1. widen the role check constraint ───────────────────────────────────────

alter table public.profiles
  drop constraint profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
    check (role = any(array['patient', 'nurse', 'doctor', 'clinic', 'system_admin']));

-- ─── 2. replace handle_new_user ───────────────────────────────────────────────
-- strips system_admin from signup metadata so it can never be self-assigned
-- through the public auth flow. anyone who passes role=system_admin lands as patient.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    case
      when coalesce(new.raw_user_meta_data->>'role', 'patient') = 'system_admin'
        then 'patient'
      else coalesce(new.raw_user_meta_data->>'role', 'patient')
    end,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

-- ─── 3. is_system_admin() helper ──────────────────────────────────────────────
-- security definer so it bypasses rls when querying profiles, preventing
-- infinite recursion in policies that reference this function on the same table.

create or replace function public.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'system_admin'
  );
$$;

-- ─── 4. replace prevent_admin_overreach ───────────────────────────────────────
-- same as before but system_admin users are allowed past the gate.

create or replace function public.prevent_admin_overreach()
returns trigger
language plpgsql
as $$
begin
  -- only enforce for anon/authenticated jwt roles.
  -- service_role and superusers always bypass (supabase dashboard, seeding, etc.)
  if current_setting('request.jwt.role', true) in ('authenticated', 'anon') then
    -- system admins are allowed to change any protected field (e.g. approved)
    if public.is_system_admin() then
      return new;
    end if;

    if new.approved <> old.approved then
      raise exception 'you cannot change the approval status';
    end if;
    if new.clinic_id <> old.clinic_id then
      raise exception 'you cannot change the clinic id';
    end if;
    if new.admin_id <> old.admin_id then
      raise exception 'you cannot change the admin id';
    end if;
  end if;
  return new;
end;
$$;

-- ─── 5. prevent_role_change trigger ───────────────────────────────────────────
-- regular authenticated users cannot change their own role once it is set.
-- service_role, superusers, and system admins are exempt.

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role <> old.role then
    if current_setting('request.jwt.role', true) in ('authenticated', 'anon') then
      -- system admins can update roles (e.g. future user management features)
      if not public.is_system_admin() then
        raise exception 'you cannot change your role';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row
  execute function public.prevent_role_change();

-- ─── 6. rls: system admins can update any clinic ──────────────────────────────

create policy "system admins can update any clinic"
  on public.clinics
  for update
  to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

-- ─── 7. rls: system admins can read all profiles ──────────────────────────────
-- needed so the admin ui can display clinic admin names alongside each clinic.

create policy "system admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_system_admin());
