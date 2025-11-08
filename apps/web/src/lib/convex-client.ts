import { fetchMutation, fetchQuery, fetchAction } from "convex/nextjs";
import { api } from "@book-ai/backend/convex/_generated/api";

/**
 * Server-side Convex helpers for API routes and webhooks
 * These functions can only be called from Next.js server context
 * (Server Components, Server Actions, API Routes)
 *
 * They use NEXT_PUBLIC_CONVEX_URL automatically and don't expose
 * any client that could be manipulated from the browser
 */

export { fetchMutation, fetchQuery, fetchAction, api };
