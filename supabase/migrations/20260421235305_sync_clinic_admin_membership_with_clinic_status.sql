create or replace function public.sync_clinic_admin_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- INSERT: clinic created already approved
  if tg_op = 'INSERT' then
    if new.approved = true then
      insert into public."Memberships" (clinic_id, user_id)
      values (new.clinic_id, new.admin_id)
      on conflict (clinic_id, user_id) do nothing;
    end if;
    return new;
  end if;

  -- UPDATE: clinic became approved
  if tg_op = 'UPDATE' then
    -- false -> true : add current admin
    if old.approved = false and new.approved = true then
      insert into public."Memberships" (clinic_id, user_id)
      values (new.clinic_id, new.admin_id)
      on conflict (clinic_id, user_id) do nothing;
    end if;

    -- true -> false : remove current admin
    if old.approved = true and new.approved = false then
      delete from public."Memberships"
      where clinic_id = new.clinic_id
        and user_id = old.admin_id;
    end if;

    -- admin changed while clinic remains approved
    if old.admin_id is distinct from new.admin_id
       and new.approved = true then
      delete from public."Memberships"
      where clinic_id = new.clinic_id
        and user_id = old.admin_id;

      insert into public."Memberships" (clinic_id, user_id)
      values (new.clinic_id, new.admin_id)
      on conflict (clinic_id, user_id) do nothing;
    end if;

    return new;
  end if;

  -- DELETE: remove admin membership too
  if tg_op = 'DELETE' then
    delete from public."Memberships"
    where clinic_id = old.clinic_id
      and user_id = old.admin_id;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_sync_clinic_admin_membership
on public.clinics;

create trigger trg_sync_clinic_admin_membership
after insert or update or delete on public.clinics
for each row
execute function public.sync_clinic_admin_membership();