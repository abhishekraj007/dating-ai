"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function PublicHeaderAccountMenu() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, startSignOut] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || isPending) {
    return (
      <Button disabled variant="outline">
        Account
      </Button>
    );
  }

  if (!isAuthenticated) {
    return <OpenAuthModalButton variant="outline">Login</OpenAuthModalButton>;
  }

  const user = getUserLabel(session);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2 rounded-full pl-1.5 pr-2" variant="outline">
          <Avatar size="sm">
            {session?.user.image ? (
              <AvatarImage alt={user.title} src={session.user.image} />
            ) : null}
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-28 truncate sm:inline-block">
            {user.title}
          </span>
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
