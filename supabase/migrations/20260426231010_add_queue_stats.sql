create or replace function get_queue_stats(cid uuid)
returns table (
  waiting_count int,
  avg_service_seconds int
)
language sql
security definer
as $$
  select
    (
      select count(*)
      from queue_entries
      where clinic_id = cid
        and is_active = false
        and status <> 'completed'
    ),
    (
      select coalesce(
        avg(extract(epoch from (completed_at - started_at))),
        0
      )::int
      from queue_entries
      where clinic_id = cid
        and status = 'completed'
        and started_at is not null
        and completed_at is not null
    );
$$;

grant execute on function get_queue_stats(uuid) to authenticated;