import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";
import polar from "@convex-dev/polar/convex.config";
import agent from "@convex-dev/agent/convex.config";
import r2 from "@convex-dev/r2/convex.config.js";
import pushNotifications from "@convex-dev/expo-push-notifications/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(polar);
app.use(agent);
app.use(r2);
app.use(pushNotifications);
app.use(rateLimiter);

export default app;
