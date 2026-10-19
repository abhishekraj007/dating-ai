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
 *  - channelLinkToken: cap Telegram link-token minting per user.
 *  - telegramMessage: cap inbound Telegram messages per user before they
 *    reach the chat pipeline (token bucket, burst 6, 12/min sustained).
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
  channelLinkToken: {
    kind: "token bucket",
    rate: 5,
    period: MINUTE,
    capacity: 3,
  },
  telegramMessage: {
    kind: "token bucket",
    rate: 12,
    period: MINUTE,
    capacity: 6,
  },
});
