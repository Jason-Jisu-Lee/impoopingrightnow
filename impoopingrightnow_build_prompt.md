# impoopingrightnow.com — V1 Build Prompt

## What This Is
A viral, mobile-first web app and React Native mobile app where users log live pooping sessions. The core loop: start a session, interact while pooping, end with a shareable certificate. The domain name is the joke. Everything is designed for maximum shareability and zero friction.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web | Next.js (App Router) + Vercel |
| Mobile | React Native + Expo |
| Backend / DB | Supabase (Postgres) |
| Realtime | Supabase Realtime (live feed + counter) |
| Geolocation | IP-based, server-side (city → region bucket) |
| Certificate | Client-side canvas / html2canvas |
| Identity | Supabase anonymous UUID, stored in localStorage |

---

## Identity & Persistence

- On first visit, generate a UUID and store in `localStorage`
- Silently upsert UUID to Supabase `users` table on first session
- Auto-generate a funny username (format: `[Adjective][PoopNoun]_[2-digit number]`, e.g. `TrumpentButt_42`, `SilentBomber_07`, `StealthyLogger_19`). Store on user record. User can edit later — optional, never required.
- After exactly 3 completed sessions, show a single passive dismissible banner (never a modal): *"Protect your poop history → add an email."* One email field. Dismissible. Never shown again after dismissed or submitted.
- No login. No password. No account creation screen.

---

## Core Session Flow

### Landing Screen
- Two options: **"I'm Pooping Right Now"** and a small secondary link **"I Pooped"** (retroactive — stub only in v1, shows "coming soon")
- Global live counter always visible at top (see Counter section)
- Tapping "I'm Pooping Right Now" starts session immediately — no confirmation, no form

### Live Session Screen (mobile-first layout)

```
[ 🌍 847 people pooping right now ]     ← top bar, always visible

           04:32                         ← Poop Timer, dominant center

   [ 💩 IT'S COMING OUT ]               ← large hold button, always present

         "hang in there, champ"          ← rotating encouragement text

                          [floating feed corner] ← bottom-right, low opacity
```

**Poop Timer:** Starts on session entry. Counts up. Dominant visual — large, clean font.

**IT'S COMING OUT button:**
- Hold mechanic: hold the button while pushing, release when done
- While held: sub-timer runs (Push Timer), button pulses/animates
- On release: mini confetti burst, 1 "Log" recorded, push time stored
- Button immediately available again: label changes to "IT'S COMING OUT AGAIN"
- Each hold-and-release cycle = 1 Log

**Milestone messages** (fire based on Poop Timer, replace encouragement text):

| Time | Message |
|---|---|
| 2:00 | "Still going?" |
| 5:00 | "You okay in there?" |
| 10:00 | "Try squatting. Seriously." |
| 15:00 | "You should call someone." |
| 20:00 | "This is a medical situation." |

**🚽 Flush button:** Small, always visible. Ends session. Triggers certificate flow.

---

## Floating Live Feed

- Bottom-right corner. Low opacity. Messages drift upward and fade out.
- Pool = all users in active sessions right now (Supabase Realtime subscription)
- Users can submit short messages (≤ 60 chars) from the session screen — small input at bottom
- Messages display under their auto-generated username
- Pre-seeded messages run until real traffic populates the feed naturally. Seed message examples:

```
Early:   "just sat down", "this might take a while", "scrolling twitter"
Middle:  "something's moving", "false alarm", "why won't it budge"
Push:    "ITS COMING", "ALMOST THERE", "SO CLOSE", "HERE WE GO"
Victory: "FREEDOM", "clean sweep", "7/10 would poop again", "see you tomorrow"
```

- Word filter: stub it with a basic profanity blocklist for v1. Full filter logic later.

---

## Global Counter

- Always visible at top of session screen and landing screen
- Simulated until real concurrent users ≥ 2,000:
  - Floor: 847 (non-round, feels real)
  - Fluctuates ±15–30 every 8–15 seconds randomly
  - Weight upward during peak hours: 7–9am, 12–1pm, 9–11pm local time
  - Implementation is display-layer only — never written to DB as real data
- Above 2K real concurrent: switch to live Supabase Realtime count

---

## Session End — Certificate Flow

1. User taps 🚽 Flush
2. Full-screen confetti animation
3. Certificate generates instantly client-side (html2canvas or canvas API — zero server round-trip)

**Certificate contains:**
- Auto-generated username
- Total poop time
- Number of Logs
- Total push time
- Global rank: "Faster than X% of today's poopers" (query `session_log` for today's duration distribution)
- Date + time
- Placeholder official-looking seal / badge
- Share button → exports as image to camera roll / share sheet

Certificate visual design: placeholder layout for v1. Funny-official aesthetic direction (parody government document). Flesh out later.

---

## Data Schema

### `users`
```sql
id          uuid primary key  -- anonymous, localStorage
username    text
email       text nullable
session_count int default 0
created_at  timestamptz
```

### `session_log`
```sql
id            uuid primary key
user_id       uuid references users
country       text
region        text   -- bucketed: 'US West', 'US East', 'Canada', 'Mexico', etc.
city          text
duration_sec  int
push_count    int    -- number of Logs
push_time_sec int    -- total hold time across all Logs
hour_of_day   int    -- 0-23, user's local time
created_at    timestamptz
```

### `live_feed_messages`
```sql
id          uuid primary key
user_id     uuid references users
username    text
message     text
created_at  timestamptz
```

**Geolocation:** Server-side only. On session save, resolve IP → city → hardcoded region bucket. Never expose raw IP. Use a free IP geolocation API (e.g. `ip-api.com` or Vercel's `x-vercel-ip-city` headers).

**Region buckets (hardcoded map, placeholder):**
US West, US East, US South, US Midwest, Canada, Mexico, UK, Western Europe, Eastern Europe, East Asia, Southeast Asia, South Asia, Latin America, Middle East, Africa, Oceania

---

## Retention Features (render only when data exists)

All visible on a "My Stats" tab or screen. Render nothing if < 1 session logged.

- **Heatmap:** GitHub-style daily grid. Color = session count per day.
- **Streaks:** Consecutive days with ≥ 1 session. Show current streak + best streak.
- **Personal Records:** Fastest poop, longest poop, most logs in one session.
- **Weekly Summary Card:** "This week: X poops, avg X:XX, X personal records." Shareable as image.

---

## Global Analytics Page

Browsable, read-only. Visible from nav. Designed to be read while pooping.

**Country Leaderboard** (country only appears once it has ≥ 50 sessions):
- Average total poop time
- Average peak poop hour (local time)
- Average logs per session
- Average push time per session

**Regional Stats** (same minimum threshold per region):
- Same metrics as country leaderboard
- Each region has a hardcoded food profile (placeholder text for v1 — no user input ever)
- Display implies connection: "US West poopers average 3:45. They eat [placeholder foods]."

Food profiles are static copy, hardcoded per region. Users never input food data. Placeholder copy for all regions in v1.

---

## Navigation (minimal)

- **Home / Session** — landing + active session
- **My Stats** — heatmap, streaks, records (only if sessions exist)
- **Global** — country/region leaderboard
- **Settings** — edit username, add email (passive, never pushed)

---

## Monetization

None in v1. Do not build any hooks, gates, or feature flags for this. Ad placement is decided (post-session, pre-certificate interstitial) but not implemented. Ignore entirely for now.

---

## Design Direction

- **Mobile-first.** Every screen designed for portrait phone. Web is secondary.
- **Tone:** Funny-official. Parody the language of medical/government documents. Deadpan copy, absurd context.
- **Performance:** Session screen must feel instant. Certificate generation must feel instant. No spinners on the critical path.
- **Animations:** Confetti on Log release (mini) and Flush (full). Poop Timer should feel alive — subtle pulse or glow. Hold button should have clear held vs released visual state. Floating feed messages drift and fade.
- **Font:** Avoid generic (Inter, Roboto). Pick something with character that fits the deadpan-official tone.
- **Color:** Commit to a palette. Placeholder for now but not white + purple gradient.

---

## What To Build First (suggested order)

1. Supabase schema + anonymous UUID identity
2. Landing screen + session screen with Poop Timer
3. Hold button + Log mechanic + mini confetti
4. Flush → certificate (client-side, placeholder design)
5. Global counter (simulated)
6. Live feed (seeded, Supabase Realtime)
7. My Stats tab (heatmap + streaks)
8. Global analytics page (placeholder data)
9. Geolocation pipeline (IP → region)
10. Share mechanic (certificate → image export)

---

## What Is Explicitly Out of Scope for V1

- Retroactive "I Pooped" logging (stub link only)
- Food input from users (never, not in any version)
- Account creation / login screens
- Paid features of any kind
- Push notifications
- Full word filter logic (basic blocklist only)
- Certificate visual polish (placeholder layout)
- Regional food copy (placeholder text)
