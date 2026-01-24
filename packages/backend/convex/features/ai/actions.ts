"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal, components } from "../../_generated/api";
import { createAIProfileAgent } from "./agent";
import { r2 } from "../../uploads";
import Replicate from "replicate";

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Check if we're in development mode based on Convex deployment URL
// Dev deployments typically have animal-based names like "cheery-akita"
const isDev = process.env.CONVEX_CLOUD_URL?.includes("cheery-akita") ?? false;

/**
 * Image generation result type
 */
type ImageGenerationResult =
  | {
      success: true;
      imageUrl: string;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Generate image using placeholder service (for development).
 * Returns a random image - fast and free for testing.
 */
async function generateImageDev(): Promise<ImageGenerationResult> {
  try {
    // Use picsum.photos - reliable placeholder image service
    // Generate a random ID to get different images each time
    const randomId = Math.floor(Math.random() * 1000);
    const width = 512;
    const height = 768; // Portrait aspect ratio

    // Get image info first to get the actual download URL
    const infoResponse = await fetch(
      `https://picsum.photos/id/${randomId}/info`,
    );

    if (!infoResponse.ok) {
      // If specific ID fails, use random endpoint
      const imageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
      console.log("[Dev] Generated image URL (random):", imageUrl);
      return { success: true, imageUrl };
    }

    const info = await infoResponse.json();
    const imageUrl = `https://picsum.photos/id/${info.id}/${width}/${height}`;
    console.log("[Dev] Generated image URL:", imageUrl);

    return { success: true, imageUrl };
  } catch (error) {
    console.error("[Dev] Image generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate image using Replicate's Flux model (for production).
 * Uses the profile's avatar as reference for character consistency.
 */
async function generateImageProd(
  prompt: string,
  referenceImageUrl: string | null,
): Promise<ImageGenerationResult> {
  try {
    // Build input parameters for Flux
    const fluxInput: Record<string, unknown> = {
      prompt,
      go_fast: true,
      guidance: 3.5,
      num_outputs: 1,
      aspect_ratio: "9:16", // Portrait aspect ratio for selfies
      output_format: "webp",
      output_quality: 90,
      num_inference_steps: 28,
    };

    // Add reference image if available for character consistency
    if (referenceImageUrl) {
      fluxInput.image = referenceImageUrl;
      fluxInput.prompt_strength = 0.75;
    } else {
      fluxInput.prompt_strength = 0.8;
    }

    console.log("[Prod] Generating image with Replicate Flux");

    const output = await replicate.run("black-forest-labs/flux-dev", {
      input: fluxInput,
    });

    console.log(
      "[Prod] Replicate output type:",
      typeof output,
      Array.isArray(output) ? "array" : "not array",
    );

    // Extract URL from FileOutput object
    const fileOutput = Array.isArray(output) ? output[0] : output;

    let imageUrl: string;
    if (
      fileOutput &&
      typeof fileOutput === "object" &&
      "url" in fileOutput &&
      typeof fileOutput.url === "function"
    ) {
      const urlResult = fileOutput.url();
      imageUrl = urlResult.toString();
    } else if (typeof fileOutput === "string") {
      imageUrl = fileOutput;
    } else {
      throw new Error(`Unexpected output format: ${typeof fileOutput}`);
    }

    if (!imageUrl) {
      throw new Error("No image URL returned from Replicate");
    }

    console.log("[Prod] Generated image URL:", imageUrl);
    return { success: true, imageUrl };
  } catch (error) {
    console.error("[Prod] Image generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
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
  handler: async (
    ctx,
    { conversationId, promptMessageId, threadId, userId, aiProfileId },
  ) => {
    // Use pre-fetched data if available, otherwise fetch (backwards compatibility)
    let convThreadId = threadId;
    let convUserId = userId;
    let profileId = aiProfileId;

    if (!convThreadId || !convUserId || !profileId) {
      const conversation = await ctx.runQuery(
        internal.features.ai.internalQueries.getConversationInternal,
        { conversationId },
      );

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

    // Generate streaming response
    const result = await agent.streamText(
      ctx,
      { threadId: convThreadId!, userId: convUserId! },
      { promptMessageId },
      { saveStreamDeltas: true },
    );

    // Wait for the stream to complete by awaiting the text
    const fullText = await result.text;
    console.log("Stream completed, response text length:", fullText.length);

    // Get the saved messages to check for tool calls
    // When using saveStreamDeltas, tool calls are saved directly to the message in the database
    const savedMessages = result.savedMessages;
    console.log("Saved messages count:", savedMessages?.length ?? 0);

    if (savedMessages && savedMessages.length > 0) {
      // Log the saved messages structure
      console.log("Saved messages:", JSON.stringify(savedMessages, null, 2));

      for (const msgId of savedMessages) {
        console.log("Checking message ID:", msgId);
      }
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
      if (message.message?.content && Array.isArray(message.message.content)) {
        for (const contentPart of message.message.content) {
          if (
            contentPart.type === "tool-call" &&
            contentPart.toolName === "generateImage"
          ) {
            console.log("Found generateImage tool call:", contentPart);

            const args = contentPart.args as {
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
    "high quality, natural lighting, iPhone selfie style, casual pose, authentic, candid";

  return `${baseDescription}${styleDescription ? `, ${styleDescription}` : ""}${additionalContext}. ${qualityTags}`;
}

/**
 * Get a signed URL for the profile's avatar image.
 * Used as reference image for consistent character generation.
 */
async function getProfileAvatarUrl(
  ctx: {
    runQuery: typeof internal.features.ai.internalQueries.getProfileInternal extends (
      ...args: infer A
    ) => infer R
      ? (...args: A) => R
      : never;
  },
  avatarImageKey: string | undefined,
): Promise<string | null> {
  if (!avatarImageKey) {
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

      let imageResult: ImageGenerationResult;

      if (isDev) {
        // Use Nekos API for development (fast and free)
        imageResult = await generateImageDev();
      } else {
        // Use Replicate Flux for production
        const prompt = buildImagePrompt(
          {
            name: profile.name,
            gender: profile.gender,
            age: profile.age,
          },
          request.styleOptions ?? {},
        );

        console.log("Generating image with prompt:", prompt);

        // Get the profile's avatar URL as reference image for consistency
        let referenceImageUrl: string | null = null;
        if (profile.avatarImageKey) {
          referenceImageUrl = await r2.getUrl(profile.avatarImageKey);
          console.log(
            "Using reference image:",
            referenceImageUrl ? "yes" : "no",
          );
        }

        imageResult = await generateImageProd(prompt, referenceImageUrl);
      }

      if (!imageResult.success) {
        throw new Error(imageResult.error);
      }

      const imageUrl = imageResult.imageUrl;
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
