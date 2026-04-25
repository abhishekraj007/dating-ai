"use client";

import { useRef, useState, useEffect } from "react";
import { Plus, Camera, Video, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isSending: boolean;
  disabled?: boolean;
  placeholder?: string;
  characterName?: string;
  onRequestImage?: () => void;
  onRequestVideo?: () => void;
  isRequestingImage?: boolean;
}

const TYPING_SPEED = 60;
const ERASE_SPEED = 30;
const PAUSE_AFTER_TYPE = 2000;
const PAUSE_AFTER_ERASE = 400;

function useTypingPlaceholder(phrases: string[]) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (phrases.length === 0) return;
    const current = phrases[phraseIdx];

    if (isTyping) {
      if (displayed.length < current.length) {
        const t = setTimeout(
          () => setDisplayed(current.slice(0, displayed.length + 1)),
          TYPING_SPEED,
        );
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setIsTyping(false), PAUSE_AFTER_TYPE);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(
          () => setDisplayed(displayed.slice(0, -1)),
          ERASE_SPEED,
        );
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => {
          setPhraseIdx((i) => (i + 1) % phrases.length);
          setIsTyping(true);
        }, PAUSE_AFTER_ERASE);
        return () => clearTimeout(t);
      }
    }
  }, [displayed, isTyping, phraseIdx, phrases]);

  return displayed;
}

export function ChatInput({
  onSend,
  isSending,
  disabled,
  placeholder,
  characterName,
  onRequestImage,
  onRequestVideo,
  isRequestingImage,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const animatedPhrases = [
    characterName ? `Message ${characterName}` : "Write a message...",
    "Send me a selfie",
    "Let's play a quiz",
  ];
  const animatedPlaceholder = useTypingPlaceholder(animatedPhrases);
  const activePlaceholder = placeholder ?? animatedPlaceholder;

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

  const showAttachMenu = onRequestImage || onRequestVideo;

  return (
    <div className="relative bg-background/95 px-3 py-3 backdrop-blur md:px-4 md:py-4">
      {/* Scroll shadow gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-b from-transparent to-background/95"
      />
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          {showAttachMenu && (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={disabled || isSending}
                  className={cn(
                    "absolute left-1.5 bottom-3 z-10 flex h-8 w-8 items-center justify-center rounded-full",
                    "text-muted-foreground transition-[transform,background-color,color] duration-200 active:scale-[0.92]",
                    "hover:bg-accent hover:text-accent-foreground",
                    "disabled:pointer-events-none disabled:opacity-50",
                    isMenuOpen && "bg-accent text-accent-foreground",
                  )}
                >
                  <Plus
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isMenuOpen && "rotate-45",
                    )}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="mb-1">
                {onRequestImage && (
                  <DropdownMenuItem
                    onClick={onRequestImage}
                    disabled={isRequestingImage}
                  >
                    <Camera className="h-4 w-4" />
                    {isRequestingImage ? "Requesting..." : "Request selfie"}
                  </DropdownMenuItem>
                )}
                {onRequestVideo && (
                  <DropdownMenuItem onClick={onRequestVideo}>
                    <Video className="h-4 w-4" />
                    Request video
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled || isSending}
            placeholder={isFocused ? "Write a message..." : activePlaceholder}
            className={cn(
              "w-full resize-none rounded-3xl border border-input/70 bg-muted/55 py-2.5 pr-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
              "text-base leading-relaxed text-pretty outline-none placeholder:text-muted-foreground md:text-sm",
              "focus:border-ring focus:ring-2 focus:ring-ring/30",
              "transition-[border-color,box-shadow,background-color] disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[44px] max-h-[160px] overflow-y-auto",
              showAttachMenu ? "pl-11" : "pl-4",
            )}
            style={{ height: "44px" }}
          />
        </div>
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
