import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";

// Use crossDomainClient plugin for multi-app OAuth (handles cross-domain cookie storage)
// baseURL points to Convex site where auth API is hosted
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
  plugins: [convexClient(), crossDomainClient()],
});

export type AuthClient = typeof authClient;
