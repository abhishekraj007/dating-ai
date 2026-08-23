# Important

- Divide logics and UI into hooks and components.
- Keep files and component maintable and shorts, devide into multiple if required.
- Always seperate UI and logics into components and hooks.
- Do not use useCallback unless necessary.
- Do not use useMemo unless necessary.
- Prefer plain render-time derivation by default. With modern React/React Native and React Compiler, do not add `useMemo` or `useCallback` unless there is a measured performance issue, a correctness requirement, or a library/API that truly needs stable identity.
- Write layout and components that should work in both light and dark mode.
- Layout and components should be mobile first and responsive.
- Do not write documentation .md file untill neccessary and it's a big feature.
- **ALWAYS check heroui-native MCP server for available components before using native React Native components**
- Prefer heroui-native components over native components when available (Button over Pressable, TextField over TextInput, Avatar for avatars, Card for cards, etc.)
- Use heroui-native list_components tool to see all available components before implementing UI
- **ALWAYS use expo-image for images in native apps** - provides caching, prefetching, and better performance. Use `cachePolicy="memory-disk"`, `contentFit="cover"`, and `transition` for smooth loading.
- **ALWAYS check relevant skills before starting any related task:**
  - For React Native/Expo UI work: check `building-native-ui`, `vercel-react-native-skills`
  - For Convex backend work: check `convex` (index skill that routes to sub-skills like convex-functions, convex-schema-validator, convex-agents, convex-best-practices, etc.)
  - For React/Next.js web development: check `vercel-react-best-practices`
  - For web UI design, accessibility, and UX audits: check `web-design-guidelines`
  - For building visually polished web interfaces, landing pages, or dashboards: check `frontend-design`
  - For upgrading Expo SDK or fixing dependency issues: check `upgrading-expo`
  - Read the SKILL.md file for each relevant skill before implementing
- **ALWAYS check heroui-react MCP server for available components before using shadcn-ui components**
- use heroui-react and shadcn-ui for web components and screens development
- use Use shadcn CLI for installing any new web components
- never create markdown (`.md`) files after you're done unless it's a big feature and planning is required. NEVER!
- never user emojis in your replies.
- check convex rules and docs if you're working on convex based projects and not sure about something. For complex convex bugs/implementation, use convex MCP or exa search tool to access latest docs.
- **ALWAYS verify the latest official docs/changelogs before implementing or refactoring library/SDK usage (especially AI SDK, Convex, Next.js, Expo, and React), and prefer current APIs over deprecated ones.**
- Always make sure code you write is secure and not hackable
- **ALWAYS Only make changes that are directly requested. Keep solutions simple and focused.**
- **ALWAYS read and understand relevant files before proposing edits. Do not speculate about code you have not inspected.**

## Cursor Cloud specific instructions

Monorepo (pnpm + turbo). Services and dev commands (run from repo root): `pnpm dev:server` (Convex backend), `pnpm dev:web` (Next.js web on :3004), `pnpm dev:admin` (Next.js admin on :3005), `pnpm dev:native` (Expo/Metro). `pnpm dev` runs all via turbo. See `README.md` / `ENV_SETUP.md` / `AUTH_SETUP.md` for the full env-var reference; the notes below only capture non-obvious cloud gotchas.

Convex runs as a local (no-cloud) deployment here. Start it with `CONVEX_AGENT_MODE=anonymous npx convex dev` from `packages/backend` (plain `pnpm dev:server` / `convex dev` without that env var tries an interactive Convex Cloud login and will hang). First run downloads the backend binary + dashboard, provisions a local deployment, and writes `packages/backend/.env.local`. The local deployment's database, function env vars, and the dashboard (http://127.0.0.1:6790) all live under `packages/backend/.convex/` (self-ignored; it persists in the VM working dir but is never committed). API host is http://127.0.0.1:3210, site/actions host is http://127.0.0.1:3211.

The Convex push FAILS at module-analysis time unless certain deployment env vars exist, because `convex/uploads.ts` constructs the R2 client at import. Set these on the deployment with `npx convex env set NAME value` (from `packages/backend`): `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_TOKEN` (placeholders are fine for non-R2 work), plus `BETTER_AUTH_SECRET`, `SITE_URL=http://localhost:3004`, `NATIVE_APP_URL=feelchat://`. `CONVEX_SITE_URL` is built-in and cannot be set. If `.convex/` survived from a snapshot these are already present — verify with `npx convex env list` before re-setting.

Frontend apps need gitignored `.env.local` files pointing at the local backend (recreate if missing): `apps/web/.env.local` and `apps/admin/.env.local` with `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210` and `NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211`. The web app also honors `NEXT_PUBLIC_DISABLE_WEB_LOGIN=false` and `NEXT_PUBLIC_DISABLE_WEB_PAYMENT=false` to enable web sign-in/checkout locally (both default to a "download the app" modal when unset). `apps/native/.env.local` uses the `EXPO_PUBLIC_CONVEX_URL` / `EXPO_PUBLIC_CONVEX_SITE_URL` equivalents.

Auth for local testing: Better Auth email/password is enabled (no email verification). Google/Apple OAuth need real credentials that are not set locally — the recurring `Social provider google is missing clientId or clientSecret` log is expected and harmless. The web app's login UI only exposes Google, so use the ADMIN app (:3005) for email/password sign-up/sign-in when testing the auth stack. The admin dashboard is gated on `profile.isAdmin === true`; a fresh account is bounced with "Access denied" until you set `isAdmin` on its `profile` row (via the local Convex dashboard data editor or a one-off internal mutation). After admin sign-in the app redirects to `SITE_URL` (:3004, the web app) via Better Auth's crossDomain plugin — navigate back to :3005 for the console; this is expected, not a bug.

AI features (agent chat, image/video generation via `AI_GATEWAY_API_KEY`/`OPENROUTER_API_KEY`/`REPLICATE_API_TOKEN` and real Cloudflare R2) require external keys. Without them auth, database, and CRUD flows work, but AI generation and real uploads will fail.

Lint/test/build: only `apps/web` defines a lint script (`pnpm -F web lint`) and it currently reports pre-existing errors unrelated to setup. There is no automated test suite. `next build` runs ESLint and will fail on those pre-existing web lint errors, so dev mode (`pnpm dev:*`) is the supported run path. The Expo native app needs a simulator/device and is not runnable headless in the cloud VM.
