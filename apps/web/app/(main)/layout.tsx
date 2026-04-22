"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { PublicSidebar } from "@/components/public/public-sidebar";
import { PublicHeader } from "@/components/public/public-header";
import { SidebarProvider } from "@/components/public/sidebar-context";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();

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
      <div className="flex min-h-screen flex-col bg-background md:h-screen md:overflow-hidden">
        <Suspense
          fallback={
            <div className="h-[60px] border-b border-border/70 bg-background/90 md:hidden" />
          }
        >
          <PublicHeader />
        </Suspense>

        <div className="mx-auto flex w-full max-w-[1600px] flex-1 pb-24 md:h-screen md:min-h-0 md:pb-0">
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
