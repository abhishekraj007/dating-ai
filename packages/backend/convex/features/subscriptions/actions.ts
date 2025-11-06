import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

/**
 * Server-side actions for webhook handlers
 * These can be called from Next.js API routes using fetchAction
 * They internally call secure internal mutations
 */

/**
 * Action to create or update subscription from webhooks
 * Called from Next.js Polar webhook handler
 */
export const upsertSubscriptionFromWebhook = action({
  args: {
    userId: v.string(),
    platform: v.union(v.literal("polar"), v.literal("revenuecat")),
    platformCustomerId: v.string(),
    platformSubscriptionId: v.string(),
    platformProductId: v.string(),
    customerEmail: v.string(),
    customerName: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("expired"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    productType: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
  },
  returns: v.object({
    subscriptionId: v.id("subscriptions"),
    isNew: v.boolean(),
    isRenewal: v.boolean(),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{
    subscriptionId: Id<"subscriptions">;
    isNew: boolean;
    isRenewal: boolean;
  }> => {
    // Call internal mutation - this is secure and can't be called from browser
    const result: {
      subscriptionId: Id<"subscriptions">;
      isNew: boolean;
      isRenewal: boolean;
    } = await ctx.runMutation(
      internal.features.subscriptions.mutations.upsertSubscription,
      args
    );
    return result;
  },
});

/**
 * Action to sync premium status from webhooks
 */
export const syncPremiumFromWebhook = action({
  args: {
    userId: v.string(),
    hasActiveSubscription: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const result: { success: boolean } = await ctx.runMutation(
      internal.features.premium.mutations.syncPremiumFromSubscription,
      args
    );
    return result;
  },
});

/**
 * Action to add bonus credits from webhooks
 */
export const addBonusCreditsFromWebhook = action({
  args: {
    userId: v.string(),
    bonusCredits: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    newCredits: v.number(),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; newCredits: number }> => {
    console.log("addBonusCreditsFromWebhook called with args:", args);

    const result: { success: boolean; newCredits: number } =
      await ctx.runMutation(
        internal.features.credits.mutations.addBonusCredits,
        args
      );
    return result;
  },
});

/**
 * Action to add purchased credits from webhooks
 */
export const addCreditsFromWebhook = action({
  args: {
    userId: v.string(),
    amount: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    newCredits: v.number(),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; newCredits: number }> => {
    console.log("addCreditsFromWebhook called with args:", args);
    const result: { success: boolean; newCredits: number } =
      await ctx.runMutation(
        internal.features.credits.mutations.addCreditsToUser,
        args
      );
    return result;
  },
});

/**
 * Action to insert order from webhooks
 */
export const insertOrderFromWebhook = action({
  args: {
    userId: v.string(),
    platform: v.union(v.literal("polar"), v.literal("revenuecat")),
    platformOrderId: v.string(),
    platformProductId: v.string(),
    amount: v.number(),
    status: v.union(
      v.literal("paid"),
      v.literal("pending"),
      v.literal("failed"),
      v.literal("refunded")
    ),
  },
  returns: v.id("orders"),
  handler: async (ctx, args): Promise<Id<"orders">> => {
    console.log("insertOrderFromWebhook called with args:", args);
    const result: Id<"orders"> = await ctx.runMutation(
      internal.features.subscriptions.mutations.insertOrder,
      args
    );
    return result;
  },
});

/**
 * Action to check if subscription exists (for idempotency)
 */
export const getSubscriptionByPlatformId = action({
  args: {
    platformSubscriptionId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("subscriptions"),
      _creationTime: v.number(),
      userId: v.string(),
      platform: v.union(v.literal("polar"), v.literal("revenuecat")),
      platformCustomerId: v.string(),
      platformSubscriptionId: v.string(),
      platformProductId: v.string(),
      customerEmail: v.string(),
      customerName: v.optional(v.string()),
      status: v.union(
        v.literal("active"),
        v.literal("canceled"),
        v.literal("expired"),
        v.literal("past_due"),
        v.literal("trialing")
      ),
      productType: v.optional(v.string()),
      currentPeriodStart: v.optional(v.number()),
      currentPeriodEnd: v.optional(v.number()),
      canceledAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (
    ctx,
    args
  ): Promise<{
    _id: Id<"subscriptions">;
    _creationTime: number;
    userId: string;
    platform: "polar" | "revenuecat";
    platformCustomerId: string;
    platformSubscriptionId: string;
    platformProductId: string;
    customerEmail: string;
    customerName?: string;
    status: "active" | "canceled" | "expired" | "past_due" | "trialing";
    productType?: string;
    currentPeriodStart?: number;
    currentPeriodEnd?: number;
    canceledAt?: number;
    createdAt: number;
    updatedAt: number;
  } | null> => {
    const result = await ctx.runQuery(
      internal.features.subscriptions.queries
        .getSubscriptionByPlatformSubscriptionId,
      args
    );
    return result;
  },
});

/**
 * Action to check if order exists (for idempotency)
 */
export const getOrderByPlatformId = action({
  args: {
    platformOrderId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("orders"),
      _creationTime: v.number(),
      userId: v.string(),
      platform: v.union(v.literal("polar"), v.literal("revenuecat")),
      platformOrderId: v.string(),
      platformProductId: v.string(),
      amount: v.number(),
      status: v.union(
        v.literal("paid"),
        v.literal("pending"),
        v.literal("failed"),
        v.literal("refunded")
      ),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (
    ctx,
    args
  ): Promise<{
    _id: Id<"orders">;
    _creationTime: number;
    userId: string;
    platform: "polar" | "revenuecat";
    platformOrderId: string;
    platformProductId: string;
    amount: number;
    status: "paid" | "pending" | "failed" | "refunded";
    createdAt: number;
  } | null> => {
    const result = await ctx.runQuery(
      internal.features.subscriptions.queries.getOrderByPlatformOrderId,
      args
    );
    return result;
  },
});
