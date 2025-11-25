"use client";

import * as React from "react";
import {
  BookOpen,
  Home,
  LayoutDashboard,
  CheckSquare,
  CreditCard,
  Settings,
  LogOut,
  ChevronUp,
  User2,
  Upload,
  Users,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

const menuItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Characters",
    url: "/characters",
    icon: Users,
  },
  {
    title: "Uploads",
    url: "/uploads",
    icon: Upload,
  },
  {
    title: "Pricing",
    url: "/pricing",
    icon: CreditCard,
  },
];

export function AppSidebar({ isLoading = false }: { isLoading?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const userData = useQuery(api.user.fetchUserAndProfile);
  const premiumStatus = useQuery(api.features.premium.queries.isPremium);

  const userName =
    userData?.profile?.name || userData?.userMetadata?.name || "User";
  const userEmail = userData?.userMetadata?.email || "";
  const userImage = userData?.userMetadata?.image;

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Chating AI</span>
            {premiumStatus?.isPremium && (
              <span className="text-xs text-muted-foreground">Premium</span>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoading ? (
              <div className="flex items-center gap-2 p-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={userImage || undefined} alt={userName} />
                      <AvatarFallback className="rounded-lg">
                        {userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userEmail}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="top"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem asChild>
                    <a href="/settings">
                      <Settings />
                      Settings
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Button
                      onClick={() => {
                        authClient.signOut({
                          fetchOptions: {
                            onSuccess: () => {
                              router.push("/auth");
                            },
                          },
                        });
                      }}
                      variant={"link"}
                      className="w-full justify-start"
                    >
                      <LogOut />
                      Log out
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
