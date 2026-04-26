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
- `npm run test` - run the shared smoke tests
- `npm run validate` - run lint, typecheck, tests, and the web production build
- `npm run build:web` - build the web app
- `npm run lint:web` - lint the web app

## Environment

Copy values from `.env.example` when the Supabase step is wired.

## Auto Deploy

The web app auto-deploys from GitHub Actions on pushes to `main` through `.github/workflows/deploy-web.yml`.

Add these repository secrets in GitHub before relying on the workflow:

- `CLOUDFLARE_API_TOKEN` - Cloudflare API token that can deploy Workers and update routes for this zone
- `CLOUDFLARE_ACCOUNT_ID` - the Cloudflare account id used by Wrangler

After the secrets are saved, pushing a change to `main` will deploy the web app automatically. You can also run the workflow manually from the Actions tab.
