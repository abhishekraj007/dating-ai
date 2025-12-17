"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Compass, Settings, LogOut, Heart } from "lucide-react";

type Tab = "chats" | "explore";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<Tab>(
    pathname.includes("/explore") ? "explore" : "chats"
  );

  const userData = useQuery(api.user.fetchUserAndProfile);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.push(tab === "chats" ? "/" : "/explore");
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
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

      {/* List Area - will be populated by child routes */}
      <div className="flex-1 overflow-auto p-2">
        <div className="text-center text-muted-foreground py-8">
          {activeTab === "chats" ? (
            <p className="text-sm">Your conversations will appear here</p>
          ) : (
            <p className="text-sm">Explore AI profiles</p>
          )}
        </div>
      </div>

      <Separator />

      {/* User Info & Sign Out */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium">
              {userData?.profile?.name?.[0] ||
                userData?.userMetadata?.name?.[0] ||
                "U"}
            </span>
          </div>
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
