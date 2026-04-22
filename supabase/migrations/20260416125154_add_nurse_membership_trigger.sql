-- Function
create or replace function public.add_nurse_membership_when_staff_invite_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.invitation_status = 'pending'
     and new.invitation_status = 'accepted' then

    insert into public."Memberships" (clinic_id, user_id)
    values (new.clinic_id, new.user_id)
    on conflict (clinic_id, user_id) do nothing;

  end if;

  return new;
end;
$$;

-- Trigger
create trigger trg_add_nurse_membership_when_staff_invite_accepted
after update on public.staff_permissions
for each row
execute function public.add_nurse_membership_when_staff_invite_accepted();