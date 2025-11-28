import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { createThread, saveMessage } from "@convex-dev/agent";
import { components } from "../../_generated/api";
import { authComponent } from "../../lib/betterAuth";
import {
  calculateRelationshipLevel,
  calculateCompatibilityScore,
  createAIProfileAgent,
} from "./agent";
import { r2 } from "../../uploads";

/**
 * Start a new conversation with an AI profile.
 * Creates an Agent thread and links it to the conversation.
 */
export const startConversation = mutation({
  args: {
    aiProfileId: v.id("aiProfiles"),
  },
  handler: async (ctx, { aiProfileId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if profile exists and is active
    const profile = await ctx.db.get(aiProfileId);
    if (!profile || profile.status !== "active") {
      throw new Error("Profile not found");
    }

    // Check if conversation already exists
    const existingConversation = await ctx.db
      .query("aiConversations")
      .withIndex("by_user_and_profile", (q) =>
        q.eq("userId", user._id).eq("aiProfileId", aiProfileId)
      )
      .first();

    if (existingConversation) {
      return existingConversation._id;
    }

    // Create Agent thread
    const threadId = await createThread(ctx, components.agent, {
      userId: user._id,
      title: `Chat with ${profile.name}`,
      summary: `Conversation with AI profile ${profile.name}`,
    });

    // Create conversation record
    const conversationId = await ctx.db.insert("aiConversations", {
      threadId,
      userId: user._id,
      aiProfileId,
      relationshipLevel: 1,
      compatibilityScore: 60,
      messageCount: 0,
      lastMessageAt: Date.now(),
    });

    return conversationId;
  },
});

/**
 * Send a message in a conversation.
 * Saves user message and schedules async AI response.
 */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("aiConversations"),
    content: v.string(),
  },
  handler: async (ctx, { conversationId, content }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    // Get user profile to check/deduct credits
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const currentCredits = profile.credits ?? 0;
    const messageCost = 1;

    if (currentCredits < messageCost) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    await ctx.db.patch(profile._id, {
      credits: currentCredits - messageCost,
    });

    // Save user message using Agent component
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId: conversation.threadId,
      userId: user._id,
      prompt: content,
    });

    // Update conversation stats
    const newMessageCount = conversation.messageCount + 1;
    const newLevel = calculateRelationshipLevel(newMessageCount);
    const newScore = calculateCompatibilityScore(
      conversation.compatibilityScore,
      newMessageCount
    );

    await ctx.db.patch(conversationId, {
      messageCount: newMessageCount,
      lastMessageAt: Date.now(),
      relationshipLevel: newLevel,
      compatibilityScore: newScore,
    });

    // Schedule async AI response generation
    await ctx.scheduler.runAfter(
      0,
      internal.features.ai.actions.generateResponse,
      {
        conversationId,
        promptMessageId: messageId,
      }
    );

    return { messageId };
  },
});

/**
 * Create a new AI profile (user-created character).
 */
export const createAIProfile = mutation({
  args: {
    name: v.string(),
    gender: v.union(v.literal("female"), v.literal("male")),
    avatarImageKey: v.optional(v.string()),
    age: v.optional(v.number()),
    zodiacSign: v.optional(v.string()),
    occupation: v.optional(v.string()),
    bio: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    personalityTraits: v.optional(v.array(v.string())),
    profileImageKeys: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    voiceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get user profile to check/deduct credits
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const currentCredits = profile.credits ?? 0;
    const creationCost = 10;

    if (currentCredits < creationCost) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    await ctx.db.patch(profile._id, {
      credits: currentCredits - creationCost,
    });

    // Create the AI profile
    const aiProfileId = await ctx.db.insert("aiProfiles", {
      name: args.name,
      gender: args.gender,
      avatarImageKey: args.avatarImageKey,
      isUserCreated: true,
      status: "active",
      age: args.age,
      zodiacSign: args.zodiacSign,
      occupation: args.occupation,
      bio: args.bio,
      interests: args.interests,
      personalityTraits: args.personalityTraits,
      profileImageKeys: args.profileImageKeys,
      language: args.language ?? "en",
      voiceId: args.voiceId,
      createdByUserId: user._id,
    });

    return aiProfileId;
  },
});

/**
 * Update an existing AI profile (user-created only).
 */
export const updateAIProfile = mutation({
  args: {
    profileId: v.id("aiProfiles"),
    name: v.optional(v.string()),
    avatarImageKey: v.optional(v.string()),
    age: v.optional(v.number()),
    zodiacSign: v.optional(v.string()),
    occupation: v.optional(v.string()),
    bio: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    personalityTraits: v.optional(v.array(v.string())),
    profileImageKeys: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    voiceId: v.optional(v.string()),
  },
  handler: async (ctx, { profileId, ...updates }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db.get(profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    // Only allow updating user-created profiles
    if (!profile.isUserCreated || profile.createdByUserId !== user._id) {
      throw new Error("Cannot edit this profile");
    }

    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(profileId, patch);
    }

    return profileId;
  },
});

/**
 * Archive an AI profile (user-created only).
 */
export const archiveAIProfile = mutation({
  args: {
    profileId: v.id("aiProfiles"),
  },
  handler: async (ctx, { profileId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db.get(profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    // Only allow archiving user-created profiles
    if (!profile.isUserCreated || profile.createdByUserId !== user._id) {
      throw new Error("Cannot archive this profile");
    }

    await ctx.db.patch(profileId, { status: "archived" });

    return null;
  },
});

/**
 * Admin: Update any system AI profile (not user-created).
 * Only users with isAdmin=true can use this.
 */
export const adminUpdateProfile = mutation({
  args: {
    profileId: v.id("aiProfiles"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("female"), v.literal("male"))),
    avatarImageKey: v.optional(v.string()),
    age: v.optional(v.number()),
    zodiacSign: v.optional(v.string()),
    occupation: v.optional(v.string()),
    bio: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    personalityTraits: v.optional(v.array(v.string())),
    profileImageKeys: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    voiceId: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("pending"), v.literal("archived"))
    ),
    communicationStyle: v.optional(
      v.object({
        tone: v.optional(v.string()),
        responseLength: v.optional(v.string()),
        usesEmojis: v.optional(v.boolean()),
        usesSlang: v.optional(v.boolean()),
        flirtLevel: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, { profileId, ...updates }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const userProfile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!userProfile?.isAdmin) {
      throw new Error("Admin access required");
    }

    const profile = await ctx.db.get(profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    // Only allow updating system profiles (not user-created)
    if (profile.isUserCreated) {
      throw new Error("Cannot admin-edit user-created profiles");
    }

    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(profileId, patch);
    }

    return profileId;
  },
});

/**
 * Admin: Generate upload URL for AI profile images.
 */
export const adminGenerateUploadUrl = mutation({
  args: {
    profileId: v.id("aiProfiles"),
    type: v.union(v.literal("avatar"), v.literal("gallery")),
  },
  handler: async (ctx, { profileId, type }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const userProfile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!userProfile?.isAdmin) {
      throw new Error("Admin access required");
    }

    const profile = await ctx.db.get(profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.isUserCreated) {
      throw new Error("Cannot admin-edit user-created profiles");
    }

    // Create a key with aiProfiles prefix and type info
    const key = `aiProfiles/${profileId}/${type}/${crypto.randomUUID()}`;
    const { url } = await r2.generateUploadUrl(key);
    return { url, key };
  },
});

/**
 * Admin: Delete an image from AI profile.
 */
export const adminDeleteProfileImage = mutation({
  args: {
    profileId: v.id("aiProfiles"),
    imageKey: v.string(),
    type: v.union(v.literal("avatar"), v.literal("gallery")),
  },
  handler: async (ctx, { profileId, imageKey, type }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const userProfile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!userProfile?.isAdmin) {
      throw new Error("Admin access required");
    }

    const profile = await ctx.db.get(profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.isUserCreated) {
      throw new Error("Cannot admin-edit user-created profiles");
    }

    // Delete from R2
    await r2.deleteObject(ctx, imageKey);

    // Update the profile
    if (type === "avatar") {
      await ctx.db.patch(profileId, { avatarImageKey: undefined });
    } else {
      const currentKeys = profile.profileImageKeys ?? [];
      const newKeys = currentKeys.filter((k) => k !== imageKey);
      await ctx.db.patch(profileId, { profileImageKeys: newKeys });
    }

    return null;
  },
});

/**
 * Internal mutation to create a chat image request from agent tool call.
 * This is called when the agent decides to send an image based on conversation.
 * No authentication check needed as it's called from internal action.
 */
export const createChatImageRequestInternal = internalMutation({
  args: {
    conversationId: v.id("aiConversations"),
    userId: v.string(), // Better Auth user ID (string, not v.id("users"))
    aiProfileId: v.id("aiProfiles"),
    prompt: v.string(),
    styleOptions: v.optional(
      v.object({
        hairstyle: v.optional(v.string()),
        clothing: v.optional(v.string()),
        scene: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (
    ctx,
    { conversationId, userId, aiProfileId, prompt, styleOptions }
  ) => {
    // Get user profile to check/deduct credits
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", userId))
      .unique();

    if (!profile) {
      console.error("User profile not found for agent image request");
      return null;
    }

    const currentCredits = profile.credits ?? 0;
    const imageCost = 5;

    if (currentCredits < imageCost) {
      console.log("Insufficient credits for agent image request");
      // Don't throw, just return - the agent already sent a message
      return null;
    }

    // Deduct credits
    await ctx.db.patch(profile._id, {
      credits: currentCredits - imageCost,
    });

    // Create chat image request
    const requestId = await ctx.db.insert("chatImages", {
      conversationId,
      userId,
      aiProfileId,
      prompt,
      styleOptions: styleOptions
        ? {
            hairstyle: styleOptions.hairstyle,
            clothing: styleOptions.clothing,
            scene: styleOptions.scene,
          }
        : undefined,
      status: "pending",
      creditsCharged: imageCost,
    });

    // Schedule image generation
    await ctx.scheduler.runAfter(
      0,
      internal.features.ai.actions.generateChatImage,
      {
        requestId,
      }
    );

    console.log("Created agent-initiated image request:", requestId);
    return requestId;
  },
});

/**
 * Request a custom image from an AI profile (selfies, photos, etc.).
 */
export const requestChatImage = mutation({
  args: {
    conversationId: v.id("aiConversations"),
    prompt: v.string(),
    styleOptions: v.optional(
      v.object({
        hairstyle: v.optional(v.string()),
        clothing: v.optional(v.string()),
        scene: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { conversationId, prompt, styleOptions }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    // Get user profile to check/deduct credits
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const currentCredits = profile.credits ?? 0;
    const imageCost = 5;

    if (currentCredits < imageCost) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    await ctx.db.patch(profile._id, {
      credits: currentCredits - imageCost,
    });

    // Create chat image request
    const requestId = await ctx.db.insert("chatImages", {
      conversationId,
      userId: user._id,
      aiProfileId: conversation.aiProfileId,
      prompt,
      styleOptions,
      status: "pending",
      creditsCharged: imageCost,
    });

    // Add user message showing the image request
    if (conversation.threadId) {
      const styleDescription = styleOptions
        ? [
            styleOptions.hairstyle && `with ${styleOptions.hairstyle}`,
            styleOptions.clothing && `wearing ${styleOptions.clothing}`,
            styleOptions.scene && `in a ${styleOptions.scene} setting`,
          ]
            .filter(Boolean)
            .join(", ")
        : "";

      const userMessage = `Can you send me a selfie${styleDescription ? ` ${styleDescription}` : ""}?`;

      // Save user message with prompt parameter (for user messages)
      await saveMessage(ctx, components.agent, {
        threadId: conversation.threadId,
        userId: user._id,
        prompt: JSON.stringify({
          type: "image_request",
          prompt,
          styleOptions,
          requestId,
          message: userMessage,
        }),
      });
    }

    // Schedule image generation
    await ctx.scheduler.runAfter(
      0,
      internal.features.ai.actions.generateChatImage,
      {
        requestId,
      }
    );

    return requestId;
  },
});

/**
 * Internal mutation to update chat image request status.
 */
export const updateChatImageRequest = internalMutation({
  args: {
    requestId: v.id("chatImages"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    imageKey: v.optional(v.string()),
    replicateJobId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, ...updates }) => {
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Chat image request not found");
    }

    const patch: Record<string, unknown> = { status: updates.status };
    if (updates.imageKey) patch.imageKey = updates.imageKey;
    if (updates.replicateJobId) patch.replicateJobId = updates.replicateJobId;
    if (updates.errorMessage) patch.errorMessage = updates.errorMessage;

    await ctx.db.patch(requestId, patch);

    // If completed successfully, add the image as a message in the conversation
    if (updates.status === "completed" && updates.imageKey) {
      const conversation = await ctx.db.get(request.conversationId);
      if (conversation && conversation.threadId) {
        // Get the image URL
        const imageUrl = await r2.getUrl(updates.imageKey);

        // Get the AI profile for the agent
        const profile = await ctx.db.get(request.aiProfileId);

        if (profile && imageUrl) {
          // Create the agent for this profile
          const agent = createAIProfileAgent(profile);

          // Add a message with the generated image (use message parameter for assistant messages)
          await saveMessage(ctx, components.agent, {
            threadId: conversation.threadId,
            userId: conversation.userId,
            message: {
              role: "assistant",
              content: JSON.stringify({
                type: "image_response",
                imageUrl,
                imageKey: updates.imageKey,
                prompt: request.prompt,
              }),
            },
            agentName: agent.name,
          });
        }
      }
    }

    // Refund credits on failure and send apology message
    if (updates.status === "failed") {
      const userProfile = await ctx.db
        .query("profile")
        .withIndex("by_auth_user_id", (q) => q.eq("authUserId", request.userId))
        .unique();

      if (userProfile) {
        await ctx.db.patch(userProfile._id, {
          credits: (userProfile.credits ?? 0) + request.creditsCharged,
        });
      }

      // Send an apology message from the AI
      const conversation = await ctx.db.get(request.conversationId);
      if (conversation && conversation.threadId) {
        const profile = await ctx.db.get(request.aiProfileId);
        if (profile) {
          const agent = createAIProfileAgent(profile);
          await saveMessage(ctx, components.agent, {
            threadId: conversation.threadId,
            userId: conversation.userId,
            message: {
              role: "assistant",
              content:
                "Oops, I couldn't take that photo right now 😅 My camera seems to be acting up! Can you ask me something else instead?",
            },
            agentName: agent.name,
          });
        }
      }
    }

    return null;
  },
});

/**
 * Delete a user message and its AI response.
 * The user can only delete their own messages.
 * This deletes the user message and the following AI response(s).
 */
export const deleteMessage = mutation({
  args: {
    conversationId: v.id("aiConversations"),
    messageOrder: v.number(),
  },
  handler: async (ctx, { conversationId, messageOrder }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    // Get the AI profile to create the agent
    const profile = await ctx.db.get(conversation.aiProfileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    // Create the agent for this profile to use deleteMessageRange
    const agent = createAIProfileAgent(profile);

    // Delete the user message and the following AI response
    // We delete from messageOrder to messageOrder + 2 to include both
    // the user message (order N) and the AI response (order N+1)
    await agent.deleteMessageRange(ctx, {
      threadId: conversation.threadId,
      startOrder: messageOrder,
      endOrder: messageOrder + 2, // Exclusive end, so this deletes order N and N+1
    });

    // Update conversation message count
    const newMessageCount = Math.max(0, conversation.messageCount - 2);
    await ctx.db.patch(conversationId, {
      messageCount: newMessageCount,
      relationshipLevel: calculateRelationshipLevel(newMessageCount),
    });

    return { success: true };
  },
});

/**
 * Clear all messages and images from a conversation.
 * This resets the conversation to its initial state.
 */
export const clearChat = mutation({
  args: {
    conversationId: v.id("aiConversations"),
  },
  returns: v.object({ success: v.boolean(), newThreadId: v.string() }),
  handler: async (ctx, { conversationId }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    // Get the AI profile
    const profile = await ctx.db.get(conversation.aiProfileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const oldThreadId = conversation.threadId;

    // Delete the old thread completely (messages, streams, embeddings, etc.)
    // This is async and will continue in the background, but starts immediately
    let deleteResult = await ctx.runMutation(
      components.agent.threads.deleteAllForThreadIdAsync,
      { threadId: oldThreadId }
    );

    // Keep calling until deletion is complete
    while (!deleteResult.isDone) {
      deleteResult = await ctx.runMutation(
        components.agent.threads.deleteAllForThreadIdAsync,
        { threadId: oldThreadId }
      );
    }

    // Create a new thread for fresh conversation
    const newThreadId = await createThread(ctx, components.agent, {
      userId: user._id,
      title: `Chat with ${profile.name}`,
      summary: `Conversation with AI profile ${profile.name}`,
    });

    // Delete all chat images for this conversation
    console.log(
      "[clearChat] Querying chatImages for conversationId:",
      conversationId
    );
    const chatImages = await ctx.db
      .query("chatImages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    console.log(
      "[clearChat] Found chatImages:",
      chatImages.length,
      chatImages.map((img) => ({ id: img._id, imageKey: img.imageKey }))
    );

    for (const image of chatImages) {
      console.log(
        "[clearChat] Processing image:",
        image._id,
        "imageKey:",
        image.imageKey
      );
      // Delete from R2 if there's an imageKey
      if (image.imageKey) {
        try {
          console.log("[clearChat] Deleting R2 object:", image.imageKey);
          await r2.deleteObject(ctx, image.imageKey);
          console.log("[clearChat] R2 delete success for:", image.imageKey);
        } catch (error) {
          console.error(
            "[clearChat] Failed to delete R2 object:",
            image.imageKey,
            error
          );
        }
      }
      console.log("[clearChat] Deleting DB record:", image._id);
      await ctx.db.delete(image._id);
      console.log("[clearChat] DB delete success for:", image._id);
    }

    // Delete all quiz sessions for this conversation
    const quizSessions = await ctx.db
      .query("quizSessions")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    for (const session of quizSessions) {
      await ctx.db.delete(session._id);
    }

    // Update conversation with new thread and reset to initial state
    await ctx.db.patch(conversationId, {
      threadId: newThreadId,
      messageCount: 0,
      relationshipLevel: 1,
      compatibilityScore: 60,
      lastMessageAt: Date.now(),
    });

    return { success: true, newThreadId };
  },
});
