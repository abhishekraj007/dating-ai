"use client";

import { usePathname } from "next/navigation";
import { ConversationList } from "@/components/chat/conversation-list";
import { cn } from "@/lib/utils";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // On mobile: if we're at /chat exactly, show list only; if /chat/[id], show chat only
  const isListRoute = pathname === "/chat";

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      {/* Conversation list panel */}
      <div
        className={cn(
          "flex min-h-0 w-full flex-col border-r border-border bg-background transition-all md:w-80 md:flex",
          // Mobile: show list when at /chat, hide when in a conversation
          isListRoute ? "flex" : "hidden md:flex",
        )}
      >
        <ConversationList />
      </div>

      {/* Chat / content panel */}
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col overflow-hidden",
          // Mobile: show content when in a conversation, hide when at /chat
          isListRoute ? "hidden md:flex" : "flex",
        )}
      >
        {children}
      </div>
    </div>
  );
}
