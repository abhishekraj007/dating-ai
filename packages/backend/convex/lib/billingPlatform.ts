import { v } from "convex/values";

export const billingPlatformValidator = v.union(
  v.literal("polar"),
  v.literal("revenuecat"),
  v.literal("dodo"),
);

export function isWebBillingPlatform(platform: string) {
  return platform === "polar" || platform === "dodo";
}
