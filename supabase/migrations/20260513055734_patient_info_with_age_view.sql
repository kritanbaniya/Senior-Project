-- dynamically computes patient age from birthday
-- prevents stale age data from accumulating in the table

create or replace view public.patient_info_with_age as
select
  id,
  name,
  birthday,
  gender,
  blood_type,

  case
    when birthday is null then null
    else date_part(
      'year',
      age(current_date, birthday)
    )::smallint
  end as age

from public.patient_info;