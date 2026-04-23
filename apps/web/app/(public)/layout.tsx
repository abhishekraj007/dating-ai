import { Suspense } from "react";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { PublicHeader } from "@/components/public/public-header";
import { PublicSidebar } from "@/components/public/public-sidebar";
import { SidebarProvider } from "@/components/public/sidebar-context";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 pb-24 md:min-h-0 md:pb-0">
          <Suspense fallback={<div className="hidden md:flex md:w-72" />}>
            <PublicSidebar />
          </Suspense>
          <main className="flex min-w-0 flex-1 flex-col gap-8 px-4 py-6 md:min-h-0 md:overflow-y-auto md:px-6 lg:px-8">
            {children}
          </main>
        </div>
        <Suspense fallback={null}>
          <MobileBottomNav />
        </Suspense>
      </div>
    </SidebarProvider>
  );
}
