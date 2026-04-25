"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import {
  ArrowLeft,
  MoreVertical,
  Trash2,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatImageRequestDialog } from "@/components/chat/chat-image-request-dialog";
import { CreditsModal } from "@/components/credits-modal";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { useConversation } from "@/hooks/use-conversations";
import {
  useMessages,
  useSendMessage,
  useClearChat,
} from "@/hooks/use-messages";
import { useRequestChatImage } from "@/hooks/use-request-chat-image";
import { cn } from "@/lib/utils";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import { toast } from "sonner";

interface ChatViewProps {
  conversationId: string;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const router = useRouter();
  const { conversation, isLoading: isLoadingConversation } =
    useConversation(conversationId);
  const viewerData = useQuery(api.user.fetchUserAndProfile);
  const threadId = conversation?.threadId;
  const profile = (conversation as any)?.profile;
  const viewerProfile = viewerData?.profile;

  const { messages, isLoading, isLoadingMore, hasMore, loadMore, isAITyping } =
    useMessages(threadId);

  const { sendMessage } = useSendMessage();
  const { clearChat } = useClearChat();
  const { requestImage } = useRequestChatImage();

  const [isSending, setIsSending] = useState(false);
  const [isRequestingImage, setIsRequestingImage] = useState(false);
  const [isImageRequestOpen, setIsImageRequestOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isClearing, startClearTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const isFirstLoad = useRef(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && isFirstLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      isFirstLoad.current = false;
      return;
    }
    if (!showScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollToBottom]);

  // Reset first load flag when conversation changes
  useEffect(() => {
    isFirstLoad.current = true;
    setShowScrollToBottom(false);
  }, [conversationId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollToBottom(distFromBottom > 200);

    // Load more when scrolled near top
    if (el.scrollTop < 100 && hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  const handleSend = async (content: string) => {
    if (!conversation || isSending) return;
    setIsSending(true);
    try {
      await sendMessage({
        conversationId: conversationId as Id<"aiConversations">,
        content,
      });
    } catch {
      // error handled silently - user can retry
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    startClearTransition(async () => {
      await clearChat(conversationId);
    });
  };

  const handleImageRequest = async (options: {
    hairstyle?: string;
    clothing?: string;
    scene?: string;
    description?: string;
  }) => {
    if (!conversation || isRequestingImage) {
      return;
    }

    const creditsBalance = viewerProfile?.credits ?? 0;
    if (creditsBalance < 5) {
      setIsImageRequestOpen(false);
      setIsCreditsModalOpen(true);
      return;
    }

    setIsRequestingImage(true);

    try {
      await requestImage(conversationId, options);
      setIsImageRequestOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to request a selfie right now.";

      if (message.includes("Insufficient credits")) {
        setIsImageRequestOpen(false);
        setIsCreditsModalOpen(true);
      } else {
        toast.error(message);
      }
    } finally {
      setIsRequestingImage(false);
    }
  };

  if (isLoadingConversation) {
    return <ChatLoadingSkeleton />;
  }

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-4">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">Conversation not found</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/chat")}
        >
          Back to chats
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      {/* Full-screen avatar background */}
      {profile?.avatarUrl && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-background/40 px-3 py-3 backdrop-blur-xl md:px-4 dark:border-white/[0.08]">
        <Button
          variant="ghost"
          size="icon"
          className="min-h-10 min-w-10 rounded-2xl transition-transform active:scale-[0.96] md:hidden"
          onClick={() => router.push("/chat")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex flex-1 items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0 ring-1 ring-black/10 dark:ring-white/10">
            <AvatarImage src={profile?.avatarUrl} alt={profile?.name} />
            <AvatarFallback>{profile?.name?.[0] ?? "AI"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-balance font-semibold leading-tight">
              {profile?.name ?? "AI"}
            </p>
            {isAITyping ? (
              <p className="text-xs text-primary">typing...</p>
            ) : (
              <p className="text-xs text-muted-foreground">AI Companion</p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-10 min-w-10 shrink-0 rounded-2xl transition-transform active:scale-[0.96]"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleClearChat}
              disabled={isClearing}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div
        className="relative z-10 min-h-0 flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="relative z-[1] flex justify-center py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {isLoading ? (
          <div className="relative z-[1]">
            <MessagesSkeleton />
          </div>
        ) : messages.length === 0 ? (
          <div className="relative z-[1] flex h-full flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <Avatar className="h-16 w-16 ring-1 ring-black/10 dark:ring-white/10">
              <AvatarImage src={profile?.avatarUrl} alt={profile?.name} />
              <AvatarFallback className="text-2xl">
                {profile?.name?.[0] ?? "AI"}
              </AvatarFallback>
            </Avatar>
            <p className="text-balance font-semibold">
              {profile?.name ?? "AI"}
            </p>
            <p className="text-sm text-muted-foreground text-pretty">
              Say hello and start your conversation!
            </p>
          </div>
        ) : (
          <div className="relative z-[1] flex flex-col pb-2 pt-2">
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                content={msg.content}
                role={msg.role}
                timestamp={msg._creationTime}
                avatarUrl={profile?.avatarUrl}
                profileName={profile?.name}
                isStreaming={msg.isStreaming}
                viewerIsPremium={Boolean(viewerProfile?.isPremium)}
                viewerName={
                  viewerProfile?.name ?? viewerData?.userMetadata?.name ?? null
                }
                viewerEmail={viewerData?.userMetadata?.email ?? null}
                viewerAuthUserId={viewerProfile?.authUserId ?? null}
              />
            ))}
            {isAITyping && !messages[messages.length - 1]?.isStreaming && (
              <TypingIndicator />
            )}
          </div>
        )}

        <div ref={messagesEndRef} className="relative z-[1] h-1" />
      </div>

      {/* Scroll to bottom */}
      {showScrollToBottom && (
        <button
          onClick={() =>
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          aria-label="Scroll to latest message"
          className={cn(
            "absolute bottom-24 right-4 z-20 flex h-10 w-10 items-center justify-center",
            "rounded-full border border-border/70 bg-background/95 shadow-[0_16px_32px_-18px_rgba(0,0,0,0.65)] backdrop-blur",
            "transition-[transform,background-color,box-shadow] hover:bg-accent active:scale-[0.96]",
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {/* Input */}
      <div className="relative z-10">
        <ChatInput
          onSend={handleSend}
          isSending={isSending || isAITyping}
          disabled={isClearing}
          characterName={profile?.name}
          onRequestImage={() => setIsImageRequestOpen(true)}
          isRequestingImage={isRequestingImage}
        />
      </div>

      <ChatImageRequestDialog
        open={isImageRequestOpen}
        onOpenChange={setIsImageRequestOpen}
        onSubmit={handleImageRequest}
        isSubmitting={isRequestingImage}
        creditsBalance={viewerProfile?.credits ?? null}
        onBuyCredits={() => {
          setIsImageRequestOpen(false);
          setIsCreditsModalOpen(true);
        }}
      />

      <CreditsModal
        open={isCreditsModalOpen}
        onOpenChange={setIsCreditsModalOpen}
      />
    </div>
  );
}

function ChatLoadingSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-border/70 px-4 py-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <MessagesSkeleton />
      <div className="border-t border-border p-4">
        <Skeleton className="h-11 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {/* AI message */}
      <div className="flex items-end gap-2">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <Skeleton className="h-12 w-48 rounded-2xl rounded-bl-sm" />
      </div>
      {/* User message */}
      <div className="flex flex-row-reverse items-end gap-2">
        <Skeleton className="h-10 w-56 rounded-2xl rounded-br-sm" />
      </div>
      {/* AI message */}
      <div className="flex items-end gap-2">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <Skeleton className="h-16 w-64 rounded-2xl rounded-bl-sm" />
      </div>
      {/* User message */}
      <div className="flex flex-row-reverse items-end gap-2">
        <Skeleton className="h-10 w-40 rounded-2xl rounded-br-sm" />
      </div>
      {/* AI message */}
      <div className="flex items-end gap-2">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        <Skeleton className="h-12 w-52 rounded-2xl rounded-bl-sm" />
      </div>
    </div>
  );
}
