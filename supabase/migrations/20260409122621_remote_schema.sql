


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."appointment_status" AS ENUM (
    'pending',
    'unseen',
    'canceled',
    'deserted',
    'active',
    'completed'
);


ALTER TYPE "public"."appointment_status" OWNER TO "postgres";


CREATE TYPE "public"."appointmentstatus" AS ENUM (
    'scheduled',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."appointmentstatus" OWNER TO "postgres";


CREATE TYPE "public"."appointmenttypes" AS ENUM (
    'General Check-up',
    'Follow-up',
    'Consultation',
    'Vaccination',
    'Lab Work'
);


ALTER TYPE "public"."appointmenttypes" OWNER TO "postgres";


CREATE TYPE "public"."nurse_license_type" AS ENUM (
    'RN',
    'LPN',
    'LVN',
    'NP'
);


ALTER TYPE "public"."nurse_license_type" OWNER TO "postgres";


CREATE TYPE "public"."queue_status" AS ENUM (
    'pending',
    'waiting',
    'called',
    'in_progress',
    'completed',
    'cancelled',
    'left',
    'no_show'
);


ALTER TYPE "public"."queue_status" OWNER TO "postgres";


CREATE TYPE "public"."request_status" AS ENUM (
    'accepted',
    'unseen',
    'rejected'
);


ALTER TYPE "public"."request_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'patient',
    'clinic_admin',
    'nurse',
    'doctor'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_pending_queue_entry"("p_entry_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_clinic_id  uuid;
  v_next_order integer;
begin
  -- verify caller is a nurse.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'nurse'
  ) then
    raise exception 'only nurses can accept pending entries';
  end if;

  -- preliminary read: find the clinic_id of the pending entry.
  select clinic_id
  into v_clinic_id
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status = 'pending';

  if v_clinic_id is null then
    raise exception 'pending queue entry not found';
  end if;

  -- verify the nurse has manage_queue permission at this clinic.
  -- a nurse assigned to clinic A cannot accept patients at clinic B.
  if not exists (
    select 1 from public.staff_permissions
    where clinic_id = v_clinic_id
      and user_id = auth.uid()
      and manage_queue = true
  ) then
    raise exception 'not authorized to manage queue at this clinic';
  end if;

  -- lock all active rows for this clinic.
  -- this includes pending, waiting, called, and in_progress rows.
  -- pending rows are included so that two concurrent accept operations
  -- cannot both read the same max(queue_order) before either writes.
  perform 1
  from public.queue_entries
  where clinic_id = v_clinic_id
    and is_active = true
  order by queue_order nulls first
  for update;

  -- re-verify: the entry may have been accepted, cancelled, or left
  -- between the preliminary read and the lock.
  if not exists (
    select 1 from public.queue_entries
    where id = p_entry_id
      and is_active = true
      and status = 'pending'
  ) then
    raise exception 'entry is no longer pending';
  end if;

  -- compute the next queue position.
  -- only waiting and called rows hold real positions (>= 1).
  -- if no rows exist, coalesce returns 0, so next_order = 1.
  select coalesce(max(queue_order), 0) + 1
  into v_next_order
  from public.queue_entries
  where clinic_id = v_clinic_id
    and is_active = true
    and status in ('waiting', 'called');

  -- transition: pending -> waiting with the computed position.
  -- the trigger validates this transition (pending -> waiting is allowed).
  update public.queue_entries
  set status = 'waiting',
      queue_order = v_next_order
  where id = p_entry_id;
end;
$$;


ALTER FUNCTION "public"."accept_pending_queue_entry"("p_entry_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."am_i_patient_of_clinic"("p_clinic_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public."Memberships" m
    join public.profiles p
      on p.id = m.user_id
    where m.user_id = auth.uid()
      and m.clinic_id = p_clinic_id
      and p.role = 'patient'
  );
$$;


ALTER FUNCTION "public"."am_i_patient_of_clinic"("p_clinic_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."call_patient"("p_entry_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_clinic_id uuid;
begin
  -- verify caller is a nurse.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'nurse'
  ) then
    raise exception 'only nurses can call patients';
  end if;

  -- preliminary read: get the clinic_id and verify the entry is waiting.
  select clinic_id
  into v_clinic_id
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status = 'waiting';

  if v_clinic_id is null then
    raise exception 'entry not found or not in waiting status';
  end if;

  -- verify clinic-level permission.
  if not exists (
    select 1 from public.staff_permissions
    where clinic_id = v_clinic_id
      and user_id = auth.uid()
      and manage_queue = true
  ) then
    raise exception 'not authorized to manage queue at this clinic';
  end if;

  -- lock all active rows for this clinic.
  perform 1
  from public.queue_entries
  where clinic_id = v_clinic_id
    and is_active = true
  order by queue_order nulls first
  for update;

  -- re-verify: another nurse may have already called this patient,
  -- or the patient may have left between the preliminary read and
  -- the lock acquisition.
  if not exists (
    select 1 from public.queue_entries
    where id = p_entry_id
      and is_active = true
      and status = 'waiting'
  ) then
    raise exception 'entry is no longer in waiting status';
  end if;

  -- transition: waiting -> called.
  -- the trigger validates this transition.
  -- called_at is stamped with the current transaction time.
  -- queue_order is unchanged; the patient keeps their position.
  update public.queue_entries
  set status = 'called',
      called_at = now()
  where id = p_entry_id;
end;
$$;


ALTER FUNCTION "public"."call_patient"("p_entry_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_visit"("p_entry_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_clinic_id uuid;
begin
  -- verify caller is a nurse.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'nurse'
  ) then
    raise exception 'only nurses can complete visits';
  end if;

  -- preliminary read.
  select clinic_id
  into v_clinic_id
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status = 'in_progress';

  if v_clinic_id is null then
    raise exception 'entry not found or not in_progress';
  end if;

  -- verify clinic-level permission.
  if not exists (
    select 1 from public.staff_permissions
    where clinic_id = v_clinic_id
      and user_id = auth.uid()
      and manage_queue = true
  ) then
    raise exception 'not authorized to manage queue at this clinic';
  end if;

  -- lock all active rows for this clinic.
  -- while complete_visit doesn't change queue ordering, locking
  -- maintains the uniform one-operation-at-a-time guarantee per clinic.
  perform 1
  from public.queue_entries
  where clinic_id = v_clinic_id
    and is_active = true
  order by queue_order nulls first
  for update;

  -- re-verify after lock.
  if not exists (
    select 1 from public.queue_entries
    where id = p_entry_id
      and is_active = true
      and status = 'in_progress'
  ) then
    raise exception 'entry is no longer in_progress';
  end if;

  -- transition: in_progress -> completed.
  -- the trigger validates this transition and sets is_active = false.
  -- completed_at is stamped with the current transaction time.
  update public.queue_entries
  set status = 'completed',
      completed_at = now()
  where id = p_entry_id;
end;
$$;


ALTER FUNCTION "public"."complete_visit"("p_entry_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_appointment_types"() RETURNS TABLE("value" "text")
    LANGUAGE "sql" STABLE
    AS $$
  select unnest(enum_range(null::public.appointmenttypes))::text as value;
$$;


ALTER FUNCTION "public"."get_appointment_types"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_doctor_user"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.role = 'doctor'
  );
$$;


ALTER FUNCTION "public"."is_doctor_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_patient_user"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.role = 'patient'
  );
$$;


ALTER FUNCTION "public"."is_patient_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_staff_of_clinic"("p_clinic_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public."Memberships" m
    join public.profiles p
      on p.id = m.user_id
    where m.user_id = auth.uid()
      and m.clinic_id = p_clinic_id
      and p.role in ('nurse', 'doctor', 'clinic_admin')
  );
$$;


ALTER FUNCTION "public"."is_staff_of_clinic"("p_clinic_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_queue"("p_clinic_id" "uuid", "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$declare
  v_entry_id uuid;
  v_patient_name text;
begin
  -- verify caller is a patient.
  -- this is also enforced by the rls insert policy, but the explicit
  -- check gives a clear error message instead of a generic rls denial.
  -- also fetches the patient's display name for denormalization into queue_entries.
  select p.full_name into v_patient_name
  from public.profiles p
  where p.id = auth.uid() and p.role = 'patient';

  if not found then
    raise exception 'only patients can join queue';
  end if;

  -- verify the clinic exists.
  -- without this check, the foreign key on clinic_id would raise a
  -- less-readable constraint violation error.
  if not exists (
    select 1 from public.clinics
    where clinic_id = p_clinic_id
  ) then
    raise exception 'clinic not found';
  end if;

  -- insert the pending entry.
  -- queue_order is null because the patient is not yet positioned.
  -- queue_date gets current_date automatically from the column default.
  -- is_active is true by column default.
  -- the rls insert policy validates: patient_id = auth.uid(),
  -- role = patient, status = pending, is_active = true.
  -- patient_name is denormalized from profiles to avoid rls cross-table issues.
  insert into public.queue_entries (
    clinic_id, patient_id, status, notes, queue_order, patient_name
  ) values (
    p_clinic_id, auth.uid(), 'pending', p_notes, null, coalesce(v_patient_name, 'patient')
  )
  returning id into v_entry_id;

  return v_entry_id;
end;$$;


ALTER FUNCTION "public"."join_queue"("p_clinic_id" "uuid", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_queue"("p_entry_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_clinic_id uuid;
  v_old_order integer;
  v_status    public.queue_status;
  v_rec       record;
begin
  -- verify caller is a patient.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'patient'
  ) then
    raise exception 'only patients can leave queue';
  end if;

  -- preliminary read: find the clinic so we can scope the lock.
  -- also verify: the row exists, belongs to the caller, is active,
  -- and is in a status the patient can leave from.
  select clinic_id
  into v_clinic_id
  from public.queue_entries
  where id = p_entry_id
    and patient_id = auth.uid()
    and is_active = true
    and status in ('pending', 'waiting');

  if v_clinic_id is null then
    raise exception 'queue entry not found, not yours, or not in a leavable state';
  end if;

  -- lock all active rows for this clinic.
  -- this serializes against every other queue operation at this clinic:
  -- other leave_queue calls, accept, reorder, call, start_visit, etc.
  -- rows are locked in queue_order order (nulls first for pending rows)
  -- to ensure a deterministic lock acquisition order and avoid deadlocks.
  perform 1
  from public.queue_entries
  where clinic_id = v_clinic_id
    and is_active = true
  order by queue_order nulls first
  for update;

  -- re-read after lock: the row's state may have changed between the
  -- preliminary read and the lock acquisition.
  -- example: a nurse could have called the patient (waiting -> called)
  -- in the gap. in that case, v_status would not match and we raise.
  select status, queue_order
  into v_status, v_old_order
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status in ('pending', 'waiting');

  if v_status is null then
    raise exception 'entry is no longer in a leavable state';
  end if;

  -- transition: status -> left.
  -- the before-update trigger (14_trigger.sql) validates this transition
  -- and auto-sets is_active = false.
  update public.queue_entries
  set status = 'left'
  where id = p_entry_id;

  -- compact queue positions if the patient was positioned (waiting).
  -- pending patients have null queue_order, so no compaction needed.
  --
  -- the loop processes rows in ascending queue_order so each row shifts
  -- into the slot that was just freed by the row before it:
  --   position 4 -> 3 (slot 3 was the leaving patient's position)
  --   position 5 -> 4 (slot 4 was just freed by the previous shift)
  --   position 6 -> 5 (slot 5 was just freed)
  --   etc.
  --
  -- this ordering is critical: if rows were processed in descending
  -- order, a row would try to shift into a slot still occupied by an
  -- unprocessed row, violating the unique index.
  if v_status = 'waiting' and v_old_order is not null then
    for v_rec in (
      select id
      from public.queue_entries
      where clinic_id = v_clinic_id
        and is_active = true
        and status in ('waiting', 'called')
        and queue_order > v_old_order
      order by queue_order asc
    ) loop
      update public.queue_entries
      set queue_order = queue_order - 1
      where id = v_rec.id;
    end loop;
  end if;
end;
$$;


ALTER FUNCTION "public"."leave_queue"("p_entry_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_no_show"("p_entry_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_clinic_id uuid;
  v_old_order integer;
  v_rec       record;
begin
  -- verify caller is a nurse.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'nurse'
  ) then
    raise exception 'only nurses can mark no-show';
  end if;

  -- preliminary read.
  select clinic_id, queue_order
  into v_clinic_id, v_old_order
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status = 'called';

  if v_clinic_id is null then
    raise exception 'entry not found or not in called status';
  end if;

  -- verify clinic-level permission.
  if not exists (
    select 1 from public.staff_permissions
    where clinic_id = v_clinic_id
      and user_id = auth.uid()
      and manage_queue = true
  ) then
    raise exception 'not authorized to manage queue at this clinic';
  end if;

  -- lock all active rows for this clinic.
  perform 1
  from public.queue_entries
  where clinic_id = v_clinic_id
    and is_active = true
  order by queue_order nulls first
  for update;

  -- re-read position after lock.
  select queue_order
  into v_old_order
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status = 'called';

  if v_old_order is null then
    raise exception 'entry is no longer in called status';
  end if;

  -- transition: called -> no_show.
  -- queue_order is set to -1 (marker for no_show).
  -- the trigger validates this transition and sets is_active = false.
  update public.queue_entries
  set status = 'no_show',
      queue_order = -1
  where id = p_entry_id;

  -- compact: shift everyone behind the removed position forward.
  -- the no_show row is now is_active = false (set by trigger), so
  -- it is excluded from this query automatically.
  for v_rec in (
    select id
    from public.queue_entries
    where clinic_id = v_clinic_id
      and is_active = true
      and status in ('waiting', 'called')
      and queue_order > v_old_order
    order by queue_order asc
  ) loop
    update public.queue_entries
    set queue_order = queue_order - 1
    where id = v_rec.id;
  end loop;
end;
$$;


ALTER FUNCTION "public"."mark_no_show"("p_entry_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."patient_can_view_doctor_profile"("p_target_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."patient_can_view_doctor_profile"("p_target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_admin_overreach"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- only enforce restrictions for the anon/authenticated api roles.
  -- superusers and service_role bypass this check so admins can
  -- approve clinics from the supabase dashboard or service-role calls.
  if current_setting('request.jwt.role', true) in ('authenticated', 'anon') then
    if NEW.approved <> OLD.approved then
      raise exception 'you cannot change the approval status';
    end if;
    if NEW.clinic_id <> OLD.clinic_id then
      raise exception 'you cannot change the clinic id';
    end if;
    if NEW.admin_id <> OLD.admin_id then
      raise exception 'you cannot change the admin id';
    end if;
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."prevent_admin_overreach"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."queue_entries_before_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- check 1: archive protection.
  -- once a row has is_active = false, it is frozen forever.
  -- no column on this row may be changed by anyone, including
  -- security-definer rpc functions.
  -- this is the first check because if the row is archived,
  -- nothing else matters.
  if old.is_active = false then
    raise exception 'cannot modify archived queue entry (id=%)', old.id;
  end if;

  -- check 2: status transition validation.
  -- only runs when the status column is actually changing.
  -- if only queue_order or other columns change (e.g. during
  -- compaction or reorder), this check is skipped.
  if old.status is distinct from new.status then
    if not (
      (old.status = 'pending'       and new.status in ('waiting', 'left', 'cancelled'))
      or (old.status = 'waiting'    and new.status in ('called', 'left'))
      or (old.status = 'called'     and new.status in ('in_progress', 'no_show'))
      or (old.status = 'in_progress' and new.status = 'completed')
    ) then
      raise exception 'invalid queue status transition: % -> %', old.status, new.status;
    end if;
  end if;

  -- check 3: auto-deactivation.
  -- when a row enters a terminal status, is_active is forced to false.
  -- this happens regardless of what the caller set is_active to, so
  -- rpc functions don't need to explicitly set it.
  -- terminal statuses: completed, cancelled, left, no_show.
  if new.status in ('completed', 'cancelled', 'left', 'no_show') then
    new.is_active = false;
  end if;

  -- check 4: manual deactivation guard.
  -- prevents any code from setting is_active = false for a row that
  -- is still in a non-terminal status. this closes a loophole where
  -- a crafted update could archive a row without going through a
  -- proper status transition.
  if new.is_active = false and new.status not in ('completed', 'cancelled', 'left', 'no_show') then
    raise exception 'is_active can only be false for terminal statuses';
  end if;

  -- check 5: column immutability.
  -- patient_id, clinic_id, and queue_date must never change after
  -- the initial insert. these columns define the identity and context
  -- of the queue entry.
  -- changing patient_id would reassign a queue entry to a different
  -- person. changing clinic_id would move it between clinics. changing
  -- queue_date would corrupt the audit trail.
  if new.patient_id is distinct from old.patient_id then
    raise exception 'patient_id cannot be changed';
  end if;
  if new.clinic_id is distinct from old.clinic_id then
    raise exception 'clinic_id cannot be changed';
  end if;
  if new.queue_date is distinct from old.queue_date then
    raise exception 'queue_date cannot be changed';
  end if;

  -- check 6: auto-update updated_at.
  -- replaces the old trg_queue_entries_set_updated_at trigger.
  -- sets updated_at to the current transaction timestamp so every
  -- modification is accurately recorded for audit and sorting.
  new.updated_at = now();

  return new;
end;
$$;


ALTER FUNCTION "public"."queue_entries_before_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_queue_entry"("p_clinic_id" "uuid", "p_entry_id" "uuid", "p_new_order" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_old_order integer;
  v_max_order integer;
  v_rec       record;
begin
  -- validate input.
  if p_new_order is null or p_new_order < 1 then
    raise exception 'new order must be >= 1';
  end if;

  -- verify caller is a nurse.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'nurse'
  ) then
    raise exception 'only nurses can reorder queue';
  end if;

  -- verify clinic-level permission.
  if not exists (
    select 1 from public.staff_permissions
    where clinic_id = p_clinic_id
      and user_id = auth.uid()
      and manage_queue = true
  ) then
    raise exception 'not authorized to manage queue at this clinic';
  end if;

  -- lock all active rows for this clinic.
  perform 1
  from public.queue_entries
  where clinic_id = p_clinic_id
    and is_active = true
  order by queue_order nulls first
  for update;

  -- read the target row's current position.
  -- the row must be in the active queue (waiting or called) and
  -- must belong to the specified clinic.
  select queue_order
  into v_old_order
  from public.queue_entries
  where id = p_entry_id
    and clinic_id = p_clinic_id
    and is_active = true
    and status in ('waiting', 'called');

  if v_old_order is null then
    raise exception 'queue entry not found or not in active queue';
  end if;

  -- find the current max position for clamping.
  select coalesce(max(queue_order), 0)
  into v_max_order
  from public.queue_entries
  where clinic_id = p_clinic_id
    and is_active = true
    and status in ('waiting', 'called');

  if v_max_order = 0 then
    raise exception 'no active queue entries';
  end if;

  -- clamp: if the requested position exceeds the queue size,
  -- move the patient to the last position instead.
  if p_new_order > v_max_order then
    p_new_order := v_max_order;
  end if;

  -- no-op: already at the requested position.
  if p_new_order = v_old_order then
    return;
  end if;

  -- phase 1: move the target to a temporary position far outside the
  -- active range. this prevents the target from conflicting with rows
  -- being shifted in phase 2. the value max + 1000000 is arbitrary but
  -- guaranteed unique (all real positions are <= max, and the full set
  -- is locked so no new positions can appear).
  update public.queue_entries
  set queue_order = v_max_order + 1000000
  where id = p_entry_id;

  if p_new_order < v_old_order then
    -- phase 2a: moving toward front (smaller position number).
    -- shift rows in [new_order, old_order - 1] by +1.
    -- process in descending order so each row moves into the slot
    -- that was just vacated by the row above it.
    --
    -- example: shifting positions 2,3 to 3,4.
    -- descending: 3->4 first (4 is free because target moved out),
    --             then 2->3 (3 is now free).
    for v_rec in (
      select id
      from public.queue_entries
      where clinic_id = p_clinic_id
        and is_active = true
        and status in ('waiting', 'called')
        and id <> p_entry_id
        and queue_order >= p_new_order
        and queue_order < v_old_order
      order by queue_order desc
    ) loop
      update public.queue_entries
      set queue_order = queue_order + 1
      where id = v_rec.id;
    end loop;
  else
    -- phase 2b: moving toward back (larger position number).
    -- shift rows in [old_order + 1, new_order] by -1.
    -- process in ascending order so each row moves into the slot
    -- that was just vacated by the row below it.
    --
    -- example: shifting positions 3,4 to 2,3.
    -- ascending: 3->2 first (2 is free because target moved out),
    --            then 4->3 (3 is now free).
    for v_rec in (
      select id
      from public.queue_entries
      where clinic_id = p_clinic_id
        and is_active = true
        and status in ('waiting', 'called')
        and id <> p_entry_id
        and queue_order > v_old_order
        and queue_order <= p_new_order
      order by queue_order asc
    ) loop
      update public.queue_entries
      set queue_order = queue_order - 1
      where id = v_rec.id;
    end loop;
  end if;

  -- phase 3: place the target in its final position.
  -- the slot at p_new_order is now free because the row that was there
  -- has been shifted away in phase 2.
  update public.queue_entries
  set queue_order = p_new_order
  where id = p_entry_id;
end;
$$;


ALTER FUNCTION "public"."reorder_queue_entry"("p_clinic_id" "uuid", "p_entry_id" "uuid", "p_new_order" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."staff_permissions_enforce_column_updates"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
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
    then
      raise exception 'nurses may only update invitation_status on staff_permissions';
    end if;

  else
    raise exception 'not authorized to update this staff_permissions row';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."staff_permissions_enforce_column_updates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_visit"("p_entry_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_clinic_id uuid;
  v_old_order integer;
  v_rec       record;
begin
  -- verify caller is a nurse.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'nurse'
  ) then
    raise exception 'only nurses can start visits';
  end if;

  -- preliminary read: get clinic_id and current position.
  select clinic_id, queue_order
  into v_clinic_id, v_old_order
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status = 'called';

  if v_clinic_id is null then
    raise exception 'entry not found or not in called status';
  end if;

  -- verify clinic-level permission.
  if not exists (
    select 1 from public.staff_permissions
    where clinic_id = v_clinic_id
      and user_id = auth.uid()
      and manage_queue = true
  ) then
    raise exception 'not authorized to manage queue at this clinic';
  end if;

  -- lock all active rows for this clinic.
  perform 1
  from public.queue_entries
  where clinic_id = v_clinic_id
    and is_active = true
  order by queue_order nulls first
  for update;

  -- re-read position after lock (it may have changed if a reorder
  -- was in progress when we acquired the lock).
  select queue_order
  into v_old_order
  from public.queue_entries
  where id = p_entry_id
    and is_active = true
    and status = 'called';

  if v_old_order is null then
    raise exception 'entry is no longer in called status';
  end if;

  -- transition: called -> in_progress.
  -- queue_order is set to 0 (out of position-based queue).
  -- started_at is stamped with the current transaction time.
  -- the trigger validates this transition.
  update public.queue_entries
  set status = 'in_progress',
      queue_order = 0,
      started_at = now()
  where id = p_entry_id;

  -- compact: shift everyone behind the removed position forward.
  -- after setting queue_order = 0 above, the old position is vacated.
  -- the loop processes remaining waiting/called rows in ascending
  -- order so each row shifts into the slot freed by the previous one.
  for v_rec in (
    select id
    from public.queue_entries
    where clinic_id = v_clinic_id
      and is_active = true
      and status in ('waiting', 'called')
      and queue_order > v_old_order
    order by queue_order asc
  ) loop
    update public.queue_entries
    set queue_order = queue_order - 1
    where id = v_rec.id;
  end loop;
end;
$$;


ALTER FUNCTION "public"."start_visit"("p_entry_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Appointments" (
    "Appointment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appointment_date" timestamp without time zone,
    "patient_id" "uuid" DEFAULT "gen_random_uuid"(),
    "clinic_id" "uuid" DEFAULT "gen_random_uuid"(),
    "clinician_id" "uuid" DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checkin_at" timestamp without time zone,
    "seen_at" timestamp without time zone,
    "visit_type" "public"."appointmenttypes",
    "nurse_note" "text",
    "patient_note" "text",
    "appointment_status" "public"."appointment_status" DEFAULT 'unseen'::"public"."appointment_status" NOT NULL
);


ALTER TABLE "public"."Appointments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."Appointments"."appointment_status" IS 'keep track of the appointment''s state in it''s life cycle';



CREATE TABLE IF NOT EXISTS "public"."Memberships" (
    "clinic_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Memberships" OWNER TO "postgres";


COMMENT ON TABLE "public"."Memberships" IS 'establish a patient as a patient to many clinics, etc.';



CREATE TABLE IF NOT EXISTS "public"."Queues" (
    "queue_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "queue_position" integer,
    "appointment_id" "uuid" DEFAULT "gen_random_uuid"(),
    "patient_id" "uuid",
    "clinic_id" "uuid" DEFAULT "gen_random_uuid"(),
    "checkin_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Queues" OWNER TO "postgres";


COMMENT ON TABLE "public"."Queues" IS 'Queues between clinics';



CREATE TABLE IF NOT EXISTS "public"."clinics" (
    "clinic_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "clinic_name" "text" NOT NULL,
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "specialty" "text",
    "description" "text",
    "approved" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clinics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['patient'::"text", 'nurse'::"text", 'doctor'::"text", 'clinic'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."appointmentlist_display" WITH ("security_invoker"='on') AS
 SELECT "a"."Appointment_id",
    "a"."appointment_date",
    "u"."full_name" AS "patient_name",
    "u"."email" AS "patient_email",
    "d"."full_name" AS "clinician_name",
    "c"."clinic_name",
    "a"."checkin_at",
    "a"."seen_at",
    "a"."visit_type",
    "a"."created_at",
    "a"."nurse_note",
    "a"."patient_note",
    "a"."appointment_status",
    "a"."patient_id",
    "a"."clinician_id",
    "a"."clinic_id"
   FROM ((("public"."Appointments" "a"
     JOIN "public"."profiles" "u" ON (("a"."patient_id" = "u"."id")))
     JOIN "public"."profiles" "d" ON (("a"."clinician_id" = "d"."id")))
     JOIN "public"."clinics" "c" ON (("a"."clinic_id" = "c"."clinic_id")));


ALTER VIEW "public"."appointmentlist_display" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."appointmentlist_display2" WITH ("security_invoker"='on') AS
 SELECT "a"."Appointment_id",
    "a"."appointment_date",
    "u"."full_name" AS "patient_name",
    "u"."email" AS "patient_email",
    "d"."full_name" AS "clinician_name",
    "c"."clinic_name",
    "a"."checkin_at",
    "a"."seen_at",
    "a"."visit_type",
    "a"."clinic_id"
   FROM ((("public"."Appointments" "a"
     LEFT JOIN "public"."profiles" "u" ON (("a"."patient_id" = "u"."id")))
     LEFT JOIN "public"."profiles" "d" ON (("a"."clinician_id" = "d"."id")))
     LEFT JOIN "public"."clinics" "c" ON (("a"."clinic_id" = "c"."clinic_id")));


ALTER VIEW "public"."appointmentlist_display2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appt_creation_requests" (
    "Appointment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appointment_date" timestamp without time zone,
    "patient_id" "uuid" DEFAULT "gen_random_uuid"(),
    "clinic_id" "uuid" DEFAULT "gen_random_uuid"(),
    "clinician_id" "uuid" DEFAULT "gen_random_uuid"(),
    "visit_type" "public"."appointmenttypes",
    "patient_notes" "text",
    "nurse_notes" "text",
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "request_status" "public"."request_status" DEFAULT 'unseen'::"public"."request_status"
);


ALTER TABLE "public"."appt_creation_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."appt_creation_requests" IS 'NOTE: uuid is not carried over to the appointment''s table. This prevent duplicate UUIDs in the appointment table';



CREATE OR REPLACE VIEW "public"."appointmentreq_display" WITH ("security_invoker"='on') AS
 SELECT "a"."Appointment_id",
    "a"."appointment_date",
    "u"."email" AS "patient_email",
    "u"."full_name" AS "patient_name",
    "d"."full_name" AS "clinician_name",
    "c"."clinic_name",
    "a"."visit_type",
    "a"."patient_notes",
    "a"."nurse_notes",
    "a"."requested_at",
    "a"."request_status",
    "a"."patient_id",
    "a"."clinician_id",
    "a"."clinic_id"
   FROM ((("public"."appt_creation_requests" "a"
     JOIN "public"."profiles" "u" ON (("a"."patient_id" = "u"."id")))
     JOIN "public"."profiles" "d" ON (("a"."clinician_id" = "d"."id")))
     JOIN "public"."clinics" "c" ON (("a"."clinic_id" = "c"."clinic_id")));


ALTER VIEW "public"."appointmentreq_display" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinic_admin" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "phone" "text",
    "title" "text",
    "clinic_created" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clinic_admin" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."doctor_info" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "birthday" "date",
    "license_num" bigint,
    "phone" bigint,
    "specialization" "text",
    "npi_number" "text"
);


ALTER TABLE "public"."doctor_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medical_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "text" NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "visit_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "diagnosis" "text" NOT NULL,
    "symptoms" "text",
    "observations" "text",
    "treatment_plan" "text",
    "prescriptions" "text",
    "follow_up_recommended" boolean DEFAULT false,
    "follow_up_notes" "text",
    "doctor_name" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."medical_history" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."membernamerole" WITH ("security_invoker"='on') AS
 SELECT "c"."clinic_name",
    "u"."full_name",
    "u"."role",
    "m"."created_at",
    "m"."user_id",
    "m"."clinic_id"
   FROM (("public"."Memberships" "m"
     LEFT JOIN "public"."profiles" "u" ON (("m"."user_id" = "u"."id")))
     LEFT JOIN "public"."clinics" "c" ON (("m"."clinic_id" = "c"."clinic_id")));


ALTER VIEW "public"."membernamerole" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nurse_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gender" "text",
    "license" "text",
    "license_num" bigint,
    "phone" bigint,
    "name" "text",
    "birthday" "date"
);


ALTER TABLE "public"."nurse_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "age" smallint,
    "gender" "text",
    "birthday" "date",
    "blood_type" "text",
    "name" "text"
);


ALTER TABLE "public"."patient_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practicioner_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "license" "text",
    "license_number" bigint
);


ALTER TABLE "public"."practicioner_info" OWNER TO "postgres";


COMMENT ON TABLE "public"."practicioner_info" IS 'to keep track of the doctors, the details, and etc.';



CREATE TABLE IF NOT EXISTS "public"."queue_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "queue_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "checked_in_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."queue_status" DEFAULT 'pending'::"public"."queue_status" NOT NULL,
    "notes" "text",
    "queue_order" integer,
    "called_at" timestamp with time zone,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "patient_name" "text",
    CONSTRAINT "active_for_non_terminal" CHECK ((("status" = ANY (ARRAY['completed'::"public"."queue_status", 'cancelled'::"public"."queue_status", 'left'::"public"."queue_status", 'no_show'::"public"."queue_status"])) OR ("is_active" = true))),
    CONSTRAINT "queue_order_status_rules" CHECK ((("is_active" = false) OR (("status" = 'pending'::"public"."queue_status") AND ("queue_order" IS NULL)) OR (("status" = ANY (ARRAY['waiting'::"public"."queue_status", 'called'::"public"."queue_status"])) AND ("queue_order" IS NOT NULL) AND ("queue_order" >= 1)) OR (("status" = 'in_progress'::"public"."queue_status") AND ("queue_order" = 0))))
);


ALTER TABLE "public"."queue_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "manage_queue" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "invitation_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "staff_permissions_invitation_status_check" CHECK (("invitation_status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."staff_permissions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Appointments"
    ADD CONSTRAINT "Appointments_pkey" PRIMARY KEY ("Appointment_id");



ALTER TABLE ONLY "public"."Memberships"
    ADD CONSTRAINT "Memberships_pkey" PRIMARY KEY ("clinic_id", "user_id");



ALTER TABLE ONLY "public"."patient_info"
    ADD CONSTRAINT "Patients Info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Queues"
    ADD CONSTRAINT "Queues_pkey" PRIMARY KEY ("queue_id");



ALTER TABLE ONLY "public"."appt_creation_requests"
    ADD CONSTRAINT "appt_creation_requests_pkey" PRIMARY KEY ("Appointment_id");



ALTER TABLE ONLY "public"."clinic_admin"
    ADD CONSTRAINT "clinic_admin_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinics"
    ADD CONSTRAINT "clinics_admin_id_key" UNIQUE ("admin_id");



ALTER TABLE ONLY "public"."clinics"
    ADD CONSTRAINT "clinics_pkey" PRIMARY KEY ("clinic_id");



ALTER TABLE ONLY "public"."doctor_info"
    ADD CONSTRAINT "doctor_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_history"
    ADD CONSTRAINT "medical_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nurse_info"
    ADD CONSTRAINT "nurse_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practicioner_info"
    ADD CONSTRAINT "practicioner_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."queue_entries"
    ADD CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_permissions"
    ADD CONSTRAINT "staff_permissions_clinic_user_unique" UNIQUE ("clinic_id", "user_id");



ALTER TABLE ONLY "public"."staff_permissions"
    ADD CONSTRAINT "staff_permissions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_medical_history_doctor" ON "public"."medical_history" USING "btree" ("doctor_id");



CREATE INDEX "idx_medical_history_patient" ON "public"."medical_history" USING "btree" ("patient_id");



CREATE INDEX "queue_entries_clinic_status_order_idx" ON "public"."queue_entries" USING "btree" ("clinic_id", "status", "queue_order") WHERE ("is_active" = true);



CREATE UNIQUE INDEX "queue_entries_one_active_per_patient" ON "public"."queue_entries" USING "btree" ("patient_id") WHERE ("is_active" = true);



CREATE INDEX "queue_entries_patient_idx" ON "public"."queue_entries" USING "btree" ("patient_id", "created_at" DESC);



CREATE UNIQUE INDEX "queue_entries_unique_order_per_clinic" ON "public"."queue_entries" USING "btree" ("clinic_id", "queue_order") WHERE (("is_active" = true) AND ("status" = ANY (ARRAY['waiting'::"public"."queue_status", 'called'::"public"."queue_status"])));



CREATE INDEX "staff_permissions_invite_nurse_pending_idx" ON "public"."staff_permissions" USING "btree" ("user_id", "invitation_status") WHERE ("invitation_status" = 'pending'::"text");



CREATE INDEX "staff_permissions_lookup_idx" ON "public"."staff_permissions" USING "btree" ("clinic_id", "user_id", "manage_queue");



CREATE UNIQUE INDEX "staff_permissions_unique_clinic_user" ON "public"."staff_permissions" USING "btree" ("clinic_id", "user_id");



CREATE OR REPLACE TRIGGER "clinics_prevent_admin_overreach" BEFORE UPDATE ON "public"."clinics" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_admin_overreach"();



CREATE OR REPLACE TRIGGER "trg_queue_entries_before_update" BEFORE UPDATE ON "public"."queue_entries" FOR EACH ROW EXECUTE FUNCTION "public"."queue_entries_before_update"();



CREATE OR REPLACE TRIGGER "trg_staff_permissions_enforce_column_updates" BEFORE UPDATE ON "public"."staff_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."staff_permissions_enforce_column_updates"();



CREATE OR REPLACE TRIGGER "trg_staff_permissions_set_updated_at" BEFORE UPDATE ON "public"."staff_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."Appointments"
    ADD CONSTRAINT "Appointments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("clinic_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Appointments"
    ADD CONSTRAINT "Appointments_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Appointments"
    ADD CONSTRAINT "Appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Memberships"
    ADD CONSTRAINT "Memberships_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("clinic_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Memberships"
    ADD CONSTRAINT "Memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_info"
    ADD CONSTRAINT "Patients Info_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Queues"
    ADD CONSTRAINT "Queues_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."Appointments"("Appointment_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Queues"
    ADD CONSTRAINT "Queues_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("clinic_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Queues"
    ADD CONSTRAINT "Queues_patient_id_fkey1" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appt_creation_requests"
    ADD CONSTRAINT "appointment_requests_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("clinic_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appt_creation_requests"
    ADD CONSTRAINT "appointment_requests_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appt_creation_requests"
    ADD CONSTRAINT "appointment_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinic_admin"
    ADD CONSTRAINT "clinic_admin_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinics"
    ADD CONSTRAINT "clinics_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."doctor_info"
    ADD CONSTRAINT "doctor_info_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medical_history"
    ADD CONSTRAINT "medical_history_doctor_fkey" FOREIGN KEY ("doctor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nurse_info"
    ADD CONSTRAINT "nurse_info_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practicioner_info"
    ADD CONSTRAINT "practicioner_info_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."queue_entries"
    ADD CONSTRAINT "queue_entries_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("clinic_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."queue_entries"
    ADD CONSTRAINT "queue_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_permissions"
    ADD CONSTRAINT "staff_permissions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("clinic_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_permissions"
    ADD CONSTRAINT "staff_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."Appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Clinic admins can manage all memberships in their clinic" ON "public"."Memberships" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."clinics" "c"
  WHERE (("c"."clinic_id" = "Memberships"."clinic_id") AND ("c"."admin_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."clinics" "c"
  WHERE (("c"."clinic_id" = "Memberships"."clinic_id") AND ("c"."admin_id" = "auth"."uid"())))));



CREATE POLICY "Clinic staff can view patient profiles in their clinic" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."Memberships" "target"
  WHERE (("target"."user_id" = "profiles"."id") AND "public"."is_staff_of_clinic"("target"."clinic_id"))))));



CREATE POLICY "Doctors can insert own info" ON "public"."doctor_info" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Doctors can insert own notes" ON "public"."medical_history" FOR INSERT WITH CHECK (("auth"."uid"() = "doctor_id"));



CREATE POLICY "Doctors can update own info" ON "public"."doctor_info" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Doctors can update own notes" ON "public"."medical_history" FOR UPDATE USING (("auth"."uid"() = "doctor_id"));



CREATE POLICY "Doctors can view notes" ON "public"."medical_history" FOR SELECT USING (("auth"."uid"() = "doctor_id"));



CREATE POLICY "Doctors can view own info" ON "public"."doctor_info" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "EmployeesAccessApptRequests" ON "public"."appt_creation_requests" USING ((EXISTS ( SELECT 1
   FROM ("public"."Memberships" "m"
     JOIN "public"."profiles" "p" ON (("p"."id" = "m"."user_id")))
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."clinic_id" = "appt_creation_requests"."clinic_id") AND ("p"."role" = ANY (ARRAY['nurse'::"text", 'doctor'::"text", 'clinic'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."Memberships" "m"
     JOIN "public"."profiles" "p" ON (("p"."id" = "m"."user_id")))
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."clinic_id" = "appt_creation_requests"."clinic_id") AND ("p"."role" = ANY (ARRAY['nurse'::"text", 'doctor'::"text", 'clinic'::"text"]))))));



CREATE POLICY "Enable Patients to view their own data only" ON "public"."Appointments" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "patient_id"));



CREATE POLICY "Enable read access for all users" ON "public"."Memberships" FOR SELECT USING (true);



CREATE POLICY "Enable users to view their own data only" ON "public"."Queues" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "patient_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."appt_creation_requests" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "patient_id"));



ALTER TABLE "public"."Memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Patients can create Requests" ON "public"."appt_creation_requests" FOR INSERT TO "authenticated" WITH CHECK ((("patient_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."Memberships" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."clinic_id" = "appt_creation_requests"."clinic_id"))))));



CREATE POLICY "Patients can view doctor profiles in their clinic" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."patient_can_view_doctor_profile"("id")));



CREATE POLICY "Patients can view doctors in their clinic" ON "public"."Memberships" FOR SELECT TO "authenticated" USING (("public"."am_i_patient_of_clinic"("clinic_id") AND "public"."is_doctor_user"("user_id")));



ALTER TABLE "public"."Queues" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Staff can update patient members in their clinic" ON "public"."Memberships" TO "authenticated" USING (("public"."is_staff_of_clinic"("clinic_id") AND "public"."is_patient_user"("user_id"))) WITH CHECK (("public"."is_staff_of_clinic"("clinic_id") AND "public"."is_patient_user"("user_id")));



CREATE POLICY "admin can create own clinic" ON "public"."clinics" FOR INSERT WITH CHECK (("auth"."uid"() = "admin_id"));



CREATE POLICY "admin can read own clinic" ON "public"."clinics" FOR SELECT USING (("auth"."uid"() = "admin_id"));



CREATE POLICY "admin can update own clinic" ON "public"."clinics" FOR UPDATE USING (("auth"."uid"() = "admin_id"));



CREATE POLICY "appointmentManagement" ON "public"."Appointments" USING ((EXISTS ( SELECT 1
   FROM ("public"."Memberships" "m"
     JOIN "public"."profiles" "p" ON (("p"."id" = "m"."user_id")))
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."clinic_id" = "Appointments"."clinic_id") AND ("p"."role" = ANY (ARRAY['nurse'::"text", 'doctor'::"text", 'clinic'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."Memberships" "m"
     JOIN "public"."profiles" "p" ON (("p"."id" = "m"."user_id")))
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."clinic_id" = "Appointments"."clinic_id") AND ("p"."role" = ANY (ARRAY['nurse'::"text", 'doctor'::"text", 'clinic'::"text"]))))));



ALTER TABLE "public"."appt_creation_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clinic admins can insert own row" ON "public"."clinic_admin" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "clinic admins can read nurse profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("role" = 'nurse'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."clinics" "c"
  WHERE ("c"."admin_id" = "auth"."uid"())))));



CREATE POLICY "clinic admins can read own row" ON "public"."clinic_admin" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "clinic admins can update own row" ON "public"."clinic_admin" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."clinic_admin" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clinics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clinics_public_read" ON "public"."clinics" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."doctor_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medical_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nurse_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_info" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patients can see approved clinics" ON "public"."clinics" FOR SELECT USING (("approved" = true));



ALTER TABLE "public"."practicioner_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."queue_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "queue_insert_patient_pending" ON "public"."queue_entries" FOR INSERT TO "authenticated" WITH CHECK ((("patient_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("lower"("p"."role") = 'patient'::"text")))) AND ("status" = 'pending'::"public"."queue_status") AND ("is_active" = true)));



CREATE POLICY "queue_select_nurse_clinic" ON "public"."queue_entries" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'nurse'::"text")))) AND (EXISTS ( SELECT 1
   FROM "public"."staff_permissions" "sp"
  WHERE (("sp"."clinic_id" = "queue_entries"."clinic_id") AND ("sp"."user_id" = "auth"."uid"()) AND ("sp"."manage_queue" = true))))));



CREATE POLICY "queue_select_own" ON "public"."queue_entries" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



ALTER TABLE "public"."staff_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staff_permissions_delete_admin_owned_clinic" ON "public"."staff_permissions" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."clinics" "c"
  WHERE (("c"."clinic_id" = "staff_permissions"."clinic_id") AND ("c"."admin_id" = "auth"."uid"())))));



CREATE POLICY "staff_permissions_insert_admin_owned_clinic" ON "public"."staff_permissions" FOR INSERT TO "authenticated" WITH CHECK ((("invitation_status" = 'pending'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."clinics" "c"
  WHERE (("c"."clinic_id" = "staff_permissions"."clinic_id") AND ("c"."admin_id" = "auth"."uid"())))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "staff_permissions"."user_id") AND ("p"."role" = 'nurse'::"text"))))));



CREATE POLICY "staff_permissions_select_admin_owned_clinic" ON "public"."staff_permissions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."clinics" "c"
  WHERE (("c"."clinic_id" = "staff_permissions"."clinic_id") AND ("c"."admin_id" = "auth"."uid"())))));



CREATE POLICY "staff_permissions_select_own" ON "public"."staff_permissions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "staff_permissions_update_admin_owned_clinic" ON "public"."staff_permissions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."clinics" "c"
  WHERE (("c"."clinic_id" = "staff_permissions"."clinic_id") AND ("c"."admin_id" = "auth"."uid"()))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."clinics" "c"
  WHERE (("c"."clinic_id" = "staff_permissions"."clinic_id") AND ("c"."admin_id" = "auth"."uid"())))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "staff_permissions"."user_id") AND ("p"."role" = 'nurse'::"text"))))));



CREATE POLICY "staff_permissions_update_own_invitation" ON "public"."staff_permissions" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users can insert own profile" ON "public"."nurse_info" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users can insert own profile" ON "public"."patient_info" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users can update own profile" ON "public"."nurse_info" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users can update own profile" ON "public"."patient_info" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users can view own profile" ON "public"."nurse_info" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "users can view own profile" ON "public"."patient_info" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Queues";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."queue_entries";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































REVOKE ALL ON FUNCTION "public"."accept_pending_queue_entry"("p_entry_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_pending_queue_entry"("p_entry_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_pending_queue_entry"("p_entry_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_pending_queue_entry"("p_entry_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."am_i_patient_of_clinic"("p_clinic_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."am_i_patient_of_clinic"("p_clinic_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."am_i_patient_of_clinic"("p_clinic_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."call_patient"("p_entry_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."call_patient"("p_entry_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."call_patient"("p_entry_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."call_patient"("p_entry_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."complete_visit"("p_entry_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."complete_visit"("p_entry_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_visit"("p_entry_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_visit"("p_entry_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_appointment_types"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_appointment_types"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_appointment_types"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_doctor_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_doctor_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_doctor_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_patient_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_patient_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_patient_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_staff_of_clinic"("p_clinic_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff_of_clinic"("p_clinic_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff_of_clinic"("p_clinic_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."join_queue"("p_clinic_id" "uuid", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."join_queue"("p_clinic_id" "uuid", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."join_queue"("p_clinic_id" "uuid", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_queue"("p_clinic_id" "uuid", "p_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."leave_queue"("p_entry_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."leave_queue"("p_entry_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."leave_queue"("p_entry_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_queue"("p_entry_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_no_show"("p_entry_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_no_show"("p_entry_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_no_show"("p_entry_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_no_show"("p_entry_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."patient_can_view_doctor_profile"("p_target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."patient_can_view_doctor_profile"("p_target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."patient_can_view_doctor_profile"("p_target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_admin_overreach"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_admin_overreach"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_admin_overreach"() TO "service_role";



GRANT ALL ON FUNCTION "public"."queue_entries_before_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."queue_entries_before_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."queue_entries_before_update"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."reorder_queue_entry"("p_clinic_id" "uuid", "p_entry_id" "uuid", "p_new_order" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reorder_queue_entry"("p_clinic_id" "uuid", "p_entry_id" "uuid", "p_new_order" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."reorder_queue_entry"("p_clinic_id" "uuid", "p_entry_id" "uuid", "p_new_order" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_queue_entry"("p_clinic_id" "uuid", "p_entry_id" "uuid", "p_new_order" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."staff_permissions_enforce_column_updates"() TO "anon";
GRANT ALL ON FUNCTION "public"."staff_permissions_enforce_column_updates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."staff_permissions_enforce_column_updates"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."start_visit"("p_entry_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."start_visit"("p_entry_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."start_visit"("p_entry_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_visit"("p_entry_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."Appointments" TO "anon";
GRANT ALL ON TABLE "public"."Appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."Appointments" TO "service_role";



GRANT ALL ON TABLE "public"."Memberships" TO "anon";
GRANT ALL ON TABLE "public"."Memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."Memberships" TO "service_role";



GRANT ALL ON TABLE "public"."Queues" TO "anon";
GRANT ALL ON TABLE "public"."Queues" TO "authenticated";
GRANT ALL ON TABLE "public"."Queues" TO "service_role";



GRANT ALL ON TABLE "public"."clinics" TO "anon";
GRANT ALL ON TABLE "public"."clinics" TO "authenticated";
GRANT ALL ON TABLE "public"."clinics" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."appointmentlist_display" TO "anon";
GRANT ALL ON TABLE "public"."appointmentlist_display" TO "authenticated";
GRANT ALL ON TABLE "public"."appointmentlist_display" TO "service_role";



GRANT ALL ON TABLE "public"."appointmentlist_display2" TO "anon";
GRANT ALL ON TABLE "public"."appointmentlist_display2" TO "authenticated";
GRANT ALL ON TABLE "public"."appointmentlist_display2" TO "service_role";



GRANT ALL ON TABLE "public"."appt_creation_requests" TO "anon";
GRANT ALL ON TABLE "public"."appt_creation_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."appt_creation_requests" TO "service_role";



GRANT ALL ON TABLE "public"."appointmentreq_display" TO "anon";
GRANT ALL ON TABLE "public"."appointmentreq_display" TO "authenticated";
GRANT ALL ON TABLE "public"."appointmentreq_display" TO "service_role";



GRANT ALL ON TABLE "public"."clinic_admin" TO "anon";
GRANT ALL ON TABLE "public"."clinic_admin" TO "authenticated";
GRANT ALL ON TABLE "public"."clinic_admin" TO "service_role";



GRANT ALL ON TABLE "public"."doctor_info" TO "anon";
GRANT ALL ON TABLE "public"."doctor_info" TO "authenticated";
GRANT ALL ON TABLE "public"."doctor_info" TO "service_role";



GRANT ALL ON TABLE "public"."medical_history" TO "anon";
GRANT ALL ON TABLE "public"."medical_history" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_history" TO "service_role";



GRANT ALL ON TABLE "public"."membernamerole" TO "anon";
GRANT ALL ON TABLE "public"."membernamerole" TO "authenticated";
GRANT ALL ON TABLE "public"."membernamerole" TO "service_role";



GRANT ALL ON TABLE "public"."nurse_info" TO "anon";
GRANT ALL ON TABLE "public"."nurse_info" TO "authenticated";
GRANT ALL ON TABLE "public"."nurse_info" TO "service_role";



GRANT ALL ON TABLE "public"."patient_info" TO "anon";
GRANT ALL ON TABLE "public"."patient_info" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_info" TO "service_role";



GRANT ALL ON TABLE "public"."practicioner_info" TO "anon";
GRANT ALL ON TABLE "public"."practicioner_info" TO "authenticated";
GRANT ALL ON TABLE "public"."practicioner_info" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."queue_entries" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."queue_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."queue_entries" TO "service_role";



GRANT ALL ON TABLE "public"."staff_permissions" TO "anon";
GRANT ALL ON TABLE "public"."staff_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_permissions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "clinics_public_read" on "public"."clinics";

revoke delete on table "public"."queue_entries" from "anon";

revoke update on table "public"."queue_entries" from "anon";

revoke delete on table "public"."queue_entries" from "authenticated";

revoke update on table "public"."queue_entries" from "authenticated";


  create policy "clinics_public_read"
  on "public"."clinics"
  as permissive
  for select
  to anon, authenticated
using (true);


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Give users authenticated access to folder ozpdgn_0"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'patient-forms'::text) AND (auth.role() = 'authenticated'::text) AND ((auth.uid())::text = (storage.foldername(name))[2])));



  create policy "Give users authenticated access to folder ozpdgn_1"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'patient-forms'::text) AND (auth.role() = 'authenticated'::text) AND ((auth.uid())::text = (storage.foldername(name))[2])));



  create policy "Give users authenticated access to folder ozpdgn_2"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'patient-forms'::text) AND (auth.role() = 'authenticated'::text) AND ((auth.uid())::text = (storage.foldername(name))[2])));



  create policy "allow user to insert new data 5quosq_0"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'clinic-forms'::text));



  create policy "allow user to insert new data 5quosq_1"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'clinic-forms'::text));



  create policy "allow user to insert new data 5quosq_2"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'clinic-forms'::text));



