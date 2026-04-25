# impoopingrightnow

V1 monorepo bootstrap for the web app, mobile app, shared code, and Supabase config.

## Workspace layout

- `apps/web` - Next.js web app
- `apps/mobile` - Expo mobile app
- `packages/shared` - shared TypeScript package
- `supabase` - Supabase config and migrations placeholder

## Commands

- `npm install` - install all workspace dependencies from the repo root
- `npm run web` - start the Next.js app
- `npm run mobile` - start the Expo app
- `npm run build:web` - build the web app
- `npm run lint:web` - lint the web app

## Environment

Copy values from `.env.example` when the Supabase step is wired.
