import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

/**
 * Named rate limits for the app.
 *
 * Token-bucket semantics: `rate` tokens refill per `period`, up to `capacity` in burst.
 *
 *  - uploadUrlMint: cap direct-to-R2 upload URL minting per user.
 *    10 uploads/min with burst of 5 — ample for legitimate gallery editing,
 *    prevents bill-shock + storage abuse.
 *  - adminUploadUrlMint: generous admin limit for bulk profile editing.
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  uploadUrlMint: {
    kind: "token bucket",
    rate: 10,
    period: MINUTE,
    capacity: 5,
  },
  adminUploadUrlMint: {
    kind: "token bucket",
    rate: 60,
    period: MINUTE,
    capacity: 10,
  },
});
