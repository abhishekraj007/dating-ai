import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { authComponent, createAuth } from "./lib/betterAuth";
import { r2 } from "./uploads";
import { isAllowedImageMime } from "./lib/uploadValidation";
import { createDodoWebhookHandler } from "@dodopayments/convex";
import {
  processDodoPaymentSucceeded,
  processDodoSubscriptionEvent,
} from "./features/dodo/webhooks";
// import * as PolarWebhooks from "./lib/polarWebhooks";
import { handleRevenueCatWebhook } from "./lib/revenuecatWebhooks";

const http = httpRouter();
const avatarCacheControl = "public, max-age=31536000, immutable";

// Register Better Auth routes
authComponent.registerRoutes(http, createAuth, { cors: true });

http.route({
  path: "/dodopayments-webhook",
  method: "POST",
  handler: createDodoWebhookHandler({
    onPaymentSucceeded: async (ctx, payload) => {
      await processDodoPaymentSucceeded(ctx, payload.data);
    },
    onSubscriptionActive: async (ctx, payload) => {
      await processDodoSubscriptionEvent(ctx, payload.data, "active");
    },
    onSubscriptionRenewed: async (ctx, payload) => {
      await processDodoSubscriptionEvent(ctx, payload.data, "renewed");
    },
    onSubscriptionUpdated: async (ctx, payload) => {
      await processDodoSubscriptionEvent(ctx, payload.data, "updated");
    },
    onSubscriptionCancelled: async (ctx, payload) => {
      await processDodoSubscriptionEvent(ctx, payload.data, "cancelled");
    },
    onSubscriptionExpired: async (ctx, payload) => {
      await processDodoSubscriptionEvent(ctx, payload.data, "expired");
    },
    onSubscriptionFailed: async (ctx, payload) => {
      await processDodoSubscriptionEvent(ctx, payload.data, "failed");
    },
    onSubscriptionOnHold: async (ctx, payload) => {
      await processDodoSubscriptionEvent(ctx, payload.data, "on_hold");
    },
  }),
});

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

// Telegram bot webhook. Telegram retries on non-2xx, so this must stay fast:
// the update is persisted and processing happens asynchronously.
const MAX_TELEGRAM_UPDATE_LENGTH = 32_768;

http.route({
  path: "/telegram/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret) {
      return new Response("Telegram is not configured", { status: 503 });
    }

    if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const raw = await request.text();
    if (raw.length > MAX_TELEGRAM_UPDATE_LENGTH) {
      return new Response("Payload too large", { status: 413 });
    }

    let updateId: unknown;
    try {
      const parsed = JSON.parse(raw) as { update_id?: unknown };
      updateId = parsed.update_id;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (typeof updateId !== "number" || !Number.isFinite(updateId)) {
      return new Response("Missing update_id", { status: 400 });
    }

    await ctx.runMutation(internal.features.telegram.webhook.recordUpdate, {
      updateId,
      payload: raw,
    });

    return new Response("ok", { status: 200 });
  }),
});

export default http;
