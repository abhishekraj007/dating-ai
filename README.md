# dating-ai

A modern TypeScript saas stack that combines Next.js, Convex, expo, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Convex Modes

This repo supports two backend modes:

- **Convex Cloud**: managed Convex dev and prod deployments
- **Self-hosted Convex**: your own Convex API host and Convex site/actions host

The key distinction in this codebase is:

- `CONVEX_URL` / `NEXT_PUBLIC_CONVEX_URL` / `EXPO_PUBLIC_CONVEX_URL` point to the Convex API host
- `CONVEX_SITE_URL` / `NEXT_PUBLIC_CONVEX_SITE_URL` / `EXPO_PUBLIC_CONVEX_SITE_URL` point to the Convex site/actions host used by Better Auth and HTTP actions
- `SITE_URL` points to the frontend app host users should return to after auth

For self-hosted Better Auth, do not point `SITE_URL` at the Convex actions host. OAuth callbacks are generated from `CONVEX_SITE_URL`, while post-login redirects go back to `SITE_URL`.

## Environment Files

These are the env files you will usually manage:

- `packages/backend/.env.local`: backend env used for local development and the default deploy target
- `packages/backend/.env.production.local`: backend env used when deploying to self-hosted production with `--env-file`
- `apps/web/.env.local`: web app Convex client envs
- `apps/admin/.env.local`: admin app Convex client envs
- `apps/native/.env.local`: native app Convex client envs
- `.env.example`, `packages/backend/.env.example`, `apps/admin/.env.example`, `apps/native/.env.example`: templates only

## Required Convex Variables

### Backend

| Variable                       | Required for        | Purpose                                            |
| ------------------------------ | ------------------- | -------------------------------------------------- |
| `SITE_URL`                     | Cloud + self-hosted | Frontend app origin used for redirects after auth  |
| `NATIVE_APP_URL`               | Cloud + self-hosted | Native deep link origin, for example `feelchat://` |
| `CONVEX_URL`                   | Cloud + self-hosted | Convex API host                                    |
| `CONVEX_SITE_URL`              | Cloud + self-hosted | Convex site/actions host used by Better Auth       |
| `CONVEX_DEPLOYMENT`            | Convex Cloud        | Convex Cloud deployment name used by `convex dev`  |
| `CONVEX_SELF_HOSTED_URL`       | Self-hosted         | Self-hosted Convex API host used by deploy CLI     |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | Self-hosted         | Admin key required to deploy to self-hosted Convex |

### Web and Admin

| Variable                      | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_CONVEX_URL`      | Convex API host used by the web/admin React clients                      |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Convex site/actions host used by Better Auth client and auth route proxy |

### Native

| Variable                      | Purpose                                                |
| ----------------------------- | ------------------------------------------------------ |
| `EXPO_PUBLIC_CONVEX_URL`      | Convex API host used by the Expo app                   |
| `EXPO_PUBLIC_CONVEX_SITE_URL` | Convex site/actions host used by Better Auth in native |

### Auth Variables

These must exist in the backend env for both Cloud and self-hosted:

- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`

## Local Development

### Option 1: Convex Cloud

Run the Convex setup flow once:

```bash
pnpm dev:setup
```

That configures `packages/backend/.env.local` for a Convex Cloud dev deployment. Then start the apps:

```bash
pnpm dev
```

Typical Cloud env shape:

```bash
# packages/backend/.env.local
CONVEX_DEPLOYMENT=dev:your-project
CONVEX_URL=https://your-dev-deployment.convex.cloud
CONVEX_SITE_URL=https://your-dev-deployment.convex.site
SITE_URL=http://localhost:3004
NATIVE_APP_URL=feelchat://
```

```bash
# apps/web/.env.local and apps/admin/.env.local
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-dev-deployment.convex.site
```

```bash
# apps/native/.env.local
EXPO_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://your-dev-deployment.convex.site
```

### Option 2: Self-hosted Convex

Point the backend and apps at your self-hosted dev infrastructure.

```bash
# packages/backend/.env.local
CONVEX_SELF_HOSTED_URL=https://dev-api.example.com
CONVEX_SELF_HOSTED_ADMIN_KEY=your-dev-admin-key
CONVEX_URL=https://dev-api.example.com
CONVEX_SITE_URL=https://dev-actions.example.com
SITE_URL=http://localhost:3004
NATIVE_APP_URL=feelchat://
```

```bash
# apps/web/.env.local and apps/admin/.env.local
NEXT_PUBLIC_CONVEX_URL=https://dev-api.example.com
NEXT_PUBLIC_CONVEX_SITE_URL=https://dev-actions.example.com
```

```bash
# apps/native/.env.local
EXPO_PUBLIC_CONVEX_URL=https://dev-api.example.com
EXPO_PUBLIC_CONVEX_SITE_URL=https://dev-actions.example.com
```

Then run:

```bash
pnpm dev
```

Open [http://localhost:3004](http://localhost:3004) in your browser to see the web application. Use the Expo app or dev client for the native application.

## Better Auth and OAuth Notes

For this repo, Better Auth is served from Convex HTTP actions. That means:

- `CONVEX_SITE_URL` is the real auth base URL
- `SITE_URL` is the user-facing app URL
- web/admin auth clients proxy `/api/auth/*` to `NEXT_PUBLIC_CONVEX_SITE_URL`

For Google OAuth, the callback URI must be registered on the Convex site/actions host:

```text
${CONVEX_SITE_URL}/api/auth/callback/google
```

Examples:

- Dev self-hosted: `https://dev-actions.feelai.chat/api/auth/callback/google`
- Prod self-hosted: `https://actions.feelai.chat/api/auth/callback/google`
- Convex Cloud: `https://<deployment>.convex.site/api/auth/callback/google`

Your Google OAuth configuration should also include the frontend app origins in Authorized JavaScript origins, for example `http://localhost:3004`, `https://dev.feelai.chat`, or `https://feelai.chat`.

## Project Structure

```
dating-ai/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   ├── native/      # Mobile application (React Native, Expo)
├── packages/
│   ├── backend/     # Convex backend functions and schema
```

## Deploying Convex

### Convex Cloud Production

For Convex Cloud, `convex deploy` targets the production deployment for the configured project.

From the repo root:

```bash
pnpm convex:deploy
```

Set production env vars in the Convex dashboard or with the CLI:

```bash
npx convex env set MY_VAR "value" --prod
npx convex env list --prod
```

### Self-hosted Production

Do not rely on `packages/backend/.env.local` for prod deploys. Keep a dedicated prod backend env file such as `packages/backend/.env.production.local`.

Example:

```bash
# packages/backend/.env.production.local
CONVEX_SELF_HOSTED_URL=https://api.example.com
CONVEX_SELF_HOSTED_ADMIN_KEY=your-prod-admin-key
CONVEX_URL=https://api.example.com
CONVEX_SITE_URL=https://actions.example.com
SITE_URL=https://app.example.com
NATIVE_APP_URL=feelchat://
```

Sanity-check before deploying:

```bash
pnpm convex:deploy -- --env-file .env.production.local --dry-run
```

Deploy from the repo root:

```bash
pnpm convex:deploy -- --env-file .env.production.local
```

Equivalent command from `packages/backend`:

```bash
pnpm exec convex deploy --env-file .env.production.local
```

### Self-hosted Runtime Knobs

For self-hosted Convex, runtime knobs from Convex's Rust backend source must be set on the self-hosted Convex server process/container, not with `convex env set` and not in the Convex function env dashboard.

To raise the query/mutation function timeout from the self-hosted default of 1 second, set this on the self-hosted Convex backend service in Railway/Docker/your host provider, then restart or redeploy that service:

```bash
DATABASE_UDF_USER_TIMEOUT_SECONDS=5
```

The app's Convex env/dashboard should still contain app-level function variables such as auth, AI, storage, billing, `SITE_URL`, `NATIVE_APP_URL`, `CONVEX_URL`, and `CONVEX_SITE_URL`. The timeout knob above only affects the server runtime when it is present before the Convex backend process starts.

### Frontend Production Env

Make sure each shipped app points at the prod backend:

```bash
# apps/web/.env.production
NEXT_PUBLIC_CONVEX_URL=https://api.example.com
NEXT_PUBLIC_CONVEX_SITE_URL=https://actions.example.com
```

```bash
# apps/admin/.env.production
NEXT_PUBLIC_CONVEX_URL=https://api.example.com
NEXT_PUBLIC_CONVEX_SITE_URL=https://actions.example.com
```

```bash
# apps/native/.env.production
EXPO_PUBLIC_CONVEX_URL=https://api.example.com
EXPO_PUBLIC_CONVEX_SITE_URL=https://actions.example.com
```

## Production Checklist

- Backend prod env contains the same auth, AI, storage, and billing secrets as dev where required
- `SITE_URL` points to the app domain, not the Convex actions domain
- `CONVEX_SITE_URL` points to the auth/actions host
- Web, admin, and native builds point at prod Convex URLs
- Google OAuth redirect URIs include the prod callback on `CONVEX_SITE_URL`
- Google Authorized JavaScript origins include the app origin on `SITE_URL`
- Self-hosted Convex runtime service has `DATABASE_UDF_USER_TIMEOUT_SECONDS=5` and has been restarted
- Self-hosted deploys use `--env-file .env.production.local`

## Available Scripts

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm dev:web`: Start only the web application
- `pnpm dev:setup`: Setup and configure your Convex project
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm dev:native`: Start the React Native/Expo development server
- `pnpm convex:deploy`: Deploy Convex backend to production
