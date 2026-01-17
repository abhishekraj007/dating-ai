import { fetchMutation, fetchQuery, fetchAction } from "convex/nextjs";
import { api } from "@dating-ai/backend/convex/_generated/api";

/**
 * Server-side Convex helpers for API routes and webhooks
 * These functions can only be called from Next.js server context
 * (Server Components, Server Actions, API Routes)
 */

export { fetchMutation, fetchQuery, fetchAction, api };
