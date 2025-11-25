import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";

/**
 * Internal query to get conversation without auth check.
 * Used by actions that already validated the request.
 */
export const getConversationInternal = internalQuery({
  args: {
    conversationId: v.id("aiConversations"),
  },
  handler: async (ctx, { conversationId }) => {
    return await ctx.db.get(conversationId);
  },
});

/**
 * Internal query to get AI profile without auth check.
 * Used by actions that already validated the request.
 */
export const getProfileInternal = internalQuery({
  args: {
    profileId: v.id("aiProfiles"),
  },
  handler: async (ctx, { profileId }) => {
    return await ctx.db.get(profileId);
  },
});

/**
 * Internal query to get chat image request without auth check.
 * Used by actions processing the request.
 */
export const getChatImageRequestInternal = internalQuery({
  args: {
    requestId: v.id("chatImages"),
  },
  handler: async (ctx, { requestId }) => {
    return await ctx.db.get(requestId);
  },
});
