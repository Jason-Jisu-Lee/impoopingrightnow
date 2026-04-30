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

Set these values directly in your local env files and deploy secrets when the Supabase step is wired.

Keep the web service-role key out of production build env files:

- Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the web build environment.
- Put `SUPABASE_SERVICE_ROLE_KEY` in `apps/web/.env.development.local` for local `next dev` only.
- Store `SUPABASE_SERVICE_ROLE_KEY` for the deployed web app as a Cloudflare Worker secret binding instead of a GitHub Actions or `.env.local` build variable.

## Auto Deploy

The web app auto-deploys from GitHub Actions on pushes to `main` through `.github/workflows/deploy-web.yml`.

Add these repository secrets in GitHub before relying on the workflow:

- `CLOUDFLARE_API_TOKEN` - Cloudflare API token that can deploy Workers and update routes for this zone
- `CLOUDFLARE_ACCOUNT_ID` - the Cloudflare account id used by Wrangler
- `NEXT_PUBLIC_SUPABASE_URL` - the public Supabase project URL used at web build time
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - the public Supabase anon key used at web build time

Add the service-role key directly to the Cloudflare Worker once, not to the GitHub workflow env:

- `cd apps/web`
- `npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY`

After the secrets are saved, pushing a change to `main` will deploy the web app automatically. You can also run the workflow manually from the Actions tab.
