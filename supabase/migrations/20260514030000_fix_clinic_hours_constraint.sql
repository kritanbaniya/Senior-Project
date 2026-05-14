-- fix clinic_hours_valid_shape check constraint
--
-- the original constraint used `clinic_hours -> 'day' IS NULL` to allow closed
-- days, but that only matches SQL NULL (absent key). a day stored as JSON null
-- (e.g. { "monday": null }) returns a JSONB null value from ->, which IS NOT
-- SQL NULL -- so the original constraint incorrectly rejects closed days.
--
-- the fix uses jsonb_typeof() which returns:
--   NULL (sql)  -- key is absent entirely
--   'null'      -- key exists with JSON null value (closed day)
--   'object'    -- key exists with {open, close} object (open day)
--
-- the corrected logic per day:
--   if jsonb_typeof != 'object'  -> allow (absent or null = closed, fine)
--   if jsonb_typeof == 'object'  -> require valid HH:MM open and close strings

ALTER TABLE public.clinics
  DROP CONSTRAINT IF EXISTS clinic_hours_valid_shape;

ALTER TABLE public.clinics
  ADD CONSTRAINT clinic_hours_valid_shape CHECK (
    clinic_hours IS NULL
    OR (
      jsonb_typeof(clinic_hours) = 'object'
      AND (
        (jsonb_typeof(clinic_hours -> 'monday') IS DISTINCT FROM 'object'
          OR (
            (clinic_hours -> 'monday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
            AND (clinic_hours -> 'monday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          ))
        AND (jsonb_typeof(clinic_hours -> 'tuesday') IS DISTINCT FROM 'object'
          OR (
            (clinic_hours -> 'tuesday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
            AND (clinic_hours -> 'tuesday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          ))
        AND (jsonb_typeof(clinic_hours -> 'wednesday') IS DISTINCT FROM 'object'
          OR (
            (clinic_hours -> 'wednesday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
            AND (clinic_hours -> 'wednesday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          ))
        AND (jsonb_typeof(clinic_hours -> 'thursday') IS DISTINCT FROM 'object'
          OR (
            (clinic_hours -> 'thursday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
            AND (clinic_hours -> 'thursday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          ))
        AND (jsonb_typeof(clinic_hours -> 'friday') IS DISTINCT FROM 'object'
          OR (
            (clinic_hours -> 'friday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
            AND (clinic_hours -> 'friday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          ))
        AND (jsonb_typeof(clinic_hours -> 'saturday') IS DISTINCT FROM 'object'
          OR (
            (clinic_hours -> 'saturday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
            AND (clinic_hours -> 'saturday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          ))
        AND (jsonb_typeof(clinic_hours -> 'sunday') IS DISTINCT FROM 'object'
          OR (
            (clinic_hours -> 'sunday' ->> 'open')  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
            AND (clinic_hours -> 'sunday' ->> 'close') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          ))
      )
    )
  );
