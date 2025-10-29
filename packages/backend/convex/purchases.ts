import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserAndProfileOrThrow } from "./model/user";

export const addCredits = mutation({
  args: {
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const { profile } = await getUserAndProfileOrThrow(ctx);
    
    const currentCredits = profile.credits ?? 0;
    const newBalance = currentCredits + args.amount;
    
    await ctx.db.patch(profile._id, {
      credits: newBalance,
    });

    return { success: true, newBalance };
  },
});

export const upgradeToPremium = mutation({
  args: {
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { profile } = await getUserAndProfileOrThrow(ctx);
    
    const currentCredits = profile.credits ?? 0;
    const newCredits = currentCredits + 1000;
    
    const updates: {
      isPremium: boolean;
      credits: number;
      premiumExpiresAt?: number;
    } = {
      isPremium: true,
      credits: newCredits,
    };

    if (args.expiresAt) {
      updates.premiumExpiresAt = args.expiresAt;
    }

    await ctx.db.patch(profile._id, updates);

    return { success: true, newCredits };
  },
});

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await getUserAndProfileOrThrow(ctx);
    return profile;
  },
});
