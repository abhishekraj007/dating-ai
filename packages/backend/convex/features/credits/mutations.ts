import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";

/**
 * Internal mutation to add bonus credits to user
 * Called by webhook when subscription is created
 * userId is the Better Auth user's _id (stored as string)
 */
export const addBonusCredits = internalMutation({
  args: {
    userId: v.string(),
    bonusCredits: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found for user");
    }

    const currentCredits = profile.credits ?? 0;
    const newCredits = currentCredits + args.bonusCredits;

    await ctx.db.patch(profile._id, {
      credits: newCredits,
    });

    return { success: true, newCredits };
  },
});

/**
 * Internal mutation to add credits to user account
 * Called by webhook when credit product is purchased
 * userId is the Better Auth user's _id (stored as string)
 */
export const addCreditsToUser = internalMutation({
  args: {
    userId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found for user");
    }

    const currentCredits = profile.credits ?? 0;
    const newCredits = currentCredits + args.amount;

    await ctx.db.patch(profile._id, {
      credits: newCredits,
    });

    return { success: true, newCredits };
  },
});

/**
 * Internal mutation to deduct credits from user account
 * Used by AI features: messages, selfies, character creation
 * Credit costs:
 * - Text message: 1 credit
 * - Voice message: 2 credits
 * - Custom selfie: 5 credits
 * - AI character creation: 10 credits
 */
export const deductCredits = internalMutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found for user");
    }

    const currentCredits = profile.credits ?? 0;

    if (currentCredits < args.amount) {
      throw new Error("Insufficient credits");
    }

    const newCredits = currentCredits - args.amount;

    await ctx.db.patch(profile._id, {
      credits: newCredits,
    });

    return { success: true, newCredits, deducted: args.amount };
  },
});

/**
 * Internal mutation to refund credits to user account
 * Used when an operation fails after credits were deducted
 */
export const refundCredits = internalMutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found for user");
    }

    const currentCredits = profile.credits ?? 0;
    const newCredits = currentCredits + args.amount;

    await ctx.db.patch(profile._id, {
      credits: newCredits,
    });

    return { success: true, newCredits, refunded: args.amount };
  },
});
