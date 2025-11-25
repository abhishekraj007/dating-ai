"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { createAIProfileAgent } from "./agent";

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
 * Generate a custom selfie using Replicate Qwen-Image.
 * TODO: Implement actual Replicate API integration.
 */
export const generateSelfie = internalAction({
  args: {
    requestId: v.id("selfieRequests"),
  },
  handler: async (ctx, { requestId }) => {
    // Update status to processing
    await ctx.runMutation(internal.features.ai.mutations.updateSelfieRequest, {
      requestId,
      status: "processing",
    });

    // Get request details
    const request = await ctx.runQuery(
      internal.features.ai.internalQueries.getSelfieRequestInternal,
      { requestId }
    );

    if (!request) {
      console.error("Selfie request not found:", requestId);
      return null;
    }

    // Get AI profile for reference image
    const profile = await ctx.runQuery(
      internal.features.ai.internalQueries.getProfileInternal,
      { profileId: request.aiProfileId }
    );

    if (!profile) {
      await ctx.runMutation(
        internal.features.ai.mutations.updateSelfieRequest,
        {
          requestId,
          status: "failed",
          errorMessage: "Profile not found",
        }
      );
      return null;
    }

    // TODO: Implement Replicate Qwen-Image-Edit API call
    // For now, we'll mark as failed with a placeholder message
    // This will be implemented in the image-gen todo

    await ctx.runMutation(internal.features.ai.mutations.updateSelfieRequest, {
      requestId,
      status: "failed",
      errorMessage: "Image generation not yet implemented",
    });

    return null;
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
