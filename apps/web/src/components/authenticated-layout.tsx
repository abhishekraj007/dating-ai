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

  if (!userData) {
    return null;
  }

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Convex Starter</span>
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle />
                {!premiumStatus?.isPremium && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push("/pricing")}
                    className="hidden sm:flex"
                  >
                    Upgrade
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreditsModalOpen(true)}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  {userCredits?.credits ?? 0}
                </Button>
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
