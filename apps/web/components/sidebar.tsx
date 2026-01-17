"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { useConversations } from "@/hooks/use-conversations";
import { useAIProfiles } from "@/hooks/use-ai-profiles";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Compass, Settings, LogOut, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Tab = "chats" | "explore";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<Tab>(
    pathname.includes("/explore") ? "explore" : "chats"
  );

  const userData = useQuery(api.user.fetchUserAndProfile);
  const { conversations, isLoading: isLoadingConversations } =
    useConversations();
  const { profiles, isLoading: isLoadingProfiles } = useAIProfiles({
    limit: 20,
    excludeExistingConversations: true,
  });

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "explore") {
      router.push("/explore");
    }
  };

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  const handleProfileClick = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays < 7) {
      return formatDistanceToNow(date, { addSuffix: false });
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <aside className="w-80 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">StatusAI</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      <Separator />

      {/* Tabs */}
      <div className="flex p-2 gap-1">
        <Button
          variant={activeTab === "chats" ? "default" : "ghost"}
          className={cn(
            "flex-1 gap-2",
            activeTab === "chats" && "bg-primary text-primary-foreground"
          )}
          onClick={() => handleTabChange("chats")}
        >
          <MessageCircle className="h-4 w-4" />
          Chats
        </Button>
        <Button
          variant={activeTab === "explore" ? "default" : "ghost"}
          className={cn(
            "flex-1 gap-2",
            activeTab === "explore" && "bg-primary text-primary-foreground"
          )}
          onClick={() => handleTabChange("explore")}
        >
          <Compass className="h-4 w-4" />
          Explore
        </Button>
      </div>

      <Separator />

      {/* List Area */}
      <ScrollArea className="flex-1">
        {activeTab === "chats" ? (
          // Conversations List
          isLoadingConversations ? (
            <div className="p-2 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start chatting from Explore!</p>
            </div>
          ) : (
            <div className="p-1">
              {conversations.map((conv) => (
                <button
                  key={conv._id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left",
                    pathname.includes(conv._id) && "bg-accent"
                  )}
                  onClick={() => handleConversationClick(conv._id)}
                >
                  <Avatar>
                    <AvatarImage src={conv.profile?.avatarUrl} />
                    <AvatarFallback>
                      {conv.profile?.name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {conv.profile?.name ?? "AI"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage?.content || "Start a conversation"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : // Profiles List (for Explore tab in sidebar)
        isLoadingProfiles ? (
          <div className="p-2 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">No profiles found</p>
          </div>
        ) : (
          <div className="p-1">
            {profiles.slice(0, 10).map((profile) => (
              <button
                key={profile._id}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left",
                  pathname.includes(profile._id) && "bg-accent"
                )}
                onClick={() => handleProfileClick(profile._id)}
              >
                <Avatar>
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback>{profile.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {profile.name}
                    {profile.age ? `, ${profile.age}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {profile.zodiacSign || profile.occupation || "View profile"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* User Info & Sign Out */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {userData?.profile?.name?.[0] ||
                userData?.userMetadata?.name?.[0] ||
                "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate max-w-[120px]">
            {userData?.profile?.name || userData?.userMetadata?.name || "User"}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
