import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./lib/betterAuth";
// import * as PolarWebhooks from "./lib/polarWebhooks";
import { handleRevenueCatWebhook } from "./lib/revenuecatWebhooks";
import { streamTutorResponse } from "./englishTutor";

const http = httpRouter();

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

// Register English Tutor streaming route
http.route({
  path: "/tutor-stream",
  method: "POST",
  handler: streamTutorResponse,
});

// Handle CORS preflight for tutor-stream
http.route({
  path: "/tutor-stream",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

export default http;
