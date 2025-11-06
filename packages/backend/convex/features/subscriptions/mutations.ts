import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";

/**
 * Internal mutation to create or update subscription
 * userId is the Better Auth user's _id (stored as string in schema)
 */
export const upsertSubscription = internalMutation({
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
  handler: async (ctx, args) => {
    const now = Date.now();

    console.log(
      "update subscription called with args: userId",
      args.userId,
      args.status,
      args.customerEmail
    );

    // Check if subscription already exists by subscription ID
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_platform_subscription_id", (q) =>
        q.eq("platformSubscriptionId", args.platformSubscriptionId)
      )
      .unique();

    if (existing) {
      // Update existing subscription
      // Check if this is a renewal by comparing period start times
      const isRenewal =
        args.currentPeriodStart !== undefined &&
        existing.currentPeriodStart !== undefined &&
        args.currentPeriodStart > existing.currentPeriodStart;

      console.log("Checking renewal:", {
        isRenewal,
        newPeriodStart: args.currentPeriodStart,
        existingPeriodStart: existing.currentPeriodStart,
      });

      await ctx.db.patch(existing._id, {
        userId: args.userId, // Update userId in case it changed
        status: args.status,
        platformProductId: args.platformProductId,
        productType: args.productType,
        customerEmail: args.customerEmail,
        customerName: args.customerName,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        canceledAt: args.canceledAt,
        updatedAt: now,
      });
      return { subscriptionId: existing._id, isNew: false, isRenewal };
    } else {
      // Create new subscription
      const subscriptionId = await ctx.db.insert("subscriptions", {
        userId: args.userId,
        platform: args.platform,
        platformCustomerId: args.platformCustomerId,
        platformSubscriptionId: args.platformSubscriptionId,
        platformProductId: args.platformProductId,
        customerEmail: args.customerEmail,
        customerName: args.customerName,
        status: args.status,
        productType: args.productType,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        canceledAt: args.canceledAt,
        createdAt: now,
        updatedAt: now,
      });
      return { subscriptionId, isNew: true, isRenewal: false };
    }
  },
});

/**
 * Internal mutation to insert an order
 * Used by webhook handlers that run in HTTP action context
 * userId is the Better Auth user's _id (stored as string in schema)
 */
export const insertOrder = internalMutation({
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
  handler: async (ctx, args) => {
    const orderId = await ctx.db.insert("orders", {
      userId: args.userId,
      platform: args.platform,
      platformOrderId: args.platformOrderId,
      platformProductId: args.platformProductId,
      amount: args.amount,
      status: args.status,
      createdAt: Date.now(),
    });
    return orderId;
  },
});
