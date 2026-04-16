-- 1) add place id column for google places selection
alter table public.clinics
  add column if not exists google_place_id text;

comment on column public.clinics.google_place_id is
  'google places place_id selected from autocomplete/details flow';

create index if not exists clinics_google_place_id_idx
  on public.clinics (google_place_id);

-- 2) enforce robust persistence contract for geocoded rows
-- note: NOT VALID avoids breaking existing data immediately.
alter table public.clinics
  drop constraint if exists clinics_geocode_ok_requires_placeid_coords_check;

alter table public.clinics
  add constraint clinics_geocode_ok_requires_placeid_coords_check
  check (
    geocode_status is distinct from 'ok'
    or (
      google_place_id is not null
      and btrim(google_place_id) <> ''
      and latitude is not null
      and longitude is not null
    )
  ) not valid;