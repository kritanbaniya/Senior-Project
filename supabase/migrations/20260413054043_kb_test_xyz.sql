create table public.kb_test_tbl (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  score integer default 0,
  created_at timestamptz not null default now()
);

