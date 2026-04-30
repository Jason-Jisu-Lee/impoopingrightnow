create table if not exists public.share_snapshots (
  share_id text primary key default lower(encode(gen_random_bytes(8), 'hex')),
  mode text not null check (mode in ('brag', 'challenge')),
  username text,
  total_sessions integer not null default 0 check (total_sessions >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  average_per_day numeric(6, 1),
  recent_heatmap text not null check (recent_heatmap ~ '^[0-4]{28}$'),
  shared_at timestamptz not null default timezone('utc', now())
);

create index if not exists share_snapshots_shared_at_idx
  on public.share_snapshots (shared_at desc);

alter table public.share_snapshots enable row level security;

create policy "Public read share snapshots"
  on public.share_snapshots
  for select
  using (true);

create policy "Public insert share snapshots"
  on public.share_snapshots
  for insert
  with check (true);