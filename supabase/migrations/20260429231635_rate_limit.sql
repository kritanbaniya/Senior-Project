-- ============================================================
-- 1. rate_limits table
-- ============================================================
-- tracks how many times a user has performed an action within
-- a fixed one-minute window. the primary key (user_id, action,
-- window_start) ensures one row per user/action/window.
-- a new row is inserted on the first attempt in a window;
-- subsequent attempts increment the count via on conflict.
create table public.rate_limits (
  user_id      uuid        not null references auth.users on delete cascade,
  action       text        not null,
  window_start timestamptz not null,
  count        integer     not null default 1,
  primary key (user_id, action, window_start)
);

-- rls is enabled with no policies so patients cannot directly
-- read or write this table. all access goes through the
-- security definer check_rate_limit function below.
alter table public.rate_limits enable row level security;


-- ============================================================
-- 2. check_rate_limit function
-- ============================================================
-- called at the top of sensitive rpcs before any other logic.
-- uses a fixed window snapped to the current minute boundary.
-- atomically upserts the attempt count and raises an exception
-- if the caller has exceeded p_max_count within the window.
-- the exception message is formatted as 'rate_limit:N seconds'
-- so the frontend can parse N and display a live countdown.
create or replace function public.check_rate_limit(
  p_action         text,
  p_max_count      integer,
  p_window_seconds integer
) returns void
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_window timestamptz;
  v_count  integer;
  v_retry  integer;
begin
  -- snap to the start of the current fixed window.
  -- date_trunc('minute') gives the current minute boundary,
  -- e.g. 19:05:37 becomes 19:05:00.
  v_window := date_trunc('minute', now());

  -- atomic upsert: insert count=1 on first attempt in this window,
  -- or increment the existing count on subsequent attempts.
  insert into public.rate_limits (user_id, action, window_start, count)
  values (auth.uid(), p_action, v_window, 1)
  on conflict (user_id, action, window_start)
  do update set count = rate_limits.count + 1
  returning count into v_count;

  if v_count > p_max_count then
    -- seconds remaining until the window resets at the next minute.
    v_retry := p_window_seconds -
      extract(epoch from (now() - v_window))::integer;
    -- clamp to at least 1 so the frontend always shows a positive number.
    v_retry := greatest(v_retry, 1);
    raise exception 'rate_limit:% seconds', v_retry
      using errcode = 'P0429';
  end if;
end;
$$;


-- ============================================================
-- 3. recreate join_queue with rate limit check
-- ============================================================
-- identical to the original except for the check_rate_limit
-- call added as the very first statement.
create or replace function public.join_queue(
  p_clinic_id uuid,
  p_notes     text default null
) returns uuid
  language plpgsql
  set search_path to 'public'
as $$
declare
  v_entry_id    uuid;
  v_patient_name text;
begin
  -- rate limit: max 3 join attempts per minute per user.
  perform public.check_rate_limit('join_queue', 3, 60);

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
end;
$$;

revoke all on function public.join_queue(uuid, text) from public;
grant execute on function public.join_queue(uuid, text)
  to anon, authenticated, service_role;


-- ============================================================
-- 4. recreate join_queue_for_appointment with rate limit check
-- ============================================================
-- based on the latest version from 20260423054617. the only
-- addition is the check_rate_limit call as the first statement.
-- both join paths share the same 'join_queue' action bucket so
-- a patient cannot bypass the limit by mixing walk-in and
-- appointment check-ins.
create or replace function public.join_queue_for_appointment(
  p_appointment_id uuid,
  p_notes          text default null
) returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_entry_id     uuid;
  v_patient_name text;
  v_clinic_id    uuid;
  v_appt_date    timestamp without time zone;
  v_appt_status  public.appointment_status;
  v_appt_patient uuid;
begin
  -- rate limit: shares the 'join_queue' bucket with join_queue so
  -- mixing walk-in and appointment check-ins cannot bypass the limit.
  perform public.check_rate_limit('join_queue', 3, 60);

  -- caller must be a patient.
  select full_name into v_patient_name
  from public.profiles
  where id = auth.uid() and role = 'patient';

  if not found then
    raise exception 'only patients can join queue';
  end if;

  -- load and validate the appointment.
  select clinic_id, appointment_date, appointment_status, patient_id
    into v_clinic_id, v_appt_date, v_appt_status, v_appt_patient
  from public."Appointments"
  where "Appointment_id" = p_appointment_id;

  if v_clinic_id is null then
    raise exception 'appointment not found';
  end if;

  if v_appt_patient <> auth.uid() then
    raise exception 'appointment does not belong to caller';
  end if;

  if v_appt_status <> 'active' then
    raise exception 'appointment is not active';
  end if;

  -- null date guard only; the frontend enforces the [-2h, +1h] window.
  if v_appt_date is null then
    raise exception 'appointment has no scheduled time';
  end if;

  -- insert the pending queue entry with the appointment link.
  insert into public.queue_entries (
    clinic_id,
    patient_id,
    status,
    notes,
    queue_order,
    patient_name,
    appointment_id
  ) values (
    v_clinic_id,
    auth.uid(),
    'pending',
    p_notes,
    null,
    coalesce(v_patient_name, 'patient'),
    p_appointment_id
  )
  returning id into v_entry_id;

  -- stamp checkin_at on the appointment if not already set.
  update public."Appointments"
     set checkin_at = coalesce(checkin_at, (now() at time zone 'utc'))
   where "Appointment_id" = p_appointment_id;

  return v_entry_id;
end;
$$;

revoke all on function public.join_queue_for_appointment(uuid, text) from public;
grant execute on function public.join_queue_for_appointment(uuid, text)
  to anon, authenticated, service_role;

