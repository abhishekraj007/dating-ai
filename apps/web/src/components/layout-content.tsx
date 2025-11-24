"use client";

import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { AuthenticatedLayout } from "@/components/authenticated-layout";
import Header from "@/components/header";
import { usePathname } from "next/navigation";

const publicRoutes = ["/", "/pricing", "/auth/sign-in", "/auth/sign-up"];

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const userData = useQuery(api.user.fetchUserAndProfile);
  const pathname = usePathname();
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname?.startsWith("/auth/");

  // Show traditional header for public routes or non-authenticated users
  if (isPublicRoute || !userData) {
    return (
      <div className="grid grid-rows-[auto_1fr] h-svh">
        <Header />
        {children}
      </div>
    );
  }

  // Show sidebar layout for authenticated users on protected routes
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
