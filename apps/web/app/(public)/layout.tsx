import { Suspense } from "react";
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
      <div className="min-h-screen bg-background">
        <Suspense
          fallback={
            <div className="h-[60px] border-b border-border/70 bg-background/90" />
          }
        >
          <PublicHeader />
        </Suspense>
        <div className="mx-auto flex w-full max-w-[1600px] px-4 md:px-6 lg:px-8">
          <PublicSidebar />
          <main className="flex min-w-0 flex-1 flex-col gap-8 py-6 xl:pl-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
