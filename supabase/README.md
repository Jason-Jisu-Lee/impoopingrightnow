# Supabase foundation

The V1 foundation migration now lives in `supabase/migrations` and creates the
anonymous `users`, `session_log`, and `live_feed_messages` tables from the
build prompt.

This step only provides schema and client wiring. The first actual user upsert
happens when the session flow is implemented, not during shell boot.
