"use client";

import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";
import { CreditsModal } from "@/components/credits-modal";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";

export function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userData = useQuery(api.user.fetchUserAndProfile);
  const userCredits = useQuery(api.features.credits.queries.getUserCredits);
  const premiumStatus = useQuery(api.features.premium.queries.isPremium);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const sectionTitle =
    pathname === "/dashboard"
      ? "Dashboard"
      : pathname === "/characters"
        ? "Characters"
        : pathname === "/uploads"
          ? "Uploads"
          : pathname === "/app-config"
            ? "App Config"
            : "Admin";

  // Show loading skeleton while checking auth - keeps layout stable
  const isLoading = userData === undefined;

  return (
    <>
      <SidebarProvider>
        <AppSidebar isLoading={isLoading} />
        <SidebarInset>
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border/70 bg-background/95 px-4 backdrop-blur-sm">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Chating AI</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{sectionTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col overflow-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      <CreditsModal
        open={creditsModalOpen}
        onOpenChange={setCreditsModalOpen}
      />
    </>
  );
}
