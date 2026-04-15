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

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
pnpm dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3004](http://localhost:3004) in your browser to see the web application.
Use the Expo Go app to run the mobile application.
Your app will connect to the Convex cloud backend automatically.

## Project Structure

```
dating-ai/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   ├── native/      # Mobile application (React Native, Expo)
├── packages/
│   ├── backend/     # Convex backend functions and schema
```

## Deploying Convex to Production

During development, `convex dev` syncs your backend functions to the **development** deployment. To push to **production**, use `convex deploy`.

### 1. Deploy backend functions

From the project root:

```bash
pnpm convex:deploy
```

This pushes all functions, schema, and indexes to your production Convex deployment.

### 2. Set production environment variables

Any environment variables you have in your dev deployment need to be set on production too. You can do this via:

**Convex Dashboard:**
Go to [dashboard.convex.dev](https://dashboard.convex.dev), select your project, switch to the **Production** deployment, and add variables under **Settings > Environment Variables**.

**CLI:**

```bash
npx convex env set MY_VAR "value" --prod
```

To list current production env vars:

```bash
npx convex env list --prod
```

### 3. Update frontend environment variables

Make sure your web and native apps point to the **production** Convex URL (`NEXT_PUBLIC_CONVEX_URL` / `EXPO_PUBLIC_CONVEX_URL`) when building for production. The production URL is available in the Convex dashboard.

### 4. Deploy frontend apps

Build and deploy the Next.js web app and Expo native app as usual using your hosting provider (Vercel, EAS, etc.).

## Available Scripts

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm dev:web`: Start only the web application
- `pnpm dev:setup`: Setup and configure your Convex project
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm dev:native`: Start the React Native/Expo development server
- `pnpm convex:deploy`: Deploy Convex backend to production
