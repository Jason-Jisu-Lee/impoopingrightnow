# Backend Plan

## Short answer

Yes, we should start Supabase now, but only the foundation.

We do **not** need to build the entire backend in one pass.
We **do** need to provision the project, add environment variables, and apply the database schema so the share system and future sync features have somewhere real to live.

## Current state

Right now the app is mostly local-first.

- Records and stats are still primarily coming from browser local storage.
- The share flow is already implemented in the app.
- The app can use backend-backed share IDs if Supabase is configured.
- If Supabase is not configured, the app falls back to encoded share URLs.

## What Supabase is for

### Needed now

- clean public share links like `/share/abc123`
- a place to store public share snapshots

### Needed soon

- syncing user identity and stats across devices
- storing completed session logs in a real database
- powering the global page with real data instead of local-only or preview data

### Needed later

- live social feed / realtime features
- analytics attribution
- moderation / admin tools
- expiring or revocable share links

## What already exists in the repo

- public env helpers in [packages/shared/src/supabase.ts](packages/shared/src/supabase.ts)
- env placeholders in [.env.example](.env.example)
- base Supabase schema in [supabase/migrations/20260424213000_v1_foundation.sql](supabase/migrations/20260424213000_v1_foundation.sql)
- share snapshot schema in [supabase/migrations/20260429230000_share_snapshots.sql](supabase/migrations/20260429230000_share_snapshots.sql)
- share flow behavior notes in [share-flow.md](share-flow.md)

## What you need to do

1. Create a Supabase project.
2. Copy the project URL.
3. Copy the anon/public key.
4. Copy the service role key and keep it secret.
5. Add those values to the environments used for web, mobile, and deploys.
6. Apply the SQL migrations to the Supabase database.

## Environment variables

These are the variables the repo already expects:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Important rule

The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser or mobile client.

Public keys are fine in client builds.
The service role key is only for trusted server-side code later.

## Recommended rollout

### Phase 1: Turn Supabase on

Goal: enable the existing share system to use real stored share IDs.

Tasks:

- create the Supabase project
- set env vars
- apply both SQL migrations
- verify `share_snapshots` exists

### Phase 2: Real session persistence

Goal: stop relying only on local storage for the important data.

Tasks:

- write completed sessions to `session_log`
- upsert anonymous users into `users`
- read stats from Supabase where appropriate

### Phase 3: Social and global features

Goal: make the app feel alive and shared.

Tasks:

- real global analytics
- live feed backed by the database
- challenge/share tracking
- better social loops and attribution

## What I recommend right now

Do Phase 1 now.

That is the right scope.
It unlocks the clean share-link architecture without forcing us to build the entire persistence and realtime system immediately.

## What I can do next

1. Help you set up the exact Supabase project and env vars.
2. Add a safer documented workflow for applying migrations.
3. Start Phase 2 and wire completed session writes into Supabase.
