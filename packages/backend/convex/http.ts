import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { authComponent, createAuth } from "./lib/betterAuth";
import { r2 } from "./uploads";
import { isAllowedImageMime } from "./lib/uploadValidation";
// import * as PolarWebhooks from "./lib/polarWebhooks";
import { handleRevenueCatWebhook } from "./lib/revenuecatWebhooks";

const http = httpRouter();
const avatarCacheControl = "public, max-age=31536000, immutable";

// Register Better Auth routes
authComponent.registerRoutes(http, createAuth, { cors: true });

// Register Polar webhook routes
// polar.registerRoutes(http, {
//   onSubscriptionCreated: PolarWebhooks.handleSubscriptionCreated,
//   onSubscriptionUpdated: PolarWebhooks.handleSubscriptionUpdated,
//   onProductCreated: PolarWebhooks.handleProductCreated,
//   onProductUpdated: PolarWebhooks.handleProductUpdated,
// });

// Register RevenueCat webhook route
http.route({
  path: "/revenuecat/webhooks",
  method: "POST",
  handler: handleRevenueCatWebhook,
});

http.route({
  path: "/ai-profiles/avatar",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const profileId = url.searchParams.get("profileId");
    const key = url.searchParams.get("key");

    if (!profileId || !key) {
      return new Response("Missing avatar parameters", { status: 400 });
    }

    const profile = await ctx.runQuery(
      internal.features.ai.internalQueries.getProfileInternal,
      {
        profileId: profileId as Id<"aiProfiles">,
      },
    );

    if (!profile || !profile.avatarImageKey || profile.avatarImageKey !== key) {
      return new Response("Avatar not found", { status: 404 });
    }

    const signedUrl = await r2.getUrl(profile.avatarImageKey);
    if (!signedUrl) {
      return new Response("Avatar not found", { status: 404 });
    }

    let upstream: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      upstream = await fetch(signedUrl, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch {
      return new Response("Upstream fetch timed out", { status: 502 });
    }

    if (!upstream.ok || !upstream.body) {
      return new Response("Failed to load avatar", { status: 502 });
    }

    // Validate upstream content-type against image MIME allowlist.
    const contentType = upstream.headers.get("content-type");
    if (!isAllowedImageMime(contentType)) {
      // Consume the body to release the connection, then reject.
      try {
        await upstream.body.cancel();
      } catch {
        /* swallow */
      }
      return new Response("Disallowed content type", { status: 400 });
    }

    const headers = new Headers();
    const contentLength = upstream.headers.get("content-length");
    const etag = upstream.headers.get("etag");
    const lastModified = upstream.headers.get("last-modified");

    if (contentType) {
      headers.set("content-type", contentType);
    }

    if (contentLength) {
      headers.set("content-length", contentLength);
    }

    if (etag) {
      headers.set("etag", etag);
    }

    if (lastModified) {
      headers.set("last-modified", lastModified);
    }

    headers.set("cache-control", avatarCacheControl);

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  }),
});

export default http;
