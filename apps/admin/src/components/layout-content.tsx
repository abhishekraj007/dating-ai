"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { AuthenticatedLayout } from "@/components/authenticated-layout";
import { usePathname } from "next/navigation";

const publicRoutes = ["/", "/auth"];

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip"
  );
  const pathname = usePathname();
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname?.startsWith("/auth/");

  // Public routes - show without layout
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Not authenticated - show without layout (will redirect to login)
  if (!authLoading && !isAuthenticated) {
    return <>{children}</>;
  }

  // Auth is loading - show authenticated layout (with skeleton)
  // This keeps the sidebar visible during initial auth check
  if (authLoading) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }

  // User data is loading - show authenticated layout (with skeleton)
  // This keeps the sidebar visible while fetching user profile
  if (userData === undefined) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }

  // Confirmed not admin - show without layout (will redirect)
  if (!userData?.profile?.isAdmin) {
    return <>{children}</>;
  }

  // Authenticated admin - show full layout
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
