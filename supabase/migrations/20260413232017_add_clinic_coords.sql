-- nullable coordinates and geocode lifecycle for clinics (pins, discovery, etc.)

alter table public.clinics
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geocode_status text;

comment on column public.clinics.latitude is 'wgs84 latitude from geocoder when geocode_status is ok';
comment on column public.clinics.longitude is 'wgs84 longitude from geocoder when geocode_status is ok';
comment on column public.clinics.geocode_status is 'null = never geocoded, pending = scheduled/in progress, ok = success, failed = geocode could not resolve';

alter table public.clinics drop constraint if exists clinics_geocode_status_check;

alter table public.clinics
  add constraint clinics_geocode_status_check
  check (
    geocode_status is null
    or geocode_status in ('pending', 'ok', 'failed')
  );