"use client";

import { cn } from "@/lib/utils";

type SampleBubble = {
  from: "them" | "you";
  text: string;
  avatarUrl?: string | null;
};

type SampleChatPreviewProps = {
  bubbles: SampleBubble[];
  className?: string;
};

export function SampleChatPreview({
  bubbles,
  className,
}: SampleChatPreviewProps) {
  return (
    <div className={cn("flex w-full flex-col gap-2.5", className)}>
      {bubbles.map((bubble, index) => {
        const isYou = bubble.from === "you";

        return (
          <div
            key={`${bubble.from}-${index}`}
            className={cn(
              "flex max-w-[92%] items-end gap-2 animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
              isYou ? "self-end" : "self-start",
            )}
            style={{ animationDelay: `${180 + index * 220}ms` }}
          >
            {!isYou && bubble.avatarUrl ? (
              <img
                src={bubble.avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : null}
            <div
              className={cn(
                "rounded-[20px] px-3.5 py-2.5 text-[15px] font-medium leading-5",
                isYou
                  ? "rounded-br-md bg-white text-zinc-900"
                  : "rounded-bl-md bg-white/14 text-white",
              )}
            >
              {bubble.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
