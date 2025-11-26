"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { createAIProfileAgent } from "./agent";
import { r2 } from "../../uploads";
import Replicate from "replicate";

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Generate AI response asynchronously with streaming.
 * Called after user sends a message.
 */
export const generateResponse = internalAction({
  args: {
    conversationId: v.id("aiConversations"),
    promptMessageId: v.string(),
  },
  handler: async (ctx, { conversationId, promptMessageId }) => {
    // Get conversation
    const conversation = await ctx.runQuery(
      internal.features.ai.internalQueries.getConversationInternal,
      { conversationId }
    );

    if (!conversation) {
      console.error("Conversation not found:", conversationId);
      return null;
    }

    // Get AI profile
    const profile = await ctx.runQuery(
      internal.features.ai.internalQueries.getProfileInternal,
      { profileId: conversation.aiProfileId }
    );

    if (!profile) {
      console.error("Profile not found:", conversation.aiProfileId);
      return null;
    }

    // Create dynamic agent for this profile
    const agent = createAIProfileAgent(profile);

    // Generate streaming response
    await agent.streamText(
      ctx,
      { threadId: conversation.threadId, userId: conversation.userId },
      { promptMessageId },
      { saveStreamDeltas: true }
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
  }
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
  avatarImageKey: string | undefined
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
 * Generate a custom chat image using Replicate's Flux model.
 * Uses the profile's avatar as input_images for reference-based generation
 * to maintain character consistency.
 */
export const generateChatImage = internalAction({
  args: {
    requestId: v.id("chatImages"),
  },
  handler: async (
    ctx,
    { requestId }
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
      }
    );

    // Get request details
    const request = await ctx.runQuery(
      internal.features.ai.internalQueries.getChatImageRequestInternal,
      { requestId }
    );

    if (!request) {
      console.error("Chat image request not found:", requestId);
      return null;
    }

    // Get AI profile for reference image and details
    const profile = await ctx.runQuery(
      internal.features.ai.internalQueries.getProfileInternal,
      { profileId: request.aiProfileId }
    );

    if (!profile) {
      await ctx.runMutation(
        internal.features.ai.mutations.updateChatImageRequest,
        {
          requestId,
          status: "failed",
          errorMessage: "Profile not found",
        }
      );
      return null;
    }

    try {
      // Build the prompt based on profile and requested style
      const prompt = buildImagePrompt(
        {
          name: profile.name,
          gender: profile.gender,
          age: profile.age,
        },
        request.styleOptions ?? {}
      );

      console.log("Generating image with prompt:", prompt);

      // Get the profile's avatar URL as reference image for consistency
      let referenceImageUrl: string | null = null;
      if (profile.avatarImageKey) {
        referenceImageUrl = await r2.getUrl(profile.avatarImageKey);
        console.log("Using reference image:", referenceImageUrl ? "yes" : "no");
      }

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
      // This uses Flux's image-to-image capability with the profile's avatar
      if (referenceImageUrl) {
        fluxInput.image = referenceImageUrl;
        fluxInput.prompt_strength = 0.75; // Balance between reference and prompt
      } else {
        fluxInput.prompt_strength = 0.8;
      }

      // Use Flux-dev for high-quality image generation
      const output = await replicate.run(
        "black-forest-labs/flux-dev" as `${string}/${string}`,
        { input: fluxInput }
      );

      console.log("Replicate output:", output);

      // Get the generated image URL
      const imageUrl = Array.isArray(output) ? output[0] : output;

      if (!imageUrl || typeof imageUrl !== "string") {
        throw new Error("No image URL returned from Replicate");
      }

      // Download the image and upload to R2
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(
          `Failed to fetch generated image: ${imageResponse.status}`
        );
      }

      const imageBlob = await imageResponse.blob();
      const imageBuffer = await imageBlob.arrayBuffer();

      // Generate a unique key for R2 storage
      const imageKey = `chatImages/${request.userId}/${request.aiProfileId}/${requestId}.webp`;

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
        }
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
        }
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
      { conversationId }
    );

    if (!conversation) {
      console.error("Conversation not found:", conversationId);
      return null;
    }

    // Get AI profile for voice ID
    const profile = await ctx.runQuery(
      internal.features.ai.internalQueries.getProfileInternal,
      { profileId: conversation.aiProfileId }
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
