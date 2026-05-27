import { saveMessage } from "@convex-dev/agent";
import { components } from "../../_generated/api";
import type { GenericMutationCtx } from "convex/server";
import type { DataModel, Id } from "../../_generated/dataModel";

export type ChatMediaType = "video" | "image";

export function buildMediaProcessingContent(
  mediaType: ChatMediaType,
  requestId: string,
  prompt: string,
) {
  return JSON.stringify({
    type: mediaType === "video" ? "video_processing" : "image_processing",
    requestId,
    prompt,
  });
}

export function buildMediaResponseContent(
  mediaType: ChatMediaType,
  args: {
    requestId: string;
    prompt: string;
    imageKey?: string;
    videoKey?: string;
    posterKey?: string;
  },
) {
  if (mediaType === "video") {
    return JSON.stringify({
      type: "video_response",
      requestId: args.requestId,
      videoKey: args.videoKey,
      posterKey: args.posterKey,
      prompt: args.prompt,
    });
  }

  return JSON.stringify({
    type: "image_response",
    requestId: args.requestId,
    imageKey: args.imageKey,
    prompt: args.prompt,
  });
}

export function buildMediaFailedContent(
  mediaType: ChatMediaType,
  requestId: string,
  message: string,
) {
  return JSON.stringify({
    type: mediaType === "video" ? "video_failed" : "image_failed",
    requestId,
    message,
  });
}

export async function patchAgentMessageContent(
  ctx: GenericMutationCtx<DataModel>,
  messageId: string,
  content: string,
) {
  await ctx.runMutation(components.agent.messages.updateMessage, {
    messageId,
    patch: {
      message: {
        role: "assistant",
        content,
      },
    },
  });
}

export async function createMediaProcessingPlaceholder(
  ctx: GenericMutationCtx<DataModel>,
  args: {
    threadId: string;
    userId: string;
    agentName: string;
    requestId: string;
    mediaType: ChatMediaType;
    prompt: string;
    promptMessageId?: string;
  },
): Promise<string> {
  const { messageId } = await saveMessage(ctx, components.agent, {
    threadId: args.threadId,
    userId: args.userId,
    message: {
      role: "assistant",
      content: buildMediaProcessingContent(
        args.mediaType,
        args.requestId,
        args.prompt,
      ),
    },
    agentName: args.agentName,
    ...(args.promptMessageId ? { promptMessageId: args.promptMessageId } : {}),
  });
  return messageId;
}

export async function attachMediaProcessingPlaceholder(
  ctx: GenericMutationCtx<DataModel>,
  args: {
    conversationId: Id<"aiConversations">;
    requestId: Id<"chatImages"> | Id<"chatVideos">;
    mediaType: ChatMediaType;
    prompt: string;
    promptMessageId?: string;
  },
): Promise<string | undefined> {
  const conversation = await ctx.db.get(args.conversationId);
  if (!conversation?.threadId) {
    return undefined;
  }

  const profile = await ctx.db.get(conversation.aiProfileId);
  if (!profile) {
    return undefined;
  }

  const responseMessageId = await createMediaProcessingPlaceholder(ctx, {
    threadId: conversation.threadId,
    userId: conversation.userId,
    agentName: profile.name,
    requestId: args.requestId,
    mediaType: args.mediaType,
    prompt: args.prompt,
    promptMessageId: args.promptMessageId,
  });

  await ctx.db.patch(args.requestId, { responseMessageId });
  return responseMessageId;
}

export function buildInFlightMediaContext(
  images: { prompt: string }[],
  videos: { prompt: string }[],
): string {
  if (images.length === 0 && videos.length === 0) {
    return "";
  }

  const lines: string[] = [];

  if (videos.length > 0) {
    lines.push(
      `Videos currently generating: ${videos.map((video) => video.prompt).join("; ")}`,
    );
  }

  if (images.length > 0) {
    lines.push(
      `Photos currently generating: ${images.map((image) => image.prompt).join("; ")}`,
    );
  }

  return `

## In-flight media jobs:
${lines.join("\n")}
Do not repeat the same media offer unless the user explicitly asks again.`;
}
