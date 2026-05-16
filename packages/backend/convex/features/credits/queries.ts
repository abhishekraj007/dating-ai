import { query } from "../../_generated/server";
import { v } from "convex/values";
import * as Users from "../../model/user";

/**
 * Get user's current credit balance and premium status
 * Premium status is read from the profile table.
 */
export const getUserCredits = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      credits: v.number(),
      isPremium: v.boolean(),
      name: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const userData = await Users.getUserAndProfile(ctx);
    if (!userData) {
      return null;
    }

    return {
      credits: userData.profile?.credits ?? 0,
      isPremium: Boolean(userData.profile?.isPremium),
      name: userData.profile?.name ?? userData.userMetadata.name ?? "",
    };
  },
});
