"use client";

import { useRef } from "react";
import { Camera, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isSending: boolean;
  disabled?: boolean;
  placeholder?: string;
  onOpenImageRequest?: () => void;
  isRequestingImage?: boolean;
  creditsBalance?: number | null;
}

export function ChatInput({
  onSend,
  isSending,
  disabled,
  placeholder = "Type a message...",
  onOpenImageRequest,
  isRequestingImage,
  creditsBalance,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const value = textareaRef.current?.value.trim();
    if (!value || isSending || disabled) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "44px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "44px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="border-t border-border/70 bg-background/95 px-3 py-3 shadow-[0_-10px_30px_-24px_rgba(0,0,0,0.55)] backdrop-blur md:px-4 md:py-4 dark:shadow-[0_-12px_30px_-24px_rgba(0,0,0,0.85)]">
      {onOpenImageRequest && (
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenImageRequest}
            disabled={disabled || isSending || isRequestingImage}
            className="h-9 shrink-0 rounded-full"
          >
            <Camera className="h-4 w-4" />
            {isRequestingImage ? "Requesting..." : "Selfie"}
          </Button>
          <Badge variant="outline" className="shrink-0 rounded-full px-3 py-1">
            {creditsBalance === undefined || creditsBalance === null
              ? "5 credits"
              : `${creditsBalance} credits`}
          </Badge>
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled || isSending}
          placeholder={placeholder}
          className={cn(
            "flex-1 resize-none rounded-3xl border border-input/70 bg-muted/55 px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
            "text-sm leading-relaxed text-pretty outline-none placeholder:text-muted-foreground",
            "focus:border-ring focus:ring-2 focus:ring-ring/30",
            "transition-[border-color,box-shadow,background-color] disabled:cursor-not-allowed disabled:opacity-50",
            "min-h-[44px] max-h-[160px] overflow-y-auto",
          )}
          style={{ height: "44px" }}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={disabled || isSending}
          className="h-11 w-11 shrink-0 rounded-3xl shadow-[0_10px_24px_-16px_rgba(0,0,0,0.7)] transition-transform active:scale-[0.96]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
