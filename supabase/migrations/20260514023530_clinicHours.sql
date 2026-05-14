-- clinic hours implementation
--
-- adds a clinic_hours jsonb column to public.clinics.
--
-- shape of the stored json:
--   {
--     "monday":    { "open": "09:00", "close": "17:00" },
--     "tuesday":   { "open": "09:00", "close": "17:00" },
--     "wednesday": { "open": "09:00", "close": "17:00" },
--     "thursday":  { "open": "09:00", "close": "17:00" },
--     "friday":    { "open": "09:00", "close": "17:00" },
--     "saturday":  null,
--     "sunday":    null
--   }
--
-- a null day value means the clinic is closed that day.
-- a null column value means the clinic has not configured hours yet.
-- times are stored as 24-hour "HH:MM" strings (local clinic time).

-- ─── column ───────────────────────────────────────────────────────────────────

ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS clinic_hours jsonb DEFAULT NULL;

-- ─── validation check constraint ──────────────────────────────────────────────
-- ensures every key that is present is either null (closed) or an object with
-- "open" and "close" text fields that match HH:MM 24-hour format.

ALTER TABLE public.clinics
  ADD CONSTRAINT clinic_hours_valid_shape CHECK (
    clinic_hours IS NULL
    OR (
      jsonb_typeof(clinic_hours) = 'object'
      AND (
        -- every present day key must be null or a valid {open, close} object
        (clinic_hours -> 'monday'    IS NULL OR (
          jsonb_typeof(clinic_hours -> 'monday') = 'object'
          AND (clinic_hours -> 'monday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          AND (clinic_hours -> 'monday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        ))
        AND (clinic_hours -> 'tuesday'   IS NULL OR (
          jsonb_typeof(clinic_hours -> 'tuesday') = 'object'
          AND (clinic_hours -> 'tuesday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          AND (clinic_hours -> 'tuesday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        ))
        AND (clinic_hours -> 'wednesday' IS NULL OR (
          jsonb_typeof(clinic_hours -> 'wednesday') = 'object'
          AND (clinic_hours -> 'wednesday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          AND (clinic_hours -> 'wednesday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        ))
        AND (clinic_hours -> 'thursday'  IS NULL OR (
          jsonb_typeof(clinic_hours -> 'thursday') = 'object'
          AND (clinic_hours -> 'thursday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          AND (clinic_hours -> 'thursday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        ))
        AND (clinic_hours -> 'friday'    IS NULL OR (
          jsonb_typeof(clinic_hours -> 'friday') = 'object'
          AND (clinic_hours -> 'friday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          AND (clinic_hours -> 'friday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        ))
        AND (clinic_hours -> 'saturday'  IS NULL OR (
          jsonb_typeof(clinic_hours -> 'saturday') = 'object'
          AND (clinic_hours -> 'saturday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          AND (clinic_hours -> 'saturday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        ))
        AND (clinic_hours -> 'sunday'    IS NULL OR (
          jsonb_typeof(clinic_hours -> 'sunday') = 'object'
          AND (clinic_hours -> 'sunday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          AND (clinic_hours -> 'sunday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        ))
      )
    )
  );

-- ─── RLS policies ─────────────────────────────────────────────────────────────

-- patients/public: clinic_hours is already readable via the existing
-- "patients can see approved clinics" SELECT policy on public.clinics.
-- no new SELECT policy is needed.

-- clinic admin can update clinic_hours on their own clinic row.
-- the existing update policy on public.clinics already scopes writes to
-- rows where admin_id = auth.uid(), so clinic_hours is covered automatically.
-- no new UPDATE policy is needed.

-- ─── helper function ──────────────────────────────────────────────────────────
-- is_clinic_open_now(clinic_hours jsonb) -> boolean
--
-- returns true if the clinic is open at the current UTC time.
-- NOTE: this compares against UTC wall-clock time. if clinics have a
-- local timezone column added later, convert now() accordingly.

CREATE OR REPLACE FUNCTION public.is_clinic_open_now(hours jsonb)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN hours IS NULL THEN false
    ELSE (
      SELECT
        day_entry IS NOT NULL
        AND jsonb_typeof(day_entry) = 'object'
        AND (day_entry ->> 'open')  IS NOT NULL
        AND (day_entry ->> 'close') IS NOT NULL
        AND (now()::time >= (day_entry ->> 'open')::time)
        AND (now()::time <  (day_entry ->> 'close')::time)
      FROM (
        SELECT hours -> lower(to_char(now(), 'Day'))
      ) AS t(day_entry)
    )
  END;
$$;
