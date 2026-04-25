"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useConversations,
  useStartConversation,
} from "@/hooks/use-conversations";
import { useAIProfiles } from "@/hooks/use-ai-profiles";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays < 7) {
    return formatDistanceToNow(date, { addSuffix: false });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ConversationList() {
  const pathname = usePathname();
  const router = useRouter();
  const { conversations, isLoading } = useConversations();
  const { profiles: newMatchProfiles, isLoading: isLoadingProfiles } =
    useAIProfiles({ limit: 12, excludeExistingConversations: true });
  const { startConversation } = useStartConversation();
  const [startingConvFor, setStartingConvFor] = useState<string | null>(null);

  const handleNewMatchClick = async (profileId: string) => {
    if (startingConvFor) return;
    setStartingConvFor(profileId);
    try {
      const convId = await startConversation({
        aiProfileId: profileId as Id<"aiProfiles">,
      });
      router.push(`/chat/${convId}`);
    } catch {
      // ignore
    } finally {
      setStartingConvFor(null);
    }
  };

  const validConversations = conversations.filter(
    (c): c is NonNullable<typeof c> => c !== null,
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background/95">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2">
          <h2 className="text-balance font-semibold">Chats</h2>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* New Matches */}
        {(isLoadingProfiles || newMatchProfiles.length > 0) && (
          <div className="shrink-0 border-b border-border/70">
            <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              New Matches
            </p>
            <div className="flex gap-3 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {isLoadingProfiles
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex shrink-0 flex-col items-center gap-1.5"
                    >
                      <Skeleton className="h-16 w-16 rounded-2xl" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  ))
                : newMatchProfiles.slice(0, 10).map((profile) => (
                    <button
                      key={profile._id}
                      onClick={() => handleNewMatchClick(profile._id)}
                      disabled={startingConvFor === profile._id}
                      className="flex shrink-0 flex-col items-center gap-1.5 rounded-[1.25rem] p-1 transition-[transform,opacity] hover:opacity-90 active:scale-[0.96] disabled:opacity-50"
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted shadow-[0_14px_26px_-20px_rgba(0,0,0,0.6)] ring-1 ring-black/10 dark:ring-white/10">
                        {profile.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profile.avatarUrl}
                            alt={profile.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg font-medium text-muted-foreground">
                            {profile.name[0]}
                          </div>
                        )}
                      </div>
                      <span className="w-16 truncate text-center text-xs text-foreground">
                        {profile.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
            </div>
          </div>
        )}

        {/* Conversations */}
        <div className="py-1">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-3 w-10 shrink-0" />
              </div>
            ))
          ) : validConversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                No conversations yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Click a match above to start chatting
              </p>
            </div>
          ) : (
            validConversations.map((conv) => {
              const isActive = pathname === `/chat/${conv._id}`;
              return (
                <Link
                  key={conv._id}
                  href={`/chat/${conv._id}`}
                  className={cn(
                    "mx-2 my-1 flex min-h-14 items-center gap-3 rounded-3xl px-3 py-3 transition-[transform,background-color,box-shadow] hover:bg-accent/70 active:scale-[0.96]",
                    isActive &&
                      "bg-accent shadow-[0_12px_24px_-22px_rgba(0,0,0,0.8)]",
                  )}
                >
                  <Avatar className="h-12 w-12 shrink-0 ring-1 ring-black/10 dark:ring-white/10">
                    <AvatarImage
                      src={conv.profile?.avatarUrl ?? undefined}
                      alt={conv.profile?.name}
                    />
                    <AvatarFallback>
                      {conv.profile?.name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {conv.profile?.name ?? "AI"}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {conv.lastMessage?.content || "Start a conversation"}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
