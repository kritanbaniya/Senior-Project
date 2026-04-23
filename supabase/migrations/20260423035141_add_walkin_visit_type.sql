-- add 'Walk-in' to the appointmenttypes enum.
-- this must live in its own migration because postgres does not allow a
-- newly added enum value to be referenced in the same transaction that
-- added it. all subsequent migrations can safely use 'Walk-in'::public.appointmenttypes.
alter type public.appointmenttypes add value if not exists 'Walk-in';
