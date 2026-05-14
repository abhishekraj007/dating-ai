"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function AdminRouteSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6 sm:py-6"
      aria-busy="true"
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-border/60 pb-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-9 w-48 sm:h-10 sm:w-64" />
          <Skeleton className="h-4 w-72 max-w-full sm:h-5 sm:w-96" />
        </div>
        <Skeleton className="h-9 w-full sm:w-36" />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-7 w-32 rounded-full" />
        <Skeleton className="h-7 w-36 rounded-full" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );

  useEffect(() => {
    async function checkAccess() {
      // Still loading auth state
      if (authLoading) return;

      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        router.replace("/");
        return;
      }

      // Still loading user data
      if (userData === undefined) return;

      // Not an admin - sign out and redirect
      if (!userData?.profile?.isAdmin) {
        await authClient.signOut();
        toast.error("Access denied. Admin privileges required.");
        router.replace("/");
      }
    }

    checkAccess();
  }, [authLoading, isAuthenticated, userData, router]);

  if (authLoading || (isAuthenticated && userData === undefined)) {
    return <AdminRouteSkeleton />;
  }

  // Not authenticated - don't render children (will redirect)
  if (!authLoading && !isAuthenticated) {
    return null;
  }

  // Confirmed not admin - don't render (will redirect)
  if (userData !== undefined && !userData?.profile?.isAdmin) {
    return null;
  }

  // Render children - let each page handle its own loading state
  // The sidebar stays visible through AuthenticatedLayout
  return <>{children}</>;
}
