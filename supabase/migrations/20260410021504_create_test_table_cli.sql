-- Create the test table
CREATE TABLE IF NOT EXISTS "test-supabase-cli" (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  test_name text not null,
  created_by_cli boolean default true
);

-- Enable Row Level Security (Good practice even for test tables)
ALTER TABLE "test-supabase-cli" ENABLE ROW LEVEL SECURITY;