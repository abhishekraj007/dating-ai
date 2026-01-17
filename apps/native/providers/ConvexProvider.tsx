import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import type React from "react";
import { authClient } from "@/lib/betterAuth/client";

if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
  throw new Error("EXPO_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL, {
  // Don't pause queries - allow public queries for unauthenticated users
  unsavedChangesWarning: false,
  verbose: false, //  __DEV__,
});

export default function ConvexProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <ConvexQueryCacheProvider
        expiration={300000} // 5 minutes - keeps subscriptions alive after unmount
        maxIdleEntries={100} // Cache up to 100 queries
      >
        {children}
      </ConvexQueryCacheProvider>
    </ConvexBetterAuthProvider>
  );
}
