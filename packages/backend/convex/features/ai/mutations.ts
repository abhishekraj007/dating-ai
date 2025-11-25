import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { createThread, saveMessage } from "@convex-dev/agent";
import { components } from "../../_generated/api";
import { authComponent } from "../../lib/betterAuth";
import {
  calculateRelationshipLevel,
  calculateCompatibilityScore,
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

    // Refund credits on failure
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
    }

    return null;
  },
});
