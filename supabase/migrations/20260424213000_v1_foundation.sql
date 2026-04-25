create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  email text,
  session_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.session_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  country text,
  region text,
  city text,
  duration_sec integer not null default 0,
  push_count integer not null default 0,
  push_time_sec integer not null default 0,
  hour_of_day integer not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.live_feed_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  username text not null,
  message text not null check (char_length(message) <= 60),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists session_log_user_id_idx
  on public.session_log (user_id, created_at desc);

create index if not exists session_log_region_idx
  on public.session_log (region, created_at desc);

create index if not exists live_feed_messages_created_at_idx
  on public.live_feed_messages (created_at desc);

alter table public.users enable row level security;
alter table public.session_log enable row level security;
alter table public.live_feed_messages enable row level security;

create policy "Public read users"
  on public.users
  for select
  using (true);

create policy "Public insert users"
  on public.users
  for insert
  with check (true);

create policy "Public update users"
  on public.users
  for update
  using (true)
  with check (true);