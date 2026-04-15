"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal, components } from "../../_generated/api";
import { createAIProfileAgent } from "./agent";
import { r2 } from "../../uploads";
import { saveMessage } from "@convex-dev/agent";
import { generateImageWithFallback } from "./imageGeneration";

// Check if we're in development mode based on Convex deployment URL
// Dev deployments typically have animal-based names like "cheery-akita"
const isDev = process.env.CONVEX_CLOUD_URL?.includes("cheery-akita") ?? false;

type ChatErrorCode = "rate_limited" | "generation_failed";

function getChatErrorDetails(error: unknown): {
  code: ChatErrorCode;
  errorMessage: string;
} {
  const typedError = error as {
    message?: string;
    lastError?: {
      statusCode?: number;
      responseBody?: string;
      data?: {
        error?: {
          metadata?: {
            raw?: string;
          };
        };
      };
    };
  };

  const rawDetails = [
    typedError.lastError?.data?.error?.metadata?.raw,
    typedError.lastError?.responseBody,
    typedError.message,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" | ");

  const code =
    typedError.lastError?.statusCode === 429 ||
    /rate.limit|temporarily rate-limited|retry shortly|statusCode\":429/i.test(
      rawDetails,
    )
      ? "rate_limited"
      : "generation_failed";

  return {
    code,
    errorMessage:
      rawDetails ||
      (error instanceof Error ? error.message : "Unknown generation error"),
  };
}

function isPromptCancelled(
  conversation: {
    cancelledPromptMessageIds?: Array<string>;
  } | null,
  promptMessageId: string,
) {
  return (
    conversation?.cancelledPromptMessageIds?.includes(promptMessageId) ?? false
  );
}

async function failPendingAssistantMessages(
  ctx: {
    runQuery: (...args: Array<any>) => Promise<any>;
    runMutation: (...args: Array<any>) => Promise<any>;
  },
  threadId: string,
  errorMessage: string,
) {
  const pendingMessages = await ctx.runQuery(
    components.agent.messages.listMessagesByThreadId,
    {
      threadId,
      order: "desc",
      statuses: ["pending"],
      paginationOpts: { numItems: 10, cursor: null },
    },
  );

  await Promise.all(
    pendingMessages.page.map((message: { _id: string }) =>
      ctx.runMutation(components.agent.messages.updateMessage, {
        messageId: message._id,
        patch: {
          status: "failed",
          error: errorMessage,
          finishReason: "error",
        },
      }),
    ),
  );
}

async function saveRetryableChatErrorMessage(
  ctx: any,
  args: {
    threadId: string;
    userId: string;
    promptMessageId: string;
    agentName: string;
    code: ChatErrorCode;
  },
) {
  await saveMessage(ctx, components.agent, {
    threadId: args.threadId,
    userId: args.userId,
    promptMessageId: args.promptMessageId,
    message: {
      role: "assistant",
      content: JSON.stringify({
        type: "chat_error",
        code: args.code,
        promptMessageId: args.promptMessageId,
        retryable: true,
      }),
    },
    agentName: args.agentName,
  });
}

/**
 * Generate AI response asynchronously with streaming.
 * Called after user sends a message.
 * If the agent uses the generateImage tool, this will trigger actual image generation.
 */
export const generateResponse = internalAction({
  args: {
    conversationId: v.id("aiConversations"),
    promptMessageId: v.string(),
    // Pre-fetched data to avoid redundant queries (optional for backwards compat)
    threadId: v.optional(v.string()),
    userId: v.optional(v.string()),
    aiProfileId: v.optional(v.id("aiProfiles")),
  },
  returns: v.null(),
  handler: async (
    ctx,
    { conversationId, promptMessageId, threadId, userId, aiProfileId },
  ) => {
    const latestConversation = await ctx.runQuery(
      internal.features.ai.internalQueries.getConversationInternal,
      { conversationId },
    );

    if (!latestConversation) {
      console.error("Conversation not found:", conversationId);
      return null;
    }

    if (isPromptCancelled(latestConversation, promptMessageId)) {
      await ctx.runMutation(
        internal.features.ai.mutations.finalizePendingPromptState,
        { conversationId, promptMessageId },
      );
      return null;
    }

    // Use pre-fetched data if available, otherwise fetch (backwards compatibility)
    let convThreadId = threadId;
    let convUserId = userId;
    let profileId = aiProfileId;

    if (!convThreadId || !convUserId || !profileId) {
      const conversation = latestConversation;

      if (!conversation) {
        console.error("Conversation not found:", conversationId);
        return null;
      }
      convThreadId = conversation.threadId;
      convUserId = conversation.userId;
      profileId = conversation.aiProfileId;
    }

    // Get AI profile (still needed for building agent prompt)
    const profile = await ctx.runQuery(
      internal.features.ai.internalQueries.getProfileInternal,
      { profileId: profileId! },
    );

    if (!profile) {
      console.error("Profile not found:", profileId);
      return null;
    }

    // Create dynamic agent for this profile
    const agent = createAIProfileAgent(profile);

    let result;

    try {
      // Generate streaming response
      result = await agent.streamText(
        ctx,
        { threadId: convThreadId!, userId: convUserId! },
        { promptMessageId },
        { saveStreamDeltas: true },
      );
    } catch (error) {
      const currentConversation = await ctx.runQuery(
        internal.features.ai.internalQueries.getConversationInternal,
        { conversationId },
      );

      if (isPromptCancelled(currentConversation, promptMessageId)) {
        await ctx.runMutation(
          internal.features.ai.mutations.finalizePendingPromptState,
          { conversationId, promptMessageId },
        );
        return null;
      }

      const { code, errorMessage } = getChatErrorDetails(error);

      console.error("Failed to generate AI response:", error);

      await failPendingAssistantMessages(ctx, convThreadId!, errorMessage);

      try {
        await saveRetryableChatErrorMessage(ctx, {
          threadId: convThreadId!,
          userId: convUserId!,
          promptMessageId,
          agentName: profile.name,
          code,
        });
      } catch (messageError) {
        console.error(
          "Failed to save retryable chat error message:",
          messageError,
        );
      }

      await ctx.runMutation(
        internal.features.ai.mutations.finalizePendingPromptState,
        { conversationId, promptMessageId },
      );

      return null;
    }

    const currentConversation = await ctx.runQuery(
      internal.features.ai.internalQueries.getConversationInternal,
      { conversationId },
    );

    if (isPromptCancelled(currentConversation, promptMessageId)) {
      await ctx.runMutation(
        internal.features.ai.mutations.finalizePendingPromptState,
        { conversationId, promptMessageId },
      );
      return null;
    }

    // Alternative approach: Query the thread messages directly to find tool calls
    // The tool calls are stored in the message parts with type "tool-generateImage"
    const messagesResult = await ctx.runQuery(
      components.agent.messages.listMessagesByThreadId,
      {
        threadId: convThreadId!,
        order: "desc",
        paginationOpts: { numItems: 5, cursor: null },
      },
    );

    console.log("Thread messages count:", messagesResult.page.length);

    // Get the order of the current response to only process new tool calls
    const currentOrder = result.order;
    console.log("Current response order:", currentOrder);

    for (const message of messagesResult.page) {
      // Only process messages from the current response (same order)
      // This prevents re-processing tool calls from previous messages
      if (message.order !== currentOrder) {
        continue;
      }

      // Check if this message has tool calls in its content
      const content = message.message?.content;
      if (Array.isArray(content)) {
        for (const contentPart of content) {
          if (typeof contentPart !== "object" || contentPart === null) {
            continue;
          }

          if (
            contentPart.type === "tool-call" &&
            "toolName" in contentPart &&
            contentPart.toolName === "generateImage"
          ) {
            console.log("Found generateImage tool call:", contentPart);

            const args = ("args" in contentPart ? contentPart.args : {}) as {
              description?: string;
              hairstyle?: string;
              clothing?: string;
              scene?: string;
            };

            // Create the image request via mutation
            try {
              await ctx.runMutation(
                internal.features.ai.mutations.createChatImageRequestInternal,
                {
                  conversationId,
                  userId: convUserId!,
                  aiProfileId: profileId!,
                  prompt: args.description || "A selfie",
                  styleOptions: {
                    hairstyle: args.hairstyle,
                    clothing: args.clothing,
                    scene: args.scene,
                    description: args.description,
                  },
                },
              );
              console.log("Image request created successfully");
              // Only create one image request per response
              await ctx.runMutation(
                internal.features.ai.mutations.finalizePendingPromptState,
                { conversationId, promptMessageId },
              );
              return null;
            } catch (error) {
              console.error(
                "Failed to create image request from agent:",
                error,
              );
            }
          }
        }
      }
    }

    await ctx.runMutation(
      internal.features.ai.mutations.finalizePendingPromptState,
      { conversationId, promptMessageId },
    );

    return null;
  },
});

/**
 * Build a prompt for image generation based on the AI profile and style options.
 */
function buildImagePrompt(
  profile: { name: string; gender?: string; ethnicity?: string; age?: number },
  styleOptions: {
    hairstyle?: string;
    clothing?: string;
    scene?: string;
    description?: string;
  },
): string {
  const baseDescription = [
    `A photorealistic selfie of a ${profile.age ?? 25}-year-old`,
    profile.gender ?? "woman",
    profile.ethnicity ? `of ${profile.ethnicity} ethnicity` : "",
    `named ${profile.name}`,
  ]
    .filter(Boolean)
    .join(" ");

  const styleDescription = [
    styleOptions.hairstyle && `with ${styleOptions.hairstyle.toLowerCase()}`,
    styleOptions.clothing && `wearing ${styleOptions.clothing.toLowerCase()}`,
    styleOptions.scene && `in a ${styleOptions.scene.toLowerCase()} setting`,
  ]
    .filter(Boolean)
    .join(", ");

  const additionalContext = styleOptions.description
    ? `. ${styleOptions.description}`
    : "";

  const qualityTags =
    "preserve the same identity and facial features as the reference image, high quality, natural lighting, iPhone selfie style, casual pose, authentic, candid";

  return `${baseDescription}${styleDescription ? `, ${styleDescription}` : ""}${additionalContext}. ${qualityTags}`;
}

/**
 * Get a signed URL for the profile's avatar image.
 * Used as reference image for consistent character generation.
 */
async function getProfileAvatarUrl(
  avatarImageKey: string | undefined,
): Promise<string | null> {
  if (!avatarImageKey || avatarImageKey === "default-avatar") {
    return null;
  }

  // Get signed URL from R2
  try {
    const url = await r2.getUrl(avatarImageKey);
    return url;
  } catch (error) {
    console.error("Failed to get avatar URL:", error);
    return null;
  }
}

/**
 * Generate a custom chat image.
 * Uses Nekos API in development (fast, free) and Replicate Flux in production.
 * In production, uses the profile's avatar as reference for character consistency.
 */
export const generateChatImage = internalAction({
  args: {
    requestId: v.id("chatImages"),
  },
  handler: async (
    ctx,
    { requestId },
  ): Promise<
    | { success: true; imageKey: string }
    | { success: false; error: string }
    | null
  > => {
    // Update status to processing
    await ctx.runMutation(
      internal.features.ai.mutations.updateChatImageRequest,
      {
        requestId,
        status: "processing",
      },
    );

    // Get request details
    const request = await ctx.runQuery(
      internal.features.ai.internalQueries.getChatImageRequestInternal,
      { requestId },
    );

    if (!request) {
      console.error("Chat image request not found:", requestId);
      return null;
    }

    // Get AI profile for reference image and details
    const profile = await ctx.runQuery(
      internal.features.ai.internalQueries.getProfileInternal,
      { profileId: request.aiProfileId },
    );

    if (!profile) {
      await ctx.runMutation(
        internal.features.ai.mutations.updateChatImageRequest,
        {
          requestId,
          status: "failed",
          errorMessage: "Profile not found",
        },
      );
      return null;
    }

    try {
      console.log("Generating image, isDev:", isDev);

      const prompt = buildImagePrompt(
        {
          name: profile.name,
          gender: profile.gender,
          age: profile.age,
        },
        request.styleOptions ?? {},
      );

      console.log("Generating image with prompt:", prompt);

      const referenceImageUrl = await getProfileAvatarUrl(
        profile.avatarImageKey,
      );

      console.log("Using reference image:", referenceImageUrl ? "yes" : "no");

      const imageResult = await generateImageWithFallback({
        prompt,
        aspectRatio: "9:16",
        referenceImageUrls: referenceImageUrl ? [referenceImageUrl] : [],
        isDev,
        devWidth: 512,
        devHeight: 768,
      });

      if (!imageResult.success) {
        throw new Error(imageResult.error);
      }

      const imageUrl = imageResult.imageUrl;
      console.log("Image generated with model:", imageResult.model);
      console.log("Image URL:", imageUrl);

      // Download the image and upload to R2
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(
          `Failed to fetch generated image: ${imageResponse.status}`,
        );
      }

      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();

      // Determine file extension based on content type
      const contentType =
        imageResponse.headers.get("content-type") || "image/webp";
      const ext = contentType.includes("png")
        ? "png"
        : contentType.includes("jpeg") || contentType.includes("jpg")
          ? "jpg"
          : "webp";

      // Generate a unique key for R2 storage
      const imageKey = `chatImages/${request.userId}/${request.aiProfileId}/${requestId}.${ext}`;

      // Upload to R2 directly from the action
      const imageUint8Array = new Uint8Array(imageBuffer);
      await r2.store(ctx, imageUint8Array, imageKey);

      // Update request status to completed
      await ctx.runMutation(
        internal.features.ai.mutations.updateChatImageRequest,
        {
          requestId,
          status: "completed",
          imageKey,
        },
      );

      console.log("Image generated and saved successfully:", imageKey);

      return { success: true, imageKey };
    } catch (error) {
      console.error("Image generation failed:", error);

      await ctx.runMutation(
        internal.features.ai.mutations.updateChatImageRequest,
        {
          requestId,
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
      );

      return { success: false, error: String(error) };
    }
  },
});

/**
 * Generate voice message using ElevenLabs TTS.
 * TODO: Implement actual ElevenLabs API integration.
 */
export const generateVoiceMessage = internalAction({
  args: {
    conversationId: v.id("aiConversations"),
    text: v.string(),
  },
  handler: async (ctx, { conversationId, text }) => {
    // Get conversation
    const conversation = await ctx.runQuery(
      internal.features.ai.internalQueries.getConversationInternal,
      { conversationId },
    );

    if (!conversation) {
      console.error("Conversation not found:", conversationId);
      return null;
    }

    // Get AI profile for voice ID
    const profile = await ctx.runQuery(
      internal.features.ai.internalQueries.getProfileInternal,
      { profileId: conversation.aiProfileId },
    );

    if (!profile) {
      console.error("Profile not found:", conversation.aiProfileId);
      return null;
    }

    // TODO: Implement ElevenLabs TTS API call
    // This will be implemented in the voice-gen todo

    console.log("Voice generation not yet implemented for:", text);

    return null;
  },
});
