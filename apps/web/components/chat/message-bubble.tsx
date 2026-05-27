import { useState } from "react";
import { Camera, Loader2, LogOut, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatImageBubble } from "@/components/chat/chat-image-bubble";
import { ChatVideoBubble } from "@/components/chat/chat-video-bubble";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { Skeleton } from "@/components/ui/skeleton";

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
  messageOrder?: number;
  isQuizActive?: boolean;
  onQuizAnswer?: (answer: string) => void;
  onEndQuiz?: () => void;
  onDelete?: (order: number) => void;
}

type StructuredPayload = {
  type: string;
  message?: string;
  prompt?: string;
  caption?: string;
  imageUrl?: string;
  imageKey?: string;
  videoUrl?: string;
  videoKey?: string;
  posterUrl?: string;
  posterKey?: string;
  question?: string;
  options?: string[];
  explanation?: string;
  isCorrect?: boolean;
  requestId?: string;
};

function parseStructuredContent(content: string): StructuredPayload | null {
  try {
    const parsed = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.type === "string"
    ) {
      return parsed as StructuredPayload;
    }
  } catch {
    // plain text
  }
  return null;
}

function parseContent(content: string) {
  const structured = parseStructuredContent(content);

  if (!structured) {
    return { kind: "text" as const, text: content };
  }

  if (structured.type === "video_response") {
    return {
      kind: "video" as const,
      videoUrl: structured.videoUrl,
      videoKey: structured.videoKey,
      posterUrl: structured.posterUrl,
      posterKey: structured.posterKey,
      text: structured.prompt,
    };
  }

  if (structured.type === "video_processing") {
    return {
      kind: "video_processing" as const,
      text: "Recording a video...",
    };
  }

  if (structured.type === "video_failed") {
    return {
      kind: "media_failed" as const,
      text:
        structured.message ||
        "Sorry, I couldn't record that video right now. My camera seems to be acting up!",
    };
  }

  if (structured.type === "image_response") {
    return {
      kind: "image" as const,
      imageUrl: structured.imageUrl,
      imageKey: structured.imageKey,
      text: structured.caption || structured.prompt,
    };
  }

  if (structured.type === "image_processing") {
    return {
      kind: "image_processing" as const,
      text: "Taking a photo...",
    };
  }

  if (structured.type === "image_failed") {
    return {
      kind: "media_failed" as const,
      text:
        structured.message ||
        "Oops, I couldn't take that photo right now. My camera seems to be acting up!",
    };
  }

  if (structured.type === "chat_error") {
    return {
      kind: "error" as const,
      text: structured.message || "Something went wrong",
    };
  }

  if (structured.type === "video_request") {
    return {
      kind: "video_request" as const,
      text: structured.message || structured.prompt || "Send me a video",
    };
  }

  if (structured.type === "image_request") {
    return {
      kind: "image_request" as const,
      text: structured.message || structured.prompt || "Send me a selfie",
    };
  }

  if (structured.type === "quiz_question") {
    return {
      kind: "quiz_question" as const,
      message: structured.message,
      question: structured.question,
      options: Array.isArray(structured.options) ? structured.options : [],
    };
  }

  if (
    structured.type === "quiz_start" ||
    structured.type === "quiz_end" ||
    structured.type === "quiz_answer_check"
  ) {
    return {
      kind: "quiz_state" as const,
      text: structured.message || "",
      state: structured.type,
    };
  }

  if (structured.type === "quiz_answer_result") {
    return {
      kind: "quiz_result" as const,
      text: structured.message || "",
      explanation: structured.explanation,
      isCorrect: structured.isCorrect,
    };
  }

  return { kind: "text" as const, text: content };
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderTextContent(content: string | undefined, isUser: boolean) {
  if (!content) {
    return null;
  }

  if (isUser) {
    return content;
  }

  return <ChatMarkdown content={content} />;
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
  messageOrder,
  isQuizActive = false,
  onQuizAnswer,
  onEndQuiz,
  onDelete,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const parsed = parseContent(content);
  const [isHovered, setIsHovered] = useState(false);
  const assistantBubbleClass =
    "rounded-bl-lg bg-muted text-foreground ring-1 ring-black/6 dark:ring-white/6";
  const bubbleClassName = cn(
    "rounded-3xl px-4 py-2.5 text-sm leading-relaxed text-pretty shadow-[0_10px_24px_-20px_rgba(0,0,0,0.55)]",
    isUser
      ? "rounded-br-lg bg-primary text-primary-foreground"
      : assistantBubbleClass,
    isStreaming && "animate-pulse",
  );

  return (
    <div
      className={cn(
        "flex items-end gap-2 px-3 py-1.5 md:px-4",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
      onMouseEnter={() => isUser && setIsHovered(true)}
      onMouseLeave={() => isUser && setIsHovered(false)}
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
        {parsed.kind === "video" &&
        (parsed.videoUrl || parsed.videoKey || parsed.posterKey) ? (
          <ChatVideoBubble
            videoKey={parsed.videoKey}
            videoUrl={parsed.videoUrl}
            posterKey={parsed.posterKey}
            posterUrl={parsed.posterUrl}
            isPremium={viewerIsPremium}
            profileName={profileName}
            profileAvatar={avatarUrl}
            viewerName={viewerName}
            viewerEmail={viewerEmail}
            viewerAuthUserId={viewerAuthUserId}
          />
        ) : parsed.kind === "image" && (parsed.imageUrl || parsed.imageKey) ? (
          <ChatImageBubble
            imageKey={parsed.imageKey}
            imageUrl={parsed.imageUrl}
            // caption={parsed.text}
            isPremium={viewerIsPremium}
            profileName={profileName}
            profileAvatar={avatarUrl}
            viewerName={viewerName}
            viewerEmail={viewerEmail}
            viewerAuthUserId={viewerAuthUserId}
          />
        ) : parsed.kind === "video_processing" ? (
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-black/10 dark:ring-white/10">
            <Skeleton className="h-[280px] w-[250px] rounded-3xl animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {parsed.text}
            </p>
          </div>
        ) : parsed.kind === "image_processing" ? (
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-black/10 dark:ring-white/10">
            <Skeleton className="h-[280px] w-[250px] rounded-3xl animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {parsed.text}
            </p>
          </div>
        ) : parsed.kind === "media_failed" ? (
          <div className="rounded-3xl rounded-bl-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive shadow-sm">
            {renderTextContent(parsed.text, isUser)}
          </div>
        ) : parsed.kind === "video_request" ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-3xl px-4 py-3 text-sm shadow-[0_10px_24px_-20px_rgba(0,0,0,0.55)]",
              isUser
                ? "rounded-br-lg bg-primary text-primary-foreground"
                : "rounded-bl-lg bg-muted text-foreground ring-1 ring-black/6 dark:ring-white/6",
            )}
          >
            <span>{renderTextContent(parsed.text, isUser)}</span>
          </div>
        ) : parsed.kind === "image_request" ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-3xl px-4 py-3 text-sm shadow-[0_10px_24px_-20px_rgba(0,0,0,0.55)]",
              isUser
                ? "rounded-br-lg bg-primary text-primary-foreground"
                : "rounded-bl-lg bg-muted text-foreground ring-1 ring-black/6 dark:ring-white/6",
            )}
          >
            <span>{renderTextContent(parsed.text, isUser)}</span>
          </div>
        ) : parsed.kind === "error" ? (
          <div className="rounded-3xl rounded-bl-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive shadow-sm">
            {renderTextContent(parsed.text, isUser)}
          </div>
        ) : parsed.kind === "quiz_question" ? (
          <div className={bubbleClassName}>
            <div className="space-y-3">
              <div className="leading-6">
                {renderTextContent(
                  parsed.question || parsed.message || "Quiz time",
                  isUser,
                )}
              </div>
              {isQuizActive && parsed.options.length > 0 ? (
                <div className="space-y-2">
                  {parsed.options.map((option: string, index: number) => (
                    <button
                      key={`${option}-${index}`}
                      type="button"
                      onClick={() => onQuizAnswer?.(option)}
                      disabled={!onQuizAnswer}
                      className="flex w-full items-center rounded-2xl border border-border/70 bg-background/50 px-3 py-2 text-left text-sm transition-colors hover:bg-background/80 disabled:cursor-default disabled:opacity-100"
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </button>
                  ))}
                </div>
              ) : null}
              {isQuizActive && onEndQuiz ? (
                <button
                  type="button"
                  onClick={onEndQuiz}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-background/70"
                >
                  <LogOut className="h-4 w-4" />
                  End quiz
                </button>
              ) : null}
            </div>
          </div>
        ) : parsed.kind === "quiz_result" ? (
          <div className={bubbleClassName}>
            <div className="space-y-2">
              {parsed.text ? renderTextContent(parsed.text, isUser) : null}
              {parsed.explanation ? (
                <div className="text-muted-foreground">
                  {renderTextContent(parsed.explanation, isUser)}
                </div>
              ) : null}
            </div>
          </div>
        ) : parsed.kind === "quiz_state" ? (
          <div className={bubbleClassName}>
            {renderTextContent(
              parsed.text ||
                (parsed.state === "quiz_start"
                  ? "Quiz started"
                  : parsed.state === "quiz_end"
                    ? "Quiz ended"
                    : "Checking answer"),
              isUser,
            )}
          </div>
        ) : (
          <div className={bubbleClassName}>
            {renderTextContent(parsed.text, isUser)}
            {isStreaming && (
              <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-current opacity-70" />
            )}
          </div>
        )}

        {/* Delete button — always visible on mobile, hover-only on md+ */}
        {isUser && onDelete && messageOrder !== undefined && (
          <button
            onClick={() => onDelete(messageOrder)}
            aria-label="Delete message"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/60",
              "transition-[opacity,color] hover:text-destructive",
              "md:opacity-0",
              isHovered && "md:opacity-100",
            )}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
