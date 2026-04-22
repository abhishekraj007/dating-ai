"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { ChevronDown, FileText, LogOut, Settings } from "lucide-react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { OpenAuthModalButton } from "@/components/auth/open-auth-modal-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const policyLinks = [
  {
    label: "Privacy Policy",
    href: "/privacy",
  },
  {
    label: "Terms of Service",
    href: "/terms",
  },
];

function getUserLabel(
  session: ReturnType<typeof authClient.useSession>["data"],
) {
  if (!session?.user) {
    return {
      title: "Account",
      subtitle: "Signed in",
      initials: "A",
    };
  }

  const title = session.user.name || session.user.email || "Account";
  const subtitle = session.user.email || "Signed in";
  const initialsSource = session.user.name || session.user.email || "A";
  const initials =
    initialsSource
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "A";

  return { title, subtitle, initials };
}

export function PublicHeaderAccountMenu({
  placement = "header",
}: {
  placement?: "header" | "sidebar";
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { data: session, isPending } = authClient.useSession();
  const userData = useQuery(api.user.fetchUserAndProfile);
  const [isSigningOut, startSignOut] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSidebar = placement === "sidebar";

  if (!mounted || isLoading || isPending) {
    return (
      <Button
        disabled
        variant="outline"
        className={cn(isSidebar && "h-12 w-full justify-start rounded-3xl")}
      >
        Account
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <OpenAuthModalButton
        variant="outline"
        className={cn(
          isSidebar &&
            "h-12 w-full justify-center rounded-3xl bg-primary text-primary-foreground hover:bg-primary/85",
        )}
      >
        Login
      </OpenAuthModalButton>
    );
  }

  const user = getUserLabel(session);
  const sidebarSubtitle = userData?.profile?.isPremium
    ? "Premium Member"
    : "Free Plan";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            "gap-2 rounded-full pl-1.5 pr-2",
            isSidebar && "h-auto w-full justify-between rounded-3xl px-3 py-3",
          )}
          variant="outline"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar size="sm">
              {session?.user.image ? (
                <AvatarImage alt={user.title} src={session.user.image} />
              ) : null}
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-left">
              <span
                className={cn(
                  "hidden max-w-28 truncate sm:inline-block",
                  isSidebar && "block max-w-full text-sm font-medium",
                )}
              >
                {user.title}
              </span>
              {isSidebar ? (
                <div className="text-xs text-muted-foreground">
                  {sidebarSubtitle}
                </div>
              ) : null}
            </div>
          </div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-1 px-2 py-2">
          <div className="truncate text-sm font-medium text-foreground">
            {user.title}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {user.subtitle}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileText className="size-4" />
            Policies
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {policyLinks.map((link) => (
              <DropdownMenuItem
                key={link.href}
                onSelect={() => router.push(link.href)}
              >
                {link.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={() => {
            startSignOut(async () => {
              await authClient.signOut();
              router.push("/");
              router.refresh();
            });
          }}
          variant="destructive"
        >
          <LogOut className="size-4" />
          {isSigningOut ? "Logging out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
