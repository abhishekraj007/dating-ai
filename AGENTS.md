# Important

- Divide logics and UI into hooks and components.
- Keep files and component maintable and shorts, devide into multiple if required.
- Always seperate UI and logics into components and hooks.
- Do not use useCallback unless necessary.
- Write layout and components that should work in both light and dark mode.
- Layout and components should be mobile first and responsive.
- Do not write documentation .md file untill neccessary and it's a big feature.
- use heroui-native https://github.com/heroui-inc/heroui-native for native app components and screens development
- **ALWAYS check heroui-native MCP server for available components before using native React Native components**
- Prefer heroui-native components over native components when available (Button over Pressable, TextField over TextInput, Avatar for avatars, Card for cards, etc.)
- Use heroui-native list_components tool to see all available components before implementing UI
- **ALWAYS use expo-image for images in native apps** - provides caching, prefetching, and better performance. Use `cachePolicy="memory-disk"`, `contentFit="cover"`, and `transition` for smooth loading.
- **ALWAYS check heroui-react MCP server for available components before using shadcn-ui components**
- use heroui-react and shadcn-ui for web components and screens development
- use Use shadcn CLI for installing any new web components
- never create markdown (`.md`) files after you're done unless it's a big feature and planning is required. NEVER!
- never user emojis in your replies.
- check convex rules and docs if you're working on convex based projects and not sure about something. For complex convex bugs/implementation, use convex MCP or exa search tool to access latest docs.
- Always make sure code you write is secure and not hackable
- **ALWAYS Only make changes that are directly requested. Keep solutions simple and focused.**
- **ALWAYS read and understand relevant files before proposing edits. Do not speculate about code you have not inspected.**

---

# Convex Agent Component Reference

Reference docs: https://docs.convex.dev/agents

## Threads

Threads group messages together in a linear history. All messages are associated with a thread.

### Creating a Thread

```typescript
import { createThread } from "@convex-dev/agent";

const threadId = await createThread(ctx, components.agent, {
  userId,
  title: "My thread",
  summary: "Thread summary",
});
```

### Deleting Threads

```typescript
// Async (from mutation or action)
await agent.deleteThreadAsync(ctx, { threadId });

// Sync in batches (from action only)
await agent.deleteThreadSync(ctx, { threadId });

// Delete all threads by user
await agent.deleteThreadsByUserId(ctx, { userId });
```

## Messages

Each message has `order` and `stepOrder` fields (incrementing integers per thread).

### Saving Messages

```typescript
import { saveMessage } from "@convex-dev/agent";

const { messageId } = await saveMessage(ctx, components.agent, {
  threadId,
  userId,
  message: { role: "user", content: "The user message" },
});

// Or using Agent class
const { messageId } = await agent.saveMessage(ctx, {
  threadId,
  userId,
  prompt, // for user messages
  metadata,
});
```

### Retrieving Messages

```typescript
import { listUIMessages } from "@convex-dev/agent";

const paginated = await listUIMessages(ctx, components.agent, {
  threadId,
  paginationOpts: { numItems: 10, cursor: null },
});

// Or query directly
const messagesResult = await ctx.runQuery(
  components.agent.messages.listMessagesByThreadId,
  {
    threadId,
    order: "desc",
    paginationOpts: { numItems: 10, cursor: null },
  }
);
```

### Deleting Messages

```typescript
// By ID
await agent.deleteMessage(ctx, { messageId });
await agent.deleteMessages(ctx, { messageIds });

// By order range (startOrder inclusive, endOrder exclusive)
await agent.deleteMessageRange(ctx, {
  threadId,
  startOrder: 0,
  endOrder: maxOrder + 1, // +1 because endOrder is exclusive
});

// Delete messages with order 1 or 2
await agent.deleteMessageRange(ctx, { threadId, startOrder: 1, endOrder: 3 });
```

### UIMessage Type

Messages from `listUIMessages` include:

- `key` - unique identifier
- `order` - order in thread
- `stepOrder` - step order in thread
- `status` - status or "streaming"
- `text` - text content
- `parts` - array of parts (text, file, image, toolCall, toolResult)
- `role` - user, assistant, system
- `_creationTime` - timestamp

## Files and Images

### Saving Files

```typescript
import { storeFile, getFile } from "@convex-dev/agent";

const { file } = await storeFile(
  ctx,
  components.agent,
  new Blob([bytes], { type: mimeType }),
  { filename, sha256 }
);
const { fileId, url, storageId } = file;
```

### Sending Images in Messages

```typescript
const { filePart, imagePart } = await getFile(ctx, components.agent, fileId);

await agent.saveMessage(ctx, {
  threadId,
  message: {
    role: "user",
    content: [
      imagePart ?? filePart,
      { type: "text", text: "What is this image?" },
    ],
  },
  metadata: { fileIds: [fileId] }, // tracks file usage
});
```

### Inline Image Saving (in actions)

```typescript
await thread.generateText({
  message: {
    role: "user",
    content: [
      { type: "image", image: imageBytes, mimeType: "image/png" },
      { type: "text", text: "What is this image?" },
    ],
  },
});
```

## Clear Chat Implementation Pattern

To clear all messages from a conversation while keeping the thread:

```typescript
// 1. Query thread to get max order
const messagesResult = await ctx.runQuery(
  components.agent.messages.listMessagesByThreadId,
  {
    threadId: conversation.threadId,
    order: "desc",
    paginationOpts: { numItems: 1, cursor: null },
  }
);

// 2. Delete all messages using deleteMessageRange
if (messagesResult.page.length > 0) {
  const maxOrder = messagesResult.page[0].order;
  await agent.deleteMessageRange(ctx, {
    threadId: conversation.threadId,
    startOrder: 0,
    endOrder: maxOrder + 1, // Exclusive, so +1 to include last message
  });
}

// 3. Clean up related data (images, quiz sessions, etc.)
// 4. Reset conversation metadata
```
