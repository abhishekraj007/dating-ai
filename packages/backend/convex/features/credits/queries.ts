import { query } from "../../_generated/server";
import * as Users from "../../model/user";

/**
 * Get user's current credit balance and premium status
 * Premium status is derived from active subscriptions
 */
export const getUserCredits = query({
  handler: async (ctx) => {
    const userData = await Users.getUserAndProfile(ctx);
    if (!userData) {
      return null;
    }

    // Check if user has any active subscription
    const activeSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_status", (q: any) =>
        q.eq("userId", userData.userMetadata._id).eq("status", "active")
      )
      .first();

    return {
      credits: userData.profile?.credits ?? 0,
      isPremium: !!activeSubscription,
      name: userData.profile?.name || userData.userMetadata.name,
    };
  },
});
