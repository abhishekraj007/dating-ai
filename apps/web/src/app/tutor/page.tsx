"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import {
  useUIMessages,
  optimisticallySendMessage,
} from "@convex-dev/agent/react";
import type { UIMessage } from "@convex-dev/agent/react";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import type { StreamId } from "@convex-dev/persistent-text-streaming";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ProtectedRoute } from "@/components/protected-route";
import { Loader2, Send, BookOpen, MessageCircle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function EnglishTutorPage() {
  const [message, setMessage] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const userData = useQuery(api.user.fetchUserAndProfile);
  const userId = userData?.userMetadata?._id;

  // Load user's active thread from database
  const activeThreadFromDb = useQuery(
    api.englishTutor.getActiveThread,
    userId ? { userId } : "skip"
  );

  // Load user's threads
  const userThreads = useQuery(
    api.englishTutor.listUserThreads,
    userId ? { userId, paginationOpts: { numItems: 1, cursor: null } } : "skip"
  );

  const createThread = useMutation(api.englishTutor.createTutorThread);
  const sendMessageMutation = useMutation(
    api.englishTutor.sendMessage
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.englishTutor.listThreadMessages)
  );
  const deleteThreadAction = useAction(api.englishTutor.deleteThread);

  const { results: messages, status } = useUIMessages(
    api.englishTutor.listThreadMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true }
  );

  // Get Convex URL for streaming endpoint
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
    /\.convex\.cloud$/,
    ".convex.site"
  );

  // Use persistent text streaming for the active response
  const { text: streamedText, status: streamStatus } = useStream(
    api.englishTutor.getMessageBody,
    new URL(`${convexUrl}/tutor-stream`),
    isInitiator,
    activeStreamId as StreamId | undefined
  );

  const setActiveThread = useMutation(api.englishTutor.setActiveThread);

  // Load or create thread
  useEffect(() => {
    if (!userId || threadId) return;

    // Load active thread from database
    if (activeThreadFromDb) {
      setThreadId(activeThreadFromDb);
      return;
    }

    // Check if user has existing threads
    if (userThreads?.page && userThreads.page.length > 0) {
      const mostRecentThread = userThreads.page[0]._id;
      setThreadId(mostRecentThread);
      setActiveThread({ userId, threadId: mostRecentThread });
    } else if (userThreads?.page) {
      // No existing threads, create new one
      createThread({ userId }).then((newThreadId) => {
        setThreadId(newThreadId);
      });
    }
  }, [
    userId,
    threadId,
    activeThreadFromDb,
    userThreads,
    createThread,
    setActiveThread,
  ]);

  // Auto-scroll to bottom on new messages or streaming updates
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, streamedText]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !threadId || !userId) return;

    const userMessage = message;
    setMessage("");
    setIsInitiator(true);

    const result = await sendMessageMutation({
      threadId,
      userId,
      prompt: userMessage,
    });

    // Set the stream ID for the response
    if (result?.streamId) {
      setActiveStreamId(result.streamId);
    }
  };

  const handleNewConversation = async () => {
    if (!userId) return;
    const newThreadId = await createThread({ userId });
    setThreadId(newThreadId);
    setActiveStreamId(null);
    setIsInitiator(false);
  };

  const renderMessage = (msg: UIMessage) => {
    const isUser = msg.role === "user";
    const isActiveStream = msg.key === activeStreamId;
    const isStreaming = isActiveStream && streamStatus === "streaming";

    // Use streamed text for the active stream, otherwise use message text
    const displayText =
      isActiveStream && streamedText ? streamedText : msg.text;

    return (
      <div
        key={msg.key}
        className={cn(
          "flex gap-3 mb-4",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        <Avatar
          className={cn("h-8 w-8", isUser ? "bg-primary" : "bg-secondary")}
        >
          <AvatarFallback>{isUser ? "U" : "T"}</AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "flex flex-col gap-1 max-w-[80%]",
            isUser ? "items-end" : "items-start"
          )}
        >
          <div
            className={cn(
              "px-4 py-2 rounded-lg",
              isUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {isStreaming ? (
              <div className="flex items-center gap-2">
                <p className="text-sm whitespace-pre-wrap">{displayText}</p>
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{displayText}</p>
            )}
          </div>
          {msg._creationTime && (
            <span className="text-xs text-muted-foreground">
              {new Date(msg._creationTime).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (!userData) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 h-screen max-h-screen flex flex-col max-w-4xl">
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>English Tutor</CardTitle>
                  <CardDescription>
                    Practice and improve your English skills with AI guidance
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewConversation}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <ScrollArea
              ref={scrollAreaRef}
              className="flex-1 p-4 overflow-y-auto"
            >
              {!threadId || status === "LoadingFirstPage" ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-4">{messages.map(renderMessage)}</div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    Start Your English Learning Journey
                  </p>
                  <p className="text-sm max-w-md">
                    Ask me anything about English grammar, vocabulary, writing,
                    or conversation. I'm here to help you improve!
                  </p>
                </div>
              )}
            </ScrollArea>

            <form
              onSubmit={handleSend}
              className="p-4 border-t flex gap-2 bg-background shrink-0"
            >
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message... (e.g., 'Can you explain the difference between affect and effect?')"
                className="flex-1"
                disabled={!threadId}
              />
              <Button type="submit" disabled={!message.trim() || !threadId}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
