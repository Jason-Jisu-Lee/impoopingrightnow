# Share Flow

## Current version

1. User taps `Brag` or `Challenge` on `Records`.
2. The app builds a small public snapshot from the current local stats.
3. The app tries to store that snapshot in Supabase and get a public share ID.
4. If storage succeeds, the share URL becomes `/share/[shareId]`.
5. If storage is unavailable, the app falls back to the encoded `/share?data=...` URL.
6. On mobile, the native share sheet opens with text plus the share URL.
7. The public page shows the sender handle, 3 headline stats, a 4-week mini heatmap, and one CTA back into the homepage.

## Modes

- `Brag` is the progress-sharing mode. Its CTA is `Start my streak`.
- `Challenge` is the answer-back mode. Its CTA is `Beat this`.

## Backend-backed share ID

A backend-backed share ID means the snapshot lives in Supabase and the recipient gets a clean public link like `/share/abc123def456`.

That is better than a fully encoded URL because it gives us shorter links, snapshots that are not trivially editable in the address bar, and a cleaner path to analytics or expiring links later.

## Deployment note

The app code and migration can be deployed now, but the `share_snapshots` table must exist in Supabase before stored share IDs will be used in production.

This workspace currently does not have the Supabase CLI installed, so the migration still needs to be applied to the database separately.

## Why this version is good

- It is already a real social loop, not just raw link copy.
- It does not expose the sender's full live records page by default.
- It supports backend-backed links when the table is available.
- It still works with a fallback link even before the table is live.
- It lets us test whether people actually open and respond to shared links.

## Why doing both modes now is fine

Doing `Brag` and `Challenge` now is not a problem.

What would still be too much right now is analytics attribution, invite tracking, expiring or revocable links, and server-verified stats snapshots.

Those extra layers can come later if the share loop proves useful.

## Current limitation

The app still keeps the encoded URL fallback because the database table might not be available in every environment yet.

So this version is partly authoritative and partly fallback-based until the Supabase migration is actually applied everywhere.