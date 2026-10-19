import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { authComponent } from "../../lib/betterAuth";
import { rateLimiter } from "../../lib/rateLimit";
import {
  buildTelegramDeepLink,
  deleteTelegramForumTopic,
  getTelegramBotUsername,
} from "./client";
import { generateLinkToken, hashLinkToken } from "./helpers";

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

/**
 * Mint a one-time Telegram deep link for a character.
 * The user taps the link, presses Start, and the chat is connected.
 */
export const createLinkToken = mutation({
  args: { aiProfileId: v.id("aiProfiles") },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, { aiProfileId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const botUsername = getTelegramBotUsername();
    if (!botUsername) {
      throw new Error("Telegram is not configured");
    }

    const profile = await ctx.db.get(aiProfileId);
    if (!profile || profile.status !== "active") {
      throw new Error("Profile not found");
    }

    await rateLimiter.limit(ctx, "channelLinkToken", {
      key: user._id,
      throws: true,
    });

    const token = generateLinkToken();
    const tokenHash = await hashLinkToken(token);
    const now = Date.now();

    await ctx.db.insert("channelLinkTokens", {
      tokenHash,
      userId: user._id,
      aiProfileId,
      expiresAt: now + LINK_TOKEN_TTL_MS,
      createdAt: now,
    });

    return { url: buildTelegramDeepLink(botUsername, token) };
  },
});

/**
 * Whether the current user already has this character connected on Telegram.
 */
export const getLinkStatus = query({
  args: { aiProfileId: v.id("aiProfiles") },
  returns: v.object({
    linked: v.boolean(),
    botUsername: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, { aiProfileId }) => {
    const botUsername = getTelegramBotUsername();
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return { linked: false, botUsername };
    }

    const threads = await ctx.db
      .query("channelThreads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(50);

    if (!threads.some((thread) => thread.aiProfileId === aiProfileId)) {
      return { linked: false, botUsername };
    }

    // The character chat can also be disconnected from the Telegram side
    // (/unlink); reflect that in the app.
    const link = await ctx.db
      .query("channelLinks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return {
      linked: link?.status === "active",
      botUsername,
    };
  },
});

/**
 * Disconnect a character on Telegram from the app. The Telegram topic (when
 * topics are enabled) is deleted on a best-effort basis.
 */
export const unlinkCharacter = mutation({
  args: { aiProfileId: v.id("aiProfiles") },
  returns: v.null(),
  handler: async (ctx, { aiProfileId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const threads = await ctx.db
      .query("channelThreads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(50);

    for (const thread of threads) {
      if (thread.aiProfileId !== aiProfileId) {
        continue;
      }

      await ctx.db.delete(thread._id);

      if (thread.topicId !== undefined) {
        await ctx.scheduler.runAfter(
          0,
          internal.features.telegram.linking.deleteTopicAction,
          {
            platformChatId: thread.platformChatId,
            topicId: thread.topicId,
          },
        );
      }
    }

    return null;
  },
});

/** Best-effort topic cleanup; failures are logged and ignored. */
export const deleteTopicAction = internalAction({
  args: { platformChatId: v.string(), topicId: v.number() },
  returns: v.null(),
  handler: async (_ctx, { platformChatId, topicId }) => {
    try {
      await deleteTelegramForumTopic(platformChatId, topicId);
    } catch (error) {
      console.warn(
        "Failed to delete Telegram topic:",
        error instanceof Error ? error.message : error,
      );
    }
    return null;
  },
});

type ConsumeLinkResult =
  | { ok: false }
  | {
      ok: true;
      userId: string;
      aiProfileId: Id<"aiProfiles">;
      profileName: string;
      conversationId: Id<"aiConversations">;
      conversationIsNew: boolean;
      threadId: Id<"channelThreads">;
    };

/**
 * Redeems a /start deep-link token: verifies + burns the token, upserts the
 * account link, ensures the shared conversation exists, and maps the
 * character to this Telegram chat.
 */
export const consumeLinkToken = internalMutation({
  args: {
    token: v.string(),
    platformUserId: v.string(),
    platformChatId: v.string(),
  },
  returns: v.union(
    v.object({ ok: v.literal(false) }),
    v.object({
      ok: v.literal(true),
      userId: v.string(),
      aiProfileId: v.id("aiProfiles"),
      profileName: v.string(),
      conversationId: v.id("aiConversations"),
      conversationIsNew: v.boolean(),
      threadId: v.id("channelThreads"),
    }),
  ),
  handler: async (ctx, args): Promise<ConsumeLinkResult> => {
    const tokenHash = await hashLinkToken(args.token);
    const tokenRow = await ctx.db
      .query("channelLinkTokens")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!tokenRow || tokenRow.usedAt || tokenRow.expiresAt < Date.now()) {
      return { ok: false };
    }

    const profile = await ctx.db.get(tokenRow.aiProfileId);
    if (!profile || profile.status !== "active") {
      return { ok: false };
    }

    const now = Date.now();
    await ctx.db.patch(tokenRow._id, { usedAt: now });

    const existingLink = await ctx.db
      .query("channelLinks")
      .withIndex("by_platform_and_platform_user", (q) =>
        q
          .eq("platform", "telegram")
          .eq("platformUserId", args.platformUserId),
      )
      .first();

    if (existingLink) {
      await ctx.db.patch(existingLink._id, {
        status: "active",
        platformChatId: args.platformChatId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("channelLinks", {
        platform: "telegram",
        platformUserId: args.platformUserId,
        platformChatId: args.platformChatId,
        userId: tokenRow.userId,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    }

    const conversation: {
      conversationId: Id<"aiConversations">;
      isNew: boolean;
    } = await ctx.runMutation(
      internal.features.ai.mutations.startConversationInternal,
      {
        userId: tokenRow.userId,
        aiProfileId: tokenRow.aiProfileId,
        // The webhook creates the opening delivery (so it knows the topic);
        // don't schedule an undeliverable opening here.
        skipOpeningMessage: true,
      },
    );

    const existingThread = await ctx.db
      .query("channelThreads")
      .withIndex("by_chat_and_profile", (q) =>
        q
          .eq("platformChatId", args.platformChatId)
          .eq("aiProfileId", tokenRow.aiProfileId),
      )
      .first();

    let threadId: Id<"channelThreads">;
    if (existingThread) {
      await ctx.db.patch(existingThread._id, {
        userId: tokenRow.userId,
        conversationId: conversation.conversationId,
        updatedAt: now,
      });
      threadId = existingThread._id;
    } else {
      threadId = await ctx.db.insert("channelThreads", {
        platform: "telegram",
        platformChatId: args.platformChatId,
        userId: tokenRow.userId,
        aiProfileId: tokenRow.aiProfileId,
        conversationId: conversation.conversationId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // In single-chat mode exactly one character receives plain messages.
    const threads = await ctx.db
      .query("channelThreads")
      .withIndex("by_platform_and_chat", (q) =>
        q.eq("platform", "telegram").eq("platformChatId", args.platformChatId),
      )
      .take(50);

    for (const thread of threads) {
      const shouldBeActive = thread._id === threadId;
      if (thread.isActive !== shouldBeActive) {
        await ctx.db.patch(thread._id, {
          isActive: shouldBeActive,
          updatedAt: now,
        });
      }
    }

    return {
      ok: true,
      userId: tokenRow.userId,
      aiProfileId: tokenRow.aiProfileId,
      profileName: profile.name,
      conversationId: conversation.conversationId,
      conversationIsNew: conversation.isNew,
      threadId,
    };
  },
});

export const setThreadTopic = internalMutation({
  args: { threadId: v.id("channelThreads"), topicId: v.number() },
  returns: v.null(),
  handler: async (ctx, { threadId, topicId }) => {
    await ctx.db.patch(threadId, { topicId, updatedAt: Date.now() });
    return null;
  },
});

/** Switches which character receives plain messages in single-chat mode. */
export const setActiveThread = internalMutation({
  args: {
    platformChatId: v.string(),
    aiProfileId: v.id("aiProfiles"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const threads = await ctx.db
      .query("channelThreads")
      .withIndex("by_platform_and_chat", (q) =>
        q.eq("platform", "telegram").eq("platformChatId", args.platformChatId),
      )
      .take(50);

    const target = threads.find(
      (thread) => thread.aiProfileId === args.aiProfileId,
    );
    if (!target) {
      return false;
    }

    const now = Date.now();
    for (const thread of threads) {
      const shouldBeActive = thread._id === target._id;
      if (thread.isActive !== shouldBeActive) {
        await ctx.db.patch(thread._id, {
          isActive: shouldBeActive,
          updatedAt: now,
        });
      }
    }

    return true;
  },
});

/** Revokes the Telegram link for a chat (used by /unlink). */
export const revokeLink = internalMutation({
  args: { platformUserId: v.string() },
  returns: v.null(),
  handler: async (ctx, { platformUserId }) => {
    const link = await ctx.db
      .query("channelLinks")
      .withIndex("by_platform_and_platform_user", (q) =>
        q.eq("platform", "telegram").eq("platformUserId", platformUserId),
      )
      .first();

    if (link) {
      await ctx.db.patch(link._id, {
        status: "revoked",
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});
