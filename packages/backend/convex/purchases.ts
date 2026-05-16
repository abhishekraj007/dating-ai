import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserAndProfileOrThrow } from "./model/user";

export const addCredits = mutation({
  args: {
    amount: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, _args) => {
    await getUserAndProfileOrThrow(ctx);

    return {
      success: false,
      message: "Credit purchases are fulfilled by RevenueCat webhooks.",
    };
  },
});

export const upgradeToPremium = mutation({
  args: {
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, _args) => {
    await getUserAndProfileOrThrow(ctx);

    return {
      success: false,
      message: "Premium purchases are fulfilled by RevenueCat webhooks.",
    };
  },
});

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await getUserAndProfileOrThrow(ctx);
    return profile;
  },
});
