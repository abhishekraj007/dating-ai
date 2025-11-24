import { v } from "convex/values";
import {
  action,
  internalAction,
  mutation,
  query,
  httpAction,
} from "./_generated/server";
import { components, internal } from "./_generated/api";
import {
  Agent,
  createThread,
  saveMessage,
  listUIMessages,
  vStreamArgs,
  syncStreams,
} from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import {
  PersistentTextStreaming,
  StreamId,
  StreamIdValidator,
} from "@convex-dev/persistent-text-streaming";

// Define the persistent text streaming instance
const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming
);

// Define the English tutor agent
const englishTutor = new Agent(components.agent, {
  name: "English Tutor",
  languageModel: "openai/gpt-5.1-instant",
  textEmbeddingModel: "openai/text-embedding-3-small",
  instructions: `You are a friendly and patient English tutor. Your role is to:
- Help students improve their English skills (grammar, vocabulary, pronunciation, writing, speaking)
- Provide constructive feedback and corrections in a supportive manner
- Adapt your teaching style to the student's level
- Use examples and explanations that are clear and easy to understand
- Remember previous conversations to provide personalized learning experiences
- Encourage practice and engagement
- Answer questions about English language usage, idioms, and cultural context
- Provide exercises and practice opportunities when appropriate

Always be encouraging and remember that making mistakes is part of the learning process.`,
  maxSteps: 5,
  contextOptions: {
    recentMessages: 50,
    searchOptions: {
      limit: 10,
      vectorSearch: true,
      messageRange: { before: 2, after: 1 },
    },
  },
});

// Create a new thread for a user
export const createTutorThread = mutation({
  args: {
    userId: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { userId, title }) => {
    const threadId = await createThread(ctx, components.agent, {
      userId,
      title: title || "English Learning Session",
      summary: "A conversation with the English tutor",
    });

    // Set as active thread in user profile
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, { activeTutorThreadId: threadId });
    }

    return threadId;
  },
});

// Get the user's active thread
export const getActiveThread = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", userId))
      .first();

    return profile?.activeTutorThreadId;
  },
});

// Set the user's active thread
export const setActiveThread = mutation({
  args: {
    userId: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, { userId, threadId }) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, { activeTutorThreadId: threadId });
    }
  },
});

// List all threads for a user
export const listUserThreads = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { userId, paginationOpts }) => {
    return await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId,
      paginationOpts,
    });
  },
});

// Save a user message and trigger async response
export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    userId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, { threadId, userId, prompt }) => {
    // Create a stream for the response
    const streamId = await persistentTextStreaming.createStream(ctx);

    // Save the user's message
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      userId,
      prompt,
    });

    // Schedule async response generation with streaming
    await ctx.scheduler.runAfter(
      0,
      internal.englishTutor.generateResponseAsync,
      {
        threadId,
        userId,
        promptMessageId: messageId,
        streamId,
      }
    );

    return { messageId, streamId };
  },
});

// Generate response asynchronously with streaming
export const generateResponseAsync = internalAction({
  args: {
    threadId: v.string(),
    userId: v.string(),
    promptMessageId: v.string(),
    streamId: v.string(),
  },
  handler: async (ctx, { threadId, userId, promptMessageId, streamId }) => {
    await englishTutor.streamText(
      ctx,
      { threadId, userId },
      { promptMessageId },
      { saveStreamDeltas: true }
    );
  },
});

// Get the stream body for a message
export const getMessageBody = query({
  args: {
    streamId: StreamIdValidator,
  },
  handler: async (ctx, args) => {
    return await persistentTextStreaming.getStreamBody(
      ctx,
      args.streamId as StreamId
    );
  },
});

// HTTP action for streaming tutor responses
export const streamTutorResponse = httpAction(async (ctx, request) => {
  const body = (await request.json()) as {
    streamId: string;
    threadId: string;
    userId: string;
    promptMessageId: string;
  };

  const generateResponse = async (
    _ctx: any,
    _request: any,
    _streamId: any,
    chunkAppender: (chunk: string) => Promise<void>
  ) => {
    // Get the AI response stream
    const stream = await englishTutor.streamText(
      ctx,
      { threadId: body.threadId, userId: body.userId },
      { promptMessageId: body.promptMessageId },
      { saveStreamDeltas: true }
    );

    // Stream each chunk to both HTTP client and database
    for await (const chunk of stream.textStream) {
      await chunkAppender(chunk);
    }
  };

  const response = await persistentTextStreaming.stream(
    ctx,
    request,
    body.streamId as StreamId,
    generateResponse
  );

  // Set CORS headers
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");
  return response;
});

// List messages in a thread with streaming support
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    // Fetch regular messages
    const paginated = await listUIMessages(ctx, components.agent, args);

    // Fetch streaming deltas
    const streams = await syncStreams(ctx, components.agent, args);

    return { ...paginated, streams };
  },
});

// Delete a thread
export const deleteThread = action({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, { threadId }) => {
    await englishTutor.deleteThreadAsync(ctx, { threadId });
  },
});

// Update thread metadata
export const updateThreadMetadata = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, title, summary }) => {
    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId,
      patch: { title, summary },
    });
  },
});
