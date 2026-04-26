# Remaining Tasks

This file captures what is still not implemented after the current web-first V1 pass.

## Current Status

- Web-first local experience is wired: landing flow, session timer, hold/log mechanic, flush certificate placeholder, simulated counter, seeded feed, local stats, preview global analytics, and local settings/email capture.
- Validation baseline is in place: `npm run validate` runs lint, typecheck, tests, and the web production build.
- Mobile parity was intentionally deferred and remains incomplete.

## Remaining In-Scope Product Work

### Backend Persistence

- [ ] Wire real anonymous user upsert on session start using Supabase instead of only local bootstrap helpers.
- [ ] Save completed sessions to `session_log` instead of only browser storage.
- [ ] Keep `users.session_count` in sync with completed sessions.
- [ ] Decide how local-first fallback behaves when Supabase is unavailable.

### Certificate Completion

- [ ] Replace the disabled certificate share button with real image export.
- [ ] Implement client-side certificate capture via canvas or `html2canvas`.
- [ ] Calculate the real certificate rank label from today’s stored session durations.
- [ ] Decide whether weekly summary sharing uses the same export path as the certificate.

### Geolocation And Real Analytics

- [ ] Add server-side IP-to-location lookup on session save.
- [ ] Map raw location data into the hardcoded region buckets from the prompt.
- [ ] Persist `country`, `region`, `city`, and `hour_of_day` to `session_log`.
- [ ] Replace preview global analytics seeds with real aggregated leaderboard queries.
- [ ] Keep the `>= 50 sessions` threshold rule on real country and region data.

### Realtime Feed And Counter

- [ ] Publish feed messages to Supabase instead of keeping them local-only.
- [ ] Subscribe to live feed messages through Supabase Realtime.
- [ ] Merge seeded fallback behavior with real feed traffic cleanly.
- [ ] Track real concurrent active sessions.
- [ ] Replace the top-right Daily Poop Counter simulation with a real EST-resetting session total.
- [ ] Switch the counter from simulated mode to live data when real concurrency reaches the defined threshold.

### Cross-Device Stats

- [ ] Decide whether My Stats remains local-only or merges local data with server history.
- [ ] Back the stats page with server data for returning users across devices.
- [ ] Back the global analytics page with the same stored session data source instead of preview rows.

## Deferred Mobile Work

- [ ] Port the real session runtime to Expo mobile.
- [ ] Port certificate flow and share/export behavior to mobile.
- [ ] Port stats, global analytics, and settings parity to mobile.
- [ ] Decide what parts of the current local web storage model map to mobile storage and Supabase sync.

## QA / Release Tasks

- [ ] Manually test the web flow end to end in a browser: start session, hold/release, flush, stats update, settings update, and email-prompt eligibility after 3 sessions.
- [ ] Verify Supabase env configuration in the target deployment environment.
- [ ] Apply and verify the SQL migration against the real Supabase project.
- [ ] Smoke test navigation and storage behavior after deployment.

## Explicitly Deferred / Out Of Scope

- [ ] Retroactive `I Pooped` logging remains a stub.
- [ ] Full profanity filtering remains a later improvement beyond the basic blocklist.
- [ ] Certificate visual polish is still placeholder quality.
- [ ] Regional food copy is still placeholder copy.
- [ ] Monetization hooks remain intentionally unimplemented.

## Suggested Next Build Order

1. Session-start/session-end Supabase persistence.
2. Geolocation pipeline and real global/session analytics data.
3. Certificate share export and real rank calculation.
4. Realtime feed and live counter.
5. Mobile parity.
