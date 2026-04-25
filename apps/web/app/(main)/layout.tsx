"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { PublicSidebar } from "@/components/public/public-sidebar";
import { PublicHeader } from "@/components/public/public-header";
import { SidebarProvider } from "@/components/public/sidebar-context";
import { cn } from "@/lib/utils";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Hide bottom nav padding when inside a chat conversation on mobile
  const isChatConversation =
    pathname.startsWith("/chat/") && pathname !== "/chat";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div
        className={cn(
          "flex flex-col bg-background md:h-screen md:overflow-hidden",
          isChatConversation
            ? "h-dvh overflow-hidden"
            : "min-h-screen",
        )}
      >
        {!isChatConversation && (
          <Suspense
            fallback={
              <div className="h-[60px] border-b border-border/70 bg-background/90 md:hidden" />
            }
          >
            <PublicHeader />
          </Suspense>
        )}

        <div
          className={cn(
            "mx-auto flex w-full max-w-[1600px] flex-1 min-h-0 md:h-screen md:pb-0",
            isChatConversation ? "pb-0" : "pb-24",
          )}
        >
          {/* Sidebar — hidden on mobile, visible md+ */}

          <PublicSidebar />

          {/* Main Content Area */}
          <main className="flex min-h-0 flex-1 overflow-hidden">
            {children}
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
