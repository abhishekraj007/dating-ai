import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import * as Users from "./model/user";

export const fetchUserAndProfile = query({
  handler: async (ctx) => {
    return await Users.getUserAndProfile(ctx);
  },
});

/**
 * Mark onboarding as complete for the authenticated user
 */
export const markOnboardingComplete = mutation({
  args: {},
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx) => {
    const { profile } = await Users.getUserAndProfileOrThrow(ctx);

    await ctx.db.patch(profile._id, {
      hasCompletedOnboarding: true,
    });

    return { success: true };
  },
});
