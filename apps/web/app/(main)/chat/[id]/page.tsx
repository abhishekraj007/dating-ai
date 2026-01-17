"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useConversation } from "@/hooks/use-conversations";
import { useMessages, useSendMessage } from "@/hooks/use-messages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter();
  const { id: conversationId } = use(params);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { conversation, isLoading: isLoadingConversation } =
    useConversation(conversationId);
  const threadId = conversation?.threadId;
  const { messages, isLoading: isLoadingMessages } = useMessages(threadId);
  const { sendMessage } = useSendMessage();

  const profile = conversation?.profile;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !conversationId || isSending) return;

    const content = message.trim();
    setMessage("");
    setIsSending(true);

    try {
      await sendMessage({
        conversationId: conversationId as any,
        content,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), "HH:mm");
  };

  const parseMessageContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === "image_response" && parsed.imageUrl) {
        return { type: "image", imageUrl: parsed.imageUrl };
      }
      if (parsed.type === "quiz_question") {
        return {
          type: "quiz",
          question: parsed.question,
          options: parsed.options,
        };
      }
      if (
        parsed.type === "quiz_start" ||
        parsed.type === "quiz_answer_result" ||
        parsed.type === "quiz_end"
      ) {
        return { type: "text", content: parsed.message || content };
      }
      return { type: "text", content };
    } catch {
      return { type: "text", content };
    }
  };

  if (isLoadingConversation) {
    return (
      <div className="flex flex-col h-full">
        {/* Fixed Header Skeleton */}
        <div className="flex-none p-4 border-b border-border flex items-center gap-3 bg-background">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        {/* Messages Skeleton */}
        <div className="flex-1 p-4 space-y-4 overflow-auto">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-16 w-48 rounded-xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
        {/* Fixed Input Skeleton */}
        <div className="flex-none p-4 border-t border-border bg-background">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Conversation not found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-none p-4 border-b border-border flex items-center gap-3 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar
          className="cursor-pointer"
          onClick={() =>
            profile && router.push(`/profile/${conversation.aiProfileId}`)
          }
        >
          <AvatarImage src={profile?.avatarUrl ?? undefined} />
          <AvatarFallback>{profile?.name?.[0] ?? "?"}</AvatarFallback>
        </Avatar>
        <div
          className="cursor-pointer flex-1"
          onClick={() =>
            profile && router.push(`/profile/${conversation.aiProfileId}`)
          }
        >
          <p className="font-semibold">{profile?.name ?? "AI"}</p>
        </div>
      </div>

      {/* Scrollable Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4">
        {isLoadingMessages ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-16 w-48 rounded-xl" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-12 w-40 rounded-xl" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-lg font-semibold mb-2">Start a conversation</p>
              <p className="text-muted-foreground">
                Say hello to {profile?.name ?? "your AI companion"}!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const parsed = parseMessageContent(msg.content);

              return (
                <div
                  key={msg._id}
                  className={cn("flex gap-2", isUser && "justify-end")}
                >
                  {!isUser && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={profile?.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        {profile?.name?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm",
                    )}
                  >
                    {parsed.type === "image" ? (
                      <img
                        src={parsed.imageUrl}
                        alt="AI generated"
                        className="max-w-full rounded-lg"
                      />
                    ) : parsed.type === "quiz" ? (
                      <div>
                        <p className="font-medium mb-2">{parsed.question}</p>
                        <div className="space-y-1">
                          {parsed.options?.map((opt: string, i: number) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-foreground"
                              onClick={() => {
                                setMessage(opt);
                                setTimeout(() => handleSend(), 100);
                              }}
                            >
                              {opt}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{parsed.content}</p>
                    )}
                    <p
                      className={cn(
                        "text-xs mt-1",
                        isUser
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatTime(msg._creationTime)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Input Box */}
      <div className="flex-none p-4 border-t border-border bg-background">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!message.trim() || isSending}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
