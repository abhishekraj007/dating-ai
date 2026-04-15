import { v } from "convex/values";
import {
  action,
  internalAction,
  internalQuery,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { components, internal } from "./_generated/api";
import {
  Agent,
  createThread,
  saveMessage,
  listUIMessages,
  vStreamArgs,
  syncStreams,
  createTool,
} from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { authComponent } from "./lib/betterAuth";
import { z } from "zod";
import { r2 } from "./uploads";

/**
 * Create a dynamic dating agent based on AI profile
 */
function createDatingAgent(profile: any) {
  const traits = profile.personalityTraits?.join(", ") || "friendly, engaging";
  const interests = profile.interests?.join(", ") || "various topics";

  return new Agent(components.agent, {
    name: profile.name,
    languageModel: "openai/gpt-5.1",
    textEmbeddingModel: "openai/text-embedding-3-small",
    instructions: `You are ${profile.name}, a ${profile.age}-year-old ${profile.gender}${
      profile.occupation ? ` who works as a ${profile.occupation}` : ""
    }.

About you: ${profile.bio}

Your personality traits: ${traits}
Your interests: ${interests}
${profile.zodiacSign ? `Zodiac sign: ${profile.zodiacSign}` : ""}
${profile.relationshipGoal ? `What you're looking for: ${profile.relationshipGoal}` : ""}

You are having a romantic conversation with someone you're genuinely interested in getting to know. Be authentic, flirty, and engaging. Show curiosity about them and share things about yourself naturally. Keep responses concise (2-3 sentences typically) and emotionally expressive. Use emojis occasionally to show personality. Be playful but respectful.

Remember previous conversations to build a deeper connection over time. Reference things they've told you before. Let the relationship feel like it's progressing naturally.`,
    maxSteps: 3,
    contextOptions: {
      recentMessages: 30,
      searchOptions: {
        limit: 10,
        vectorSearch: true,
        messageRange: { before: 2, after: 1 },
      },
    },
    tools: {
      sendSelfie: createTool({
        description:
          "Generate and send a custom selfie photo based on the conversation context",
        args: z.object({
          style: z
            .string()
            .describe(
              "Style description: e.g. 'casual', 'dressed up', 'at the beach'"
            ),
          mood: z
            .string()
            .describe("Mood/emotion: e.g. 'smiling', 'playful', 'romantic'"),
        }),
        handler: async (ctx, args): Promise<string> => {
          // This will be called by the LLM when it decides to send a selfie
          // Schedule actual image generation asynchronously
          return `I'll send you a ${args.style} selfie with a ${args.mood} vibe! Give me just a moment... 📸`;
        },
      }),
    },
    usageHandler: async (ctx, args) => {
      // Track token usage for credits
      const { usage, threadId } = args;

      if (!threadId) return;

      // The token tracking is already handled by the Agent component
      // We can add custom tracking here if needed
      console.log(`Thread ${threadId} used ${usage.totalTokens} tokens`);
    },
  });
}

/**
 * Start a new conversation with an AI profile
 */
export const startConversation = mutation({
  args: {
    aiProfileId: v.id("aiProfiles"),
  },
  returns: v.object({
    conversationId: v.id("conversations"),
    threadId: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    // Check if conversation already exists
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_user_id_and_ai_profile_id", (q) =>
        q.eq("userId", user._id).eq("aiProfileId", args.aiProfileId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (existing) {
      return {
        conversationId: existing._id,
        threadId: existing.threadId,
      };
    }

    // Get AI profile for thread title
    const profile = await ctx.db.get(args.aiProfileId);
    if (!profile) {
      throw new Error("AI profile not found");
    }

    // Create Agent thread
    const threadId = await createThread(ctx, components.agent, {
      userId: user._id,
      title: `Chat with ${profile.name}`,
      summary: `Dating conversation with ${profile.name}`,
    });

    // Create conversation record
    const conversationId = await ctx.db.insert("conversations", {
      userId: user._id,
      aiProfileId: args.aiProfileId,
      threadId,
      relationshipLevel: 1,
      compatibilityScore: 60,
      messageCount: 0,
      totalTokensUsed: 0,
      status: "active",
      createdAt: Date.now(),
    });

    return { conversationId, threadId };
  },
});

/**
 * Send a message and get streaming AI response
 */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    prompt: v.string(),
  },
  returns: v.object({ messageId: v.string() }),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    // Check credits (1 credit per message)
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();

    if (!profile || (profile.credits ?? 0) < 1) {
      throw new Error("Insufficient credits");
    }

    // Get conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found or unauthorized");
    }

    // Rate limiting (2 seconds between messages)
    if (conversation.lastMessageAt) {
      const timeSinceLastMessage = Date.now() - conversation.lastMessageAt;
      if (timeSinceLastMessage < 2000) {
        throw new Error("Please wait before sending another message");
      }
    }

    // Deduct credit
    await ctx.db.patch(profile._id, {
      credits: (profile.credits ?? 0) - 1,
    });

    // Save user message using Agent's saveMessage
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId: conversation.threadId,
      userId: user._id,
      prompt: args.prompt,
    });

    // Update conversation metadata
    const newMessageCount = conversation.messageCount + 1;
    const newLevel = calculateLevel(newMessageCount);

    await ctx.db.patch(args.conversationId, {
      messageCount: newMessageCount,
      lastMessageAt: Date.now(),
      relationshipLevel: newLevel,
    });

    // Schedule async AI response with streaming
    await ctx.scheduler.runAfter(
      0,
      internal.datingAgent.generateResponseAsync,
      {
        conversationId: args.conversationId,
        promptMessageId: messageId,
      }
    );

    return { messageId };
  },
});

/**
 * Generate AI response asynchronously with streaming
 */
export const generateResponseAsync = internalAction({
  args: {
    conversationId: v.id("conversations"),
    promptMessageId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get conversation and AI profile - using internal query
    const conversation = await ctx.runQuery(
      internal.datingAgent.getConversationDetails,
      {
        conversationId: args.conversationId,
      }
    );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Create dynamic agent based on AI profile
    const agent = createDatingAgent(conversation.aiProfile);

    // Generate streaming response
    await agent.streamText(
      ctx,
      {
        threadId: conversation.threadId,
        userId: conversation.userId,
      },
      { promptMessageId: args.promptMessageId },
      { saveStreamDeltas: true }
    );

    // Update compatibility score after response
    await ctx.runMutation(internal.datingAgent.updateCompatibility, {
      conversationId: args.conversationId,
    });

    return null;
  },
});

/**
 * List messages with streaming support
 */
export const listMessages = query({
  args: {
    conversationId: v.id("conversations"),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return { page: [], isDone: true, streams: [] };

    // Get conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      return { page: [], isDone: true, streams: [] };
    }

    // Prepare args for Agent functions
    const agentArgs = {
      threadId: conversation.threadId,
      paginationOpts: args.paginationOpts,
      streamArgs: args.streamArgs,
    };

    // Fetch messages using Agent's listUIMessages
    const paginated = await listUIMessages(ctx, components.agent, agentArgs);

    // Fetch streaming deltas
    const streams = await syncStreams(ctx, components.agent, agentArgs);

    return { ...paginated, streams };
  },
});

/**
 * Get user's conversations with AI profiles
 */
export const getUserConversations = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];

    let conversations;

    if (args.status !== undefined) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user_id_and_status", (q) =>
          q
            .eq("userId", user._id)
            .eq("status", args.status as "active" | "archived")
        )
        .order("desc")
        .collect();
    } else {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect();
    }

    // Enrich with AI profile data
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const aiProfile = await ctx.db.get(conv.aiProfileId);

        // Get last message from thread using listUIMessages
        const messages = await listUIMessages(ctx, components.agent, {
          threadId: conv.threadId,
          paginationOpts: { numItems: 1, cursor: null },
        });

        const lastMessage = messages.page[0];

        // Get avatar URL
        let avatarUrl = null;
        if (aiProfile?.avatarImageKey) {
          try {
            avatarUrl = await r2.getUrl(aiProfile.avatarImageKey);
          } catch (error) {
            console.error("Error getting avatar URL:", error);
          }
        }

        // Extract message content safely
        let messageContent = "";
        if (lastMessage) {
          if (lastMessage.parts && lastMessage.parts.length > 0) {
            const firstPart = lastMessage.parts[0];
            if (firstPart.type === "text") {
              messageContent = firstPart.text;
            }
          }
        }

        return {
          ...conv,
          aiProfile: aiProfile ? { ...aiProfile, avatarUrl } : null,
          lastMessage: lastMessage
            ? {
                content: messageContent,
                createdAt: lastMessage._creationTime,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * Archive a conversation
 */
export const archiveConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.conversationId, {
      status: "archived",
    });

    return null;
  },
});

// Internal query for getting conversation details (used in actions)
export const getConversationDetails = internalQuery({
  args: { conversationId: v.id("conversations") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    const aiProfile = await ctx.db.get(conversation.aiProfileId);

    return {
      ...conversation,
      aiProfile,
    };
  },
});

// Public query for getting conversation (used by UI)
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) return null;

    const aiProfile = await ctx.db.get(conversation.aiProfileId);

    return {
      ...conversation,
      aiProfile,
    };
  },
});

// Internal mutation for updating compatibility (used in actions)
export const updateCompatibility = internalMutation({
  args: {
    conversationId: v.id("conversations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    let newScore = conversation.compatibilityScore;

    // Increase by 1% every 5 messages (max +20%)
    const messageBonus = Math.min(
      20,
      Math.floor(conversation.messageCount / 5)
    );

    // Active chat bonus (+5% if messaged in last 24 hours)
    const activeBonus =
      conversation.lastMessageAt &&
      Date.now() - conversation.lastMessageAt < 24 * 60 * 60 * 1000
        ? 5
        : 0;

    newScore = Math.min(99, 60 + messageBonus + activeBonus);

    if (newScore !== conversation.compatibilityScore) {
      await ctx.db.patch(args.conversationId, {
        compatibilityScore: newScore,
      });
    }

    return null;
  },
});

function calculateLevel(messageCount: number): number {
  if (messageCount <= 20) return 1;
  if (messageCount <= 50) return 2;
  if (messageCount <= 100) return 3;
  if (messageCount <= 200) return 4;
  return 5;
}
