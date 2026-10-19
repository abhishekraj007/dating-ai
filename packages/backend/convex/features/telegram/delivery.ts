import { v } from "convex/values";
import { internalAction, internalMutation } from "../../_generated/server";
import type { ActionCtx, MutationCtx } from "../../_generated/server";
import { api, components, internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import { r2 } from "../../uploads";
import {
  sendTelegramChatAction,
  sendTelegramMessage,
  sendTelegramPhoto,
  sendTelegramVideo,
  splitTelegramText,
} from "./client";
import { splitReplyIntoBubbles } from "../ai/replyBubbles";
import {
  buildTelegramCreditsText,
  collectResponseMessages,
  extractDeliverableContent,
  TELEGRAM_GENERIC_ERROR_TEXT,
  TELEGRAM_MEDIA_FAILED_TEXT,
  TELEGRAM_RETRYABLE_ERROR_TEXT,
  type DeliverableContent,
  type DeliverableMessage,
} from "./helpers";

/** Telegram allows ~1 message/second per chat; stagger consecutive bubbles. */
const TEXT_BUBBLE_INTERVAL_MS = 1200;
const TYPING_REFRESH_INTERVAL_MS = 4500;
const MAX_TYPING_REFRESHES = 20;
const MAX_DELIVERY_BUBBLES = 6;
const MAX_THREAD_MESSAGES_SCANNED = 16;

function telegramTargetOf(delivery: Doc<"channelDeliveries">) {
  return {
    chatId: delivery.platformChatId,
    topicId: delivery.topicId ?? undefined,
  };
}

function errorMessageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** True while a delivery still expects at least one media message. */
async function hasUndeliveredMedia(
  ctx: MutationCtx,
  deliveryId: Id<"channelDeliveries">,
): Promise<boolean> {
  const images = await ctx.db
    .query("chatImages")
    .withIndex("by_channel_delivery", (q) =>
      q.eq("channelDeliveryId", deliveryId),
    )
    .take(10);
  if (images.some((image) => image.channelDeliveredAt === undefined)) {
    return true;
  }

  const videos = await ctx.db
    .query("chatVideos")
    .withIndex("by_channel_delivery", (q) =>
      q.eq("channelDeliveryId", deliveryId),
    )
    .take(10);
  return videos.some((video) => video.channelDeliveredAt === undefined);
}

/** Creates the pending delivery row for a user prompt. */
export const createChatDelivery = internalMutation({
  args: {
    platformChatId: v.string(),
    topicId: v.optional(v.number()),
    userId: v.string(),
    aiProfileId: v.id("aiProfiles"),
    conversationId: v.id("aiConversations"),
    promptMessageId: v.string(),
  },
  returns: v.id("channelDeliveries"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("channelDeliveries", {
      platform: "telegram",
      platformChatId: args.platformChatId,
      topicId: args.topicId,
      userId: args.userId,
      aiProfileId: args.aiProfileId,
      conversationId: args.conversationId,
      kind: "chat",
      promptMessageId: args.promptMessageId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Creates an "opening" delivery and kicks off opening-message generation so
 * the newly linked character introduces itself on Telegram.
 */
export const queueOpeningDelivery = internalMutation({
  args: {
    platformChatId: v.string(),
    topicId: v.optional(v.number()),
    userId: v.string(),
    aiProfileId: v.id("aiProfiles"),
    conversationId: v.id("aiConversations"),
  },
  returns: v.id("channelDeliveries"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const deliveryId = await ctx.db.insert("channelDeliveries", {
      platform: "telegram",
      platformChatId: args.platformChatId,
      topicId: args.topicId,
      userId: args.userId,
      aiProfileId: args.aiProfileId,
      conversationId: args.conversationId,
      kind: "opening",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.features.ai.actions.generateOpeningMessage,
      { conversationId: args.conversationId, channelDeliveryId: deliveryId },
    );

    return deliveryId;
  },
});

/** Records the saved opening message so delivery can send its text. */
export const attachOpeningResponseMessage = internalMutation({
  args: { deliveryId: v.id("channelDeliveries"), messageId: v.string() },
  returns: v.null(),
  handler: async (ctx, { deliveryId, messageId }) => {
    const delivery = await ctx.db.get(deliveryId);
    if (!delivery) {
      return null;
    }
    await ctx.db.patch(deliveryId, {
      responseMessageId: messageId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Atomically claims a pending delivery for text sending. */
export const beginTextDelivery = internalMutation({
  args: { deliveryId: v.id("channelDeliveries") },
  returns: v.boolean(),
  handler: async (ctx, { deliveryId }) => {
    const delivery = await ctx.db.get(deliveryId);
    if (!delivery || delivery.status !== "pending") {
      return false;
    }
    await ctx.db.patch(deliveryId, {
      status: "text_sending",
      updatedAt: Date.now(),
    });
    return true;
  },
});

/** Last text bubble sent; complete unless media is still on the way. */
export const completeTextBubbles = internalMutation({
  args: { deliveryId: v.id("channelDeliveries") },
  returns: v.null(),
  handler: async (ctx, { deliveryId }) => {
    const delivery = await ctx.db.get(deliveryId);
    if (!delivery || delivery.status !== "text_sending") {
      return null;
    }

    const pendingMedia = await hasUndeliveredMedia(ctx, deliveryId);
    await ctx.db.patch(deliveryId, {
      status: pendingMedia ? "text_sent" : "completed",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Completes a delivery once text and all media went out. */
export const maybeCompleteDelivery = internalMutation({
  args: { deliveryId: v.id("channelDeliveries") },
  returns: v.null(),
  handler: async (ctx, { deliveryId }) => {
    const delivery = await ctx.db.get(deliveryId);
    if (
      !delivery ||
      delivery.status === "failed" ||
      delivery.status === "completed" ||
      delivery.status === "pending" ||
      delivery.status === "text_sending"
    ) {
      return null;
    }

    const pendingMedia = await hasUndeliveredMedia(ctx, deliveryId);
    if (!pendingMedia) {
      await ctx.db.patch(deliveryId, {
        status: "completed",
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

export const failDelivery = internalMutation({
  args: { deliveryId: v.id("channelDeliveries"), errorMessage: v.string() },
  returns: v.null(),
  handler: async (ctx, { deliveryId, errorMessage }) => {
    const delivery = await ctx.db.get(deliveryId);
    if (!delivery || delivery.status === "failed") {
      return null;
    }
    await ctx.db.patch(deliveryId, {
      status: "failed",
      errorMessage: errorMessage.slice(0, 500),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const markMediaDelivered = internalMutation({
  args: {
    deliveryId: v.id("channelDeliveries"),
    imageRequestId: v.optional(v.id("chatImages")),
    videoRequestId: v.optional(v.id("chatVideos")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.imageRequestId) {
      await ctx.db.patch(args.imageRequestId, { channelDeliveredAt: now });
    }
    if (args.videoRequestId) {
      await ctx.db.patch(args.videoRequestId, { channelDeliveredAt: now });
    }
    return null;
  },
});

/**
 * Collects the deliverable content for a delivery: the opening message text
 * or every successful assistant message sharing the prompt's `order`.
 */
async function collectDeliveryContents(
  ctx: ActionCtx,
  delivery: Doc<"channelDeliveries">,
): Promise<DeliverableContent[]> {
  const toContents = (docs: DeliverableMessage[]) =>
    docs
      .map(extractDeliverableContent)
      .filter((content): content is DeliverableContent => content !== null);

  if (delivery.kind === "opening") {
    if (!delivery.responseMessageId) {
      return [];
    }
    const docs: DeliverableMessage[] = (
      await ctx.runQuery(components.agent.messages.getMessagesByIds, {
        messageIds: [delivery.responseMessageId],
      })
    ).filter((doc) => doc !== null);
    return toContents(docs);
  }

  if (!delivery.promptMessageId) {
    return [];
  }

  const promptDocs: DeliverableMessage[] = (
    await ctx.runQuery(components.agent.messages.getMessagesByIds, {
      messageIds: [delivery.promptMessageId],
    })
  ).filter((doc) => doc !== null);
  const prompt = promptDocs[0];
  if (!prompt) {
    return [];
  }

  const conversation = await ctx.runQuery(
    internal.features.ai.internalQueries.getConversationInternal,
    { conversationId: delivery.conversationId },
  );
  if (!conversation) {
    return [];
  }

  const result = await ctx.runQuery(
    components.agent.messages.listMessagesByThreadId,
    {
      threadId: conversation.threadId,
      order: "desc",
      statuses: ["success"],
      paginationOpts: {
        numItems: MAX_THREAD_MESSAGES_SCANNED,
        cursor: null,
      },
    },
  );

  const responseMessages = collectResponseMessages<DeliverableMessage>(
    result.page,
    prompt.order,
  );
  return toContents(responseMessages);
}

/**
 * Delivers an assistant reply to Telegram: sends the first bubble inline and
 * schedules the remaining bubbles slightly apart to respect rate limits.
 */
export const deliverReply = internalAction({
  args: { deliveryId: v.id("channelDeliveries") },
  returns: v.null(),
  handler: async (ctx, { deliveryId }) => {
    const delivery = await ctx.runQuery(
      internal.features.telegram.internalQueries.getDeliveryInternal,
      { deliveryId },
    );
    if (!delivery || delivery.status !== "pending") {
      return null;
    }

    const began: boolean = await ctx.runMutation(
      internal.features.telegram.delivery.beginTextDelivery,
      { deliveryId },
    );
    if (!began) {
      return null;
    }

    try {
      const contents = await collectDeliveryContents(ctx, delivery);

      let requiredCredits: number | undefined;
      let sawCreditsRequired = false;
      let sawRetryableError = false;
      const bubbles: string[] = [];

      for (const content of contents) {
        if (content.kind === "text") {
          for (const bubble of splitReplyIntoBubbles(content.text)) {
            bubbles.push(...splitTelegramText(bubble));
          }
        } else if (content.kind === "credits_required") {
          sawCreditsRequired = true;
          requiredCredits = content.requiredCredits;
        } else if (content.kind === "retryable_error") {
          sawRetryableError = true;
        }
      }

      if (bubbles.length === 0) {
        bubbles.push(
          sawRetryableError
            ? TELEGRAM_RETRYABLE_ERROR_TEXT
            : TELEGRAM_GENERIC_ERROR_TEXT,
        );
      }

      if (sawCreditsRequired) {
        const config = await ctx.runQuery(
          api.features.appConfig.queries.getPublicAppConfig,
          {},
        );
        bubbles.push(
          buildTelegramCreditsText(requiredCredits, config?.baseWebUrl),
        );
      }

      if (bubbles.length > MAX_DELIVERY_BUBBLES) {
        const head = bubbles.slice(0, MAX_DELIVERY_BUBBLES - 1);
        const tail = bubbles.slice(MAX_DELIVERY_BUBBLES - 1).join("\n\n");
        bubbles.length = 0;
        bubbles.push(...head, ...splitTelegramText(tail));
      }

      const target = telegramTargetOf(delivery);
      const [firstBubble, ...scheduledBubbles] = bubbles;

      try {
        await sendTelegramMessage(target, firstBubble);
      } catch (error) {
        console.warn(
          "Telegram reply delivery failed:",
          errorMessageOf(error),
        );
        await ctx.runMutation(
          internal.features.telegram.delivery.failDelivery,
          { deliveryId, errorMessage: errorMessageOf(error) },
        );
        return null;
      }

      for (let index = 0; index < scheduledBubbles.length; index++) {
        await ctx.scheduler.runAfter(
          (index + 1) * TEXT_BUBBLE_INTERVAL_MS,
          internal.features.telegram.delivery.sendBubble,
          {
            deliveryId,
            text: scheduledBubbles[index],
            isLast: index === scheduledBubbles.length - 1,
          },
        );
      }

      if (scheduledBubbles.length === 0) {
        await ctx.runMutation(
          internal.features.telegram.delivery.completeTextBubbles,
          { deliveryId },
        );
      }
    } catch (error) {
      await ctx.runMutation(
        internal.features.telegram.delivery.failDelivery,
        { deliveryId, errorMessage: errorMessageOf(error) },
      );
    }

    return null;
  },
});

/** Sends a delayed follow-up bubble, completing the delivery on the last one. */
export const sendBubble = internalAction({
  args: {
    deliveryId: v.id("channelDeliveries"),
    text: v.string(),
    isLast: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { deliveryId, text, isLast }) => {
    const delivery = await ctx.runQuery(
      internal.features.telegram.internalQueries.getDeliveryInternal,
      { deliveryId },
    );
    if (!delivery || delivery.status !== "text_sending") {
      return null;
    }

    try {
      await sendTelegramMessage(telegramTargetOf(delivery), text);
    } catch (error) {
      console.warn("Telegram bubble delivery failed:", errorMessageOf(error));
      await ctx.runMutation(
        internal.features.telegram.delivery.failDelivery,
        { deliveryId, errorMessage: errorMessageOf(error) },
      );
      return null;
    }

    if (isLast) {
      await ctx.runMutation(
        internal.features.telegram.delivery.completeTextBubbles,
        { deliveryId },
      );
    }
    return null;
  },
});

async function sendMediaFallbackText(
  target: { chatId: string; topicId?: number },
): Promise<void> {
  try {
    await sendTelegramMessage(target, TELEGRAM_MEDIA_FAILED_TEXT);
  } catch (error) {
    console.warn(
      "Telegram media fallback message failed:",
      errorMessageOf(error),
    );
  }
}

/**
 * Delivers a finished (or failed) image/video to the linked chat.
 * Idempotent: each media row is delivered at most once.
 */
export const deliverMedia = internalAction({
  args: {
    deliveryId: v.id("channelDeliveries"),
    imageRequestId: v.optional(v.id("chatImages")),
    videoRequestId: v.optional(v.id("chatVideos")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const delivery = await ctx.runQuery(
      internal.features.telegram.internalQueries.getDeliveryInternal,
      { deliveryId: args.deliveryId },
    );
    if (
      !delivery ||
      delivery.status === "failed" ||
      delivery.status === "completed"
    ) {
      return null;
    }

    const target = telegramTargetOf(delivery);

    if (args.imageRequestId) {
      const request = await ctx.runQuery(
        internal.features.ai.internalQueries.getChatImageRequestInternal,
        { requestId: args.imageRequestId },
      );

      if (request && request.channelDeliveredAt === undefined) {
        if (request.status === "completed" && request.imageKey) {
          let sent = false;
          const url = await r2.getUrl(request.imageKey);
          if (url) {
            try {
              await sendTelegramPhoto(target, url);
              sent = true;
            } catch (error) {
              console.warn(
                "Telegram photo delivery failed:",
                errorMessageOf(error),
              );
            }
          }
          if (!sent) {
            await sendMediaFallbackText(target);
          }
          await ctx.runMutation(
            internal.features.telegram.delivery.markMediaDelivered,
            { deliveryId: args.deliveryId, imageRequestId: args.imageRequestId },
          );
        } else if (request.status === "failed") {
          await sendMediaFallbackText(target);
          await ctx.runMutation(
            internal.features.telegram.delivery.markMediaDelivered,
            { deliveryId: args.deliveryId, imageRequestId: args.imageRequestId },
          );
        }
      }
    }

    if (args.videoRequestId) {
      const request = await ctx.runQuery(
        internal.features.ai.internalQueries.getChatVideoRequestInternal,
        { requestId: args.videoRequestId },
      );

      if (request && request.channelDeliveredAt === undefined) {
        if (request.status === "completed" && request.videoKey) {
          let sent = false;
          const url = await r2.getUrl(request.videoKey);
          if (url) {
            try {
              await sendTelegramVideo(target, url);
              sent = true;
            } catch (error) {
              console.warn(
                "Telegram video delivery failed:",
                errorMessageOf(error),
              );
            }
          }
          if (!sent) {
            await sendMediaFallbackText(target);
          }
          await ctx.runMutation(
            internal.features.telegram.delivery.markMediaDelivered,
            { deliveryId: args.deliveryId, videoRequestId: args.videoRequestId },
          );
        } else if (request.status === "failed") {
          await sendMediaFallbackText(target);
          await ctx.runMutation(
            internal.features.telegram.delivery.markMediaDelivered,
            { deliveryId: args.deliveryId, videoRequestId: args.videoRequestId },
          );
        }
      }
    }

    await ctx.runMutation(
      internal.features.telegram.delivery.maybeCompleteDelivery,
      { deliveryId: args.deliveryId },
    );
    return null;
  },
});

/**
 * Keeps the "typing" indicator alive while a response is generating.
 * Self-limits to ~90 seconds.
 */
export const refreshTyping = internalAction({
  args: { deliveryId: v.id("channelDeliveries"), attempts: v.number() },
  returns: v.null(),
  handler: async (ctx, { deliveryId, attempts }) => {
    const delivery = await ctx.runQuery(
      internal.features.telegram.internalQueries.getDeliveryInternal,
      { deliveryId },
    );
    if (
      !delivery ||
      (delivery.status !== "pending" && delivery.status !== "text_sending")
    ) {
      return null;
    }

    try {
      await sendTelegramChatAction(telegramTargetOf(delivery));
    } catch {
      // Typing indicators are best effort.
    }

    if (attempts < MAX_TYPING_REFRESHES) {
      await ctx.scheduler.runAfter(
        TYPING_REFRESH_INTERVAL_MS,
        internal.features.telegram.delivery.refreshTyping,
        { deliveryId, attempts: attempts + 1 },
      );
    }
    return null;
  },
});
