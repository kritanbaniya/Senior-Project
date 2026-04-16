-- fuzzy clinic-name search support for clinic discovery
-- enables typo-tolerant lookup and ranked results

create extension if not exists pg_trgm;

create index if not exists clinics_name_trgm_idx
on public.clinics using gin (clinic_name gin_trgm_ops);

drop function if exists public.search_clinics_by_name(text, int);

create or replace function public.search_clinics_by_name(
  q text,
  limit_count int default 20
)
returns setof public.clinics
language sql
stable
as $$
  select c.*
  from public.clinics c
  where c.approved = true
    and btrim(coalesce(q, '')) <> ''
    and (
      c.clinic_name % q
      or c.clinic_name ilike '%' || q || '%'
    )
  order by
    case when c.clinic_name ilike q || '%' then 1 else 0 end desc,
    similarity(c.clinic_name, q) desc,
    c.clinic_name asc
  limit greatest(1, least(limit_count, 100));
$$;