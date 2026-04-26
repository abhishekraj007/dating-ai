import { query, mutation } from "../../_generated/server";
import * as Users from "../../model/user";
import { getPremiumAccessSnapshot } from "./guards";

/**
 * Read-only check if user has premium access (query - no cleanup)
 * Use this for UI display
 */
export const isPremium = query({
  handler: async (ctx) => {
    return await getPremiumAccessSnapshot(ctx);
  },
});

/**
 * Check if user has premium access
 * Considers both manual grants and active subscriptions
 * Note: This is a mutation (not query) because it may clean up expired grants
 */
export const checkPremiumStatus = mutation({
  handler: async (ctx) => {
    const userData = await Users.getUserAndProfile(ctx);
    if (!userData) {
      return { isPremium: false, reason: "Not authenticated" };
    }

    const profile = userData.profile;
    const now = Date.now();

    // Check manual/lifetime premium first
    if (profile?.isPremium) {
      if (profile.premiumGrantedBy === "lifetime") {
        return {
          isPremium: true,
          grantedBy: "lifetime",
          reason: "Lifetime access",
        };
      }

      if (profile.premiumGrantedBy === "manual") {
        // Check if manual grant has expired
        if (profile.premiumExpiresAt && profile.premiumExpiresAt < now) {
          // Expired - revoke premium
          if (profile._id) {
            await ctx.db.patch(profile._id, {
              isPremium: false,
              premiumGrantedBy: undefined,
              premiumExpiresAt: undefined,
            });
          }
          return { isPremium: false, reason: "Manual grant expired" };
        }
        return {
          isPremium: true,
          grantedBy: "manual",
          expiresAt: profile.premiumExpiresAt,
          reason: "Manually granted",
        };
      }
    }

    // Check active subscription
    const activeSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_status", (q: any) =>
        q.eq("userId", userData.userMetadata._id).eq("status", "active"),
      )
      .first();

    if (activeSubscription) {
      // Ensure profile reflects subscription-based premium
      if (
        profile &&
        (!profile.isPremium || profile.premiumGrantedBy !== "subscription")
      ) {
        await ctx.db.patch(profile._id, {
          isPremium: true,
          premiumGrantedBy: "subscription",
          premiumGrantedAt: activeSubscription.createdAt,
        });
      }
      return {
        isPremium: true,
        grantedBy: "subscription",
        platform: activeSubscription.platform,
        subscription: activeSubscription,
        reason: "Active subscription",
      };
    }

    // No premium access
    // If profile shows premium but no subscription, revoke it
    if (
      profile &&
      profile.isPremium &&
      profile.premiumGrantedBy === "subscription"
    ) {
      await ctx.db.patch(profile._id, {
        isPremium: false,
        premiumGrantedBy: undefined,
        premiumGrantedAt: undefined,
      });
    }

    return { isPremium: false, reason: "No active subscription or grant" };
  },
});
