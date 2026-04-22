-- Remove nurse membership when nurse staff_permissions row is deleted
create or replace function public.remove_nurse_membership_when_staff_permission_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public."Memberships"
  where clinic_id = old.clinic_id
    and user_id = old.user_id;

  return old;
end;
$$;

drop trigger if exists trg_remove_nurse_membership_when_staff_permission_deleted
on public.staff_permissions;

create trigger trg_remove_nurse_membership_when_staff_permission_deleted
after delete on public.staff_permissions
for each row
execute function public.remove_nurse_membership_when_staff_permission_deleted();