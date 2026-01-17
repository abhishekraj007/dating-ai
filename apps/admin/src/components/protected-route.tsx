"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    async function checkAccess() {
      // Still loading auth state
      if (authLoading) return;

      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        router.push("/");
        return;
      }

      // Still loading user data
      if (userData === undefined) return;

      // Not an admin - sign out and redirect
      if (!userData?.profile?.isAdmin) {
        await authClient.signOut();
        toast.error("Access denied. Admin privileges required.");
        router.push("/");
      }
    }

    checkAccess();
  }, [authLoading, isAuthenticated, userData, router]);

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
