import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";

/**
 * Internal queries for the Telegram integration. Actions validate the data
 * before calling these; each returns a single row or a bounded list.
 */

export const getLinkByPlatformUser = internalQuery({
  args: { platformUserId: v.string() },
  handler: async (ctx, { platformUserId }) => {
    return await ctx.db
      .query("channelLinks")
      .withIndex("by_platform_and_platform_user", (q) =>
        q.eq("platform", "telegram").eq("platformUserId", platformUserId),
      )
      .first();
  },
});

export const getThreadByChatAndProfile = internalQuery({
  args: {
    platformChatId: v.string(),
    aiProfileId: v.id("aiProfiles"),
  },
  handler: async (ctx, { platformChatId, aiProfileId }) => {
    return await ctx.db
      .query("channelThreads")
      .withIndex("by_chat_and_profile", (q) =>
        q.eq("platformChatId", platformChatId).eq("aiProfileId", aiProfileId),
      )
      .first();
  },
});

export const listThreadsByChat = internalQuery({
  args: { platformChatId: v.string() },
  handler: async (ctx, { platformChatId }) => {
    return await ctx.db
      .query("channelThreads")
      .withIndex("by_platform_and_chat", (q) =>
        q.eq("platform", "telegram").eq("platformChatId", platformChatId),
      )
      .take(50);
  },
});

export const getUpdateById = internalQuery({
  args: { updateId: v.number() },
  handler: async (ctx, { updateId }) => {
    return await ctx.db
      .query("telegramUpdates")
      .withIndex("by_update_id", (q) => q.eq("updateId", updateId))
      .first();
  },
});

export const getUpdatePayload = internalQuery({
  args: { updateId: v.number() },
  handler: async (ctx, { updateId }) => {
    const row = await ctx.db
      .query("telegramUpdates")
      .withIndex("by_update_id", (q) => q.eq("updateId", updateId))
      .first();
    return row?.payload ?? null;
  },
});

export const getDeliveryInternal = internalQuery({
  args: { deliveryId: v.id("channelDeliveries") },
  handler: async (ctx, { deliveryId }) => {
    return await ctx.db.get(deliveryId);
  },
});
