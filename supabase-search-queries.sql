-- Run this in Supabase SQL Editor to create the search_queries table.
-- Table: search_queries
-- Columns: id (uuid), query (text), created_at (timestamptz)

create table if not exists public.search_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  created_at timestamptz not null default now()
);

-- Optional: enable RLS and allow anonymous insert/select if you use anon key.
-- alter table public.search_queries enable row level security;
-- create policy "Allow anon insert" on public.search_queries for insert to anon with check (true);
-- create policy "Allow anon select" on public.search_queries for select to anon using (true);
