import { useQuery, useMutation } from "convex/react";
import { api } from "@convex-starter/backend";
import { useMemo } from "react";

export function useMessages(conversationId: string | undefined) {
  // streamArgs must match vStreamArgs validator:
  // { kind: "list", startOrder?: number } or
  // { kind: "deltas", cursors: [{ cursor, streamId }] }
  const streamArgs = useMemo(() => ({ kind: "list" as const }), []);

  const messagesResult = useQuery(
    api.features.ai.queries.getMessages,
    conversationId
      ? {
          conversationId: conversationId as any,
          paginationOpts: { numItems: 50, cursor: null },
          streamArgs,
        }
      : "skip"
  );

  // Process messages from agent format
  const messages = useMemo(() => {
    if (!messagesResult) return [];

    const { page } = messagesResult;

    return page.map((msg: any) => ({
      _id: msg._id,
      _creationTime: msg._creationTime,
      role: msg.role,
      content: msg.text || "",
      isStreaming: false,
    }));
  }, [messagesResult]);

  return {
    messages,
    isLoading: messagesResult === undefined,
  };
}

export function useSendMessage() {
  const sendMessage = useMutation(api.features.ai.mutations.sendMessage);

  return { sendMessage };
}
