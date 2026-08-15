import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";

export const setDodoCustomerId = internalMutation({
  args: {
    authUserId: v.string(),
    dodoCustomerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.authUserId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found for user");
    }

    if (profile.dodoCustomerId === args.dodoCustomerId) {
      return null;
    }

    await ctx.db.patch(profile._id, {
      dodoCustomerId: args.dodoCustomerId,
    });

    return null;
  },
});
