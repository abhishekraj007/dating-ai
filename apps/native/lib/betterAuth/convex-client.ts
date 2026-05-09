import type { BetterAuthClientPlugin } from "better-auth";
import type { convex } from "@convex-dev/better-auth/plugins";

export const convexClient = () =>
  ({
    id: "convex",
    $InferServerPlugin: {} as ReturnType<typeof convex>,
    pathMethods: {
      "/convex/token": "GET",
    },
  }) satisfies BetterAuthClientPlugin;
