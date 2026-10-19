import { v } from "convex/values";
import { internalAction, internalMutation } from "../../_generated/server";
import type { ActionCtx } from "../../_generated/server";
import { api, internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import { rateLimiter } from "../../lib/rateLimit";
import { createTelegramForumTopic, isTelegramConfigured, sendTelegramMessage } from "./client";
import {
  buildTelegramConnectedText,
  buildTelegramCreditsText,
  isTelegramTopicsEnabled,
  parseTelegramCommand,
  TELEGRAM_GENERIC_ERROR_TEXT,
  TELEGRAM_HELP_TEXT,
  TELEGRAM_LINK_EXPIRED_TEXT,
  TELEGRAM_NOT_LINKED_TEXT,
  TELEGRAM_TEXT_ONLY_TEXT,
  TELEGRAM_UNLINKED_TEXT,
  truncatePreview,
} from "./helpers";

type TelegramMessage = {
  message_id: number;
  from?: { id: number; is_bot?: boolean; first_name?: string };
  chat: { id: number; type: string };
  message_thread_id?: number;
  text?: string;
};

type TelegramUpdatePayload = {
  update_id: number;
  message?: TelegramMessage;
};

/**
 * Persists an inbound update and schedules processing. Deduplicated by
 * update_id so Telegram retries can't double-process a message.
 */
export const recordUpdate = internalMutation({
  args: { updateId: v.number(), payload: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { updateId, payload }) => {
    const existing = await ctx.db
      .query("telegramUpdates")
      .withIndex("by_update_id", (q) => q.eq("updateId", updateId))
      .first();

    if (existing) {
      return false;
    }

    let preview: string | undefined;
    try {
      const parsed = JSON.parse(payload) as TelegramUpdatePayload;
      const text = parsed.message?.text;
      if (typeof text === "string" && text.trim()) {
        preview = truncatePreview(text);
      }
    } catch {
      // Preview is best effort.
    }

    await ctx.db.insert("telegramUpdates", {
      updateId,
      status: "received",
      payload,
      messagePreview: preview,
      receivedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(
      0,
      internal.features.telegram.webhook.processUpdate,
      { updateId },
    );

    return true;
  },
});

export const markUpdateStatus = internalMutation({
  args: {
    updateId: v.number(),
    status: v.union(
      v.literal("processed"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { updateId, status, error }) => {
    const row = await ctx.db
      .query("telegramUpdates")
      .withIndex("by_update_id", (q) => q.eq("updateId", updateId))
      .first();

    if (!row) {
      return null;
    }

    await ctx.db.patch(row._id, {
      status,
      error: error ? error.slice(0, 500) : undefined,
    });
    return null;
  },
});

/** Rate limit check for inbound messages (must run in a mutation). */
export const consumeTelegramMessageAllowance = internalMutation({
  args: { userId: v.string() },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, { userId }) => {
    const result = await rateLimiter.limit(ctx, "telegramMessage", {
      key: userId,
      throws: false,
    });
    return { ok: result.ok };
  },
});

const UPDATE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Deletes processed/failed updates older than the retention window so the
 * idempotency log (which stores raw payloads) doesn't grow unbounded.
 */
export const cleanupOldUpdates = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const cutoff = Date.now() - UPDATE_RETENTION_MS;
    const stale = await ctx.db
      .query("telegramUpdates")
      .withIndex("by_received_at", (q) => q.lt("receivedAt", cutoff))
      .take(200);

    let deleted = 0;
    for (const row of stale) {
      if (row.status === "received") {
        continue;
      }
      await ctx.db.delete(row._id);
      deleted += 1;
    }
    return deleted;
  },
});

/**
 * Processes one Telegram update: routes commands and plain messages to the
 * shared AI chat pipeline. Runs asynchronously so the webhook can ACK fast.
 */
export const processUpdate = internalAction({
  args: { updateId: v.number() },
  returns: v.null(),
  handler: async (ctx, { updateId }) => {
    if (!isTelegramConfigured()) {
      await ctx.runMutation(
        internal.features.telegram.webhook.markUpdateStatus,
        { updateId, status: "failed", error: "Telegram is not configured" },
      );
      return null;
    }

    const update = await ctx.runQuery(
      internal.features.telegram.internalQueries.getUpdateById,
      { updateId },
    );
    if (!update || update.status !== "received") {
      return null;
    }

    const payload = await ctx.runQuery(
      internal.features.telegram.internalQueries.getUpdatePayload,
      { updateId },
    );
    if (!payload) {
      await ctx.runMutation(
        internal.features.telegram.webhook.markUpdateStatus,
        { updateId, status: "failed", error: "Missing update payload" },
      );
      return null;
    }

    let parsed: TelegramUpdatePayload;
    try {
      parsed = JSON.parse(payload) as TelegramUpdatePayload;
    } catch {
      await ctx.runMutation(
        internal.features.telegram.webhook.markUpdateStatus,
        { updateId, status: "failed", error: "Invalid update payload" },
      );
      return null;
    }

    try {
      await handleUpdate(ctx, parsed);
      await ctx.runMutation(
        internal.features.telegram.webhook.markUpdateStatus,
        { updateId, status: "processed" },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Telegram update processing failed:", message);
      await ctx.runMutation(
        internal.features.telegram.webhook.markUpdateStatus,
        { updateId, status: "failed", error: message },
      );
    }

    return null;
  },
});

async function handleUpdate(
  ctx: ActionCtx,
  update: TelegramUpdatePayload,
): Promise<void> {
  const message = update.message;
  if (!message) {
    return;
  }
  if (!message.from || message.from.is_bot) {
    return;
  }
  if (message.chat.type !== "private") {
    return;
  }

  const platformChatId = String(message.chat.id);
  const platformUserId = String(message.from.id);
  const topicId = message.message_thread_id;
  const text = (message.text ?? "").trim();

  const command = parseTelegramCommand(text);
  if (command) {
    await handleCommand(ctx, {
      command: command.command,
      args: command.args,
      platformChatId,
      platformUserId,
      topicId,
    });
    return;
  }

  if (!text) {
    await sendTelegramMessage(
      { chatId: platformChatId, topicId },
      TELEGRAM_TEXT_ONLY_TEXT,
    );
    return;
  }

  await handleUserMessage(ctx, {
    platformChatId,
    platformUserId,
    topicId,
    text,
  });
}

async function handleCommand(
  ctx: ActionCtx,
  args: {
    command: string;
    args: string;
    platformChatId: string;
    platformUserId: string;
    topicId?: number;
  },
): Promise<void> {
  const { platformChatId, platformUserId, topicId } = args;

  switch (args.command) {
    case "start": {
      if (args.args) {
        await handleStartWithToken(ctx, args.args, args);
        return;
      }
      await handleStartWithoutToken(ctx, { platformChatId, platformUserId });
      return;
    }
    case "help": {
      await sendTelegramMessage({ chatId: platformChatId, topicId }, TELEGRAM_HELP_TEXT);
      return;
    }
    case "unlink": {
      await ctx.runMutation(
        internal.features.telegram.linking.revokeLink,
        { platformUserId },
      );
      await sendTelegramMessage(
        { chatId: platformChatId, topicId },
        TELEGRAM_UNLINKED_TEXT,
      );
      return;
    }
    case "switch": {
      await handleSwitch(ctx, { args: args.args, platformChatId, topicId });
      return;
    }
    case "privacy": {
      const config = await ctx.runQuery(
        api.features.appConfig.queries.getPublicAppConfig,
        {},
      );
      const privacyUrl = config?.privacyUrl ?? config?.baseWebUrl;
      await sendTelegramMessage(
        { chatId: platformChatId, topicId },
        privacyUrl
          ? `You can read the FeelChat privacy policy here:\n${privacyUrl}`
          : "You can find the FeelChat privacy policy in the app settings.",
      );
      return;
    }
    default: {
      await sendTelegramMessage({ chatId: platformChatId, topicId }, TELEGRAM_HELP_TEXT);
      return;
    }
  }
}

/** Redeems a /start <token> deep link and connects the character. */
async function handleStartWithToken(
  ctx: ActionCtx,
  token: string,
  args: { platformChatId: string; platformUserId: string },
): Promise<void> {
  const { platformChatId, platformUserId } = args;

  const result = await ctx.runMutation(
    internal.features.telegram.linking.consumeLinkToken,
    { token, platformUserId, platformChatId },
  );

  if (!result.ok) {
    await sendTelegramMessage(
      { chatId: platformChatId },
      TELEGRAM_LINK_EXPIRED_TEXT,
    );
    return;
  }

  // Create the private-chat topic when enabled; fall back to a single DM.
  let replyTopicId: number | undefined;
  if (isTelegramTopicsEnabled()) {
    const thread = await ctx.runQuery(
      internal.features.telegram.internalQueries.getThreadByChatAndProfile,
      { platformChatId, aiProfileId: result.aiProfileId },
    );

    if (thread?.topicId !== undefined) {
      replyTopicId = thread.topicId;
    } else {
      try {
        const topicId = await createTelegramForumTopic(
          platformChatId,
          result.profileName,
        );
        await ctx.runMutation(
          internal.features.telegram.linking.setThreadTopic,
          { threadId: result.threadId, topicId },
        );
        replyTopicId = topicId;
      } catch (error) {
        console.warn(
          "Telegram topic creation failed, using single chat:",
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  await sendTelegramMessage(
    { chatId: platformChatId, topicId: replyTopicId },
    buildTelegramConnectedText(result.profileName),
  );

  if (result.conversationIsNew) {
    const deliveryId: Id<"channelDeliveries"> = await ctx.runMutation(
      internal.features.telegram.delivery.queueOpeningDelivery,
      {
        platformChatId,
        topicId: replyTopicId,
        userId: result.userId,
        aiProfileId: result.aiProfileId,
        conversationId: result.conversationId,
      },
    );
    await ctx.scheduler.runAfter(
      0,
      internal.features.telegram.delivery.refreshTyping,
      { deliveryId, attempts: 0 },
    );
  }
}

/** /start with no payload: report link state or explain how to link. */
async function handleStartWithoutToken(
  ctx: ActionCtx,
  args: { platformChatId: string; platformUserId: string },
): Promise<void> {
  const { platformChatId, platformUserId } = args;
  const link = await ctx.runQuery(
    internal.features.telegram.internalQueries.getLinkByPlatformUser,
    { platformUserId },
  );

  if (!link || link.status !== "active") {
    await sendTelegramMessage({ chatId: platformChatId }, TELEGRAM_NOT_LINKED_TEXT);
    return;
  }

  const threads = await ctx.runQuery(
    internal.features.telegram.internalQueries.listThreadsByChat,
    { platformChatId },
  );

  if (threads.length === 0) {
    await sendTelegramMessage({ chatId: platformChatId }, TELEGRAM_NOT_LINKED_TEXT);
    return;
  }

  const names = await loadThreadNames(ctx, threads);
  await sendTelegramMessage(
    { chatId: platformChatId },
    [
      `You're connected to ${names.length} character${names.length === 1 ? "" : "s"}:`,
      ...names.map((name) => `- ${name}`),
      "",
      "Send a message to talk, /switch to change who replies, /help for commands.",
    ].join("\n"),
  );
}

/** /switch or /switch <n> in single-chat fallback mode. */
async function handleSwitch(
  ctx: ActionCtx,
  args: { args: string; platformChatId: string; topicId?: number },
): Promise<void> {
  const { platformChatId, topicId } = args;
  const threads = await ctx.runQuery(
    internal.features.telegram.internalQueries.listThreadsByChat,
    { platformChatId },
  );

  if (threads.length === 0) {
    await sendTelegramMessage({ chatId: platformChatId, topicId }, TELEGRAM_NOT_LINKED_TEXT);
    return;
  }

  const names = await loadThreadNames(ctx, threads);

  if (!args.args) {
    await sendTelegramMessage(
      { chatId: platformChatId, topicId },
      [
        "You're connected to:",
        ...names.map((name, index) => `${index + 1}. ${name}`),
        "",
        "Reply /switch <number> to choose who you're chatting with.",
      ].join("\n"),
    );
    return;
  }

  const index = Number.parseInt(args.args, 10);
  if (!Number.isFinite(index) || index < 1 || index > threads.length) {
    await sendTelegramMessage(
      { chatId: platformChatId, topicId },
      "That character number doesn't exist. Send /switch to see the list.",
    );
    return;
  }

  const target = threads[index - 1];
  await ctx.runMutation(internal.features.telegram.linking.setActiveThread, {
    platformChatId,
    aiProfileId: target.aiProfileId,
  });
  await sendTelegramMessage(
    { chatId: platformChatId, topicId },
    `Done — you're now chatting with ${names[index - 1]}.`,
  );
}

/** Plain text message: route to the AI chat pipeline. */
async function handleUserMessage(
  ctx: ActionCtx,
  args: {
    platformChatId: string;
    platformUserId: string;
    topicId?: number;
    text: string;
  },
): Promise<void> {
  const { platformChatId, platformUserId, topicId, text } = args;

  const link = await ctx.runQuery(
    internal.features.telegram.internalQueries.getLinkByPlatformUser,
    { platformUserId },
  );

  if (!link || link.status !== "active") {
    await sendTelegramMessage(
      { chatId: platformChatId, topicId },
      TELEGRAM_NOT_LINKED_TEXT,
    );
    return;
  }

  const threads: Array<Doc<"channelThreads">> = await ctx.runQuery(
    internal.features.telegram.internalQueries.listThreadsByChat,
    { platformChatId },
  );

  let thread: Doc<"channelThreads"> | undefined;
  if (topicId !== undefined) {
    thread = threads.find((row) => row.topicId === topicId);
  }
  if (!thread) {
    thread = threads.find((row) => row.isActive);
  }
  if (!thread && threads.length === 1) {
    thread = threads[0];
  }

  if (!thread) {
    if (threads.length > 1) {
      const names = await loadThreadNames(ctx, threads);
      await sendTelegramMessage(
        { chatId: platformChatId, topicId },
        [
          "Which character should get this message?",
          ...names.map((name, index) => `${index + 1}. ${name}`),
          "",
          "Reply /switch <number> and resend.",
        ].join("\n"),
      );
      return;
    }
    await sendTelegramMessage(
      { chatId: platformChatId, topicId },
      TELEGRAM_NOT_LINKED_TEXT,
    );
    return;
  }

  const allowance = await ctx.runMutation(
    internal.features.telegram.webhook.consumeTelegramMessageAllowance,
    { userId: link.userId },
  );
  if (!allowance.ok) {
    await sendTelegramMessage(
      { chatId: platformChatId, topicId },
      "You're sending messages a bit fast — give me a few seconds and try again.",
    );
    return;
  }

  let deliveryId: Id<"channelDeliveries"> | undefined;
  try {
    const sent: {
      messageId: string;
      channelDeliveryId?: Id<"channelDeliveries">;
    } = await ctx.runMutation(
      internal.features.ai.mutations.sendUserMessageInternal,
      {
        userId: link.userId,
        conversationId: thread.conversationId,
        content: text,
        platform: "telegram",
        channel: { platformChatId, topicId },
      },
    );
    deliveryId = sent.channelDeliveryId;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("Insufficient credits")) {
      const config = await ctx.runQuery(
        api.features.appConfig.queries.getPublicAppConfig,
        {},
      );
      await sendTelegramMessage(
        { chatId: platformChatId, topicId },
        buildTelegramCreditsText(undefined, config?.baseWebUrl),
      );
      return;
    }

    console.error("Telegram message pipeline failed:", message);
    await sendTelegramMessage(
      { chatId: platformChatId, topicId },
      TELEGRAM_GENERIC_ERROR_TEXT,
    );
    return;
  }

  if (deliveryId) {
    await ctx.scheduler.runAfter(
      0,
      internal.features.telegram.delivery.refreshTyping,
      { deliveryId, attempts: 0 },
    );
  }
}

async function loadThreadNames(
  ctx: ActionCtx,
  threads: Array<Doc<"channelThreads">>,
): Promise<string[]> {
  const names: string[] = [];
  for (const thread of threads) {
    const profile = await ctx.runQuery(
      internal.features.ai.internalQueries.getProfileInternal,
      { profileId: thread.aiProfileId },
    );
    names.push(profile?.name ?? "Unknown character");
  }
  return names;
}
