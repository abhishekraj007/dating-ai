import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatImageBubble } from "@/components/chat/chat-image-bubble";

interface MessageBubbleProps {
  content: string;
  role: string;
  timestamp: number;
  avatarUrl?: string;
  profileName?: string;
  isStreaming?: boolean;
  viewerIsPremium?: boolean;
  viewerName?: string | null;
  viewerEmail?: string | null;
  viewerAuthUserId?: string | null;
}

function parseContent(content: string) {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && parsed.type) {
      if (parsed.type === "image_response") {
        return {
          kind: "image" as const,
          imageUrl: parsed.imageUrl as string | undefined,
          imageKey: parsed.imageKey as string | undefined,
          text:
            (parsed.caption as string | undefined) ||
            (parsed.prompt as string | undefined),
        };
      }
      if (parsed.type === "chat_error") {
        return {
          kind: "error" as const,
          text: (parsed.message as string) || "Something went wrong",
        };
      }
      if (parsed.type === "image_request") {
        return {
          kind: "image_request" as const,
          text:
            (parsed.message as string | undefined) ||
            (parsed.prompt as string | undefined) ||
            "Send me a selfie",
        };
      }
      // quiz types and others — render empty (skip rendering)
      if (
        parsed.type === "quiz_question" ||
        parsed.type === "quiz_start" ||
        parsed.type === "quiz_end" ||
        parsed.type === "quiz_answer_result"
      ) {
        return { kind: "skip" as const };
      }
      return { kind: "text" as const, text: content };
    }
  } catch {
    // plain text
  }
  return { kind: "text" as const, text: content };
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({
  content,
  role,
  timestamp,
  avatarUrl,
  profileName,
  isStreaming,
  viewerIsPremium = false,
  viewerName,
  viewerEmail,
  viewerAuthUserId,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const parsed = parseContent(content);

  if (parsed.kind === "skip") return null;

  return (
    <div
      className={cn(
        "flex items-end gap-2 px-3 py-1.5 md:px-4",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {!isUser && (
        <Avatar className="mb-0.5 h-8 w-8 shrink-0 ring-1 ring-black/10 dark:ring-white/10">
          <AvatarImage src={avatarUrl} alt={profileName} />
          <AvatarFallback className="text-xs">
            {profileName?.[0] ?? "AI"}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        {parsed.kind === "image" && (parsed.imageUrl || parsed.imageKey) ? (
          <ChatImageBubble
            imageKey={parsed.imageKey}
            imageUrl={parsed.imageUrl}
            caption={parsed.text}
            isPremium={viewerIsPremium}
            profileName={profileName}
            profileAvatar={avatarUrl}
            viewerName={viewerName}
            viewerEmail={viewerEmail}
            viewerAuthUserId={viewerAuthUserId}
          />
        ) : parsed.kind === "image_request" ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-3xl px-4 py-3 text-sm shadow-[0_10px_24px_-20px_rgba(0,0,0,0.55)]",
              isUser
                ? "rounded-br-lg bg-primary text-primary-foreground"
                : "rounded-bl-lg bg-muted text-foreground ring-1 ring-black/6 dark:ring-white/6",
            )}
          >
            <Camera className="h-4 w-4 shrink-0" />
            <span>{parsed.text}</span>
          </div>
        ) : parsed.kind === "error" ? (
          <div className="rounded-3xl rounded-bl-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive shadow-sm">
            {parsed.text}
          </div>
        ) : (
          <div
            className={cn(
              "rounded-3xl px-4 py-2.5 text-sm leading-relaxed text-pretty shadow-[0_10px_24px_-20px_rgba(0,0,0,0.55)]",
              isUser
                ? "rounded-br-lg bg-primary text-primary-foreground"
                : "rounded-bl-lg bg-muted text-foreground ring-1 ring-black/6 dark:ring-white/6",
              isStreaming && "animate-pulse",
            )}
          >
            {parsed.text}
            {isStreaming && (
              <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-current opacity-70" />
            )}
          </div>
        )}

        <span className="px-1 text-[10px] text-muted-foreground tabular-nums">
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
}
