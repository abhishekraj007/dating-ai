"use client";

import AuthScreen from "@/components/auth-screen";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip"
  );
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminAccess() {
      if (authLoading || !isAuthenticated) return;
      if (userData === undefined) return; // Still loading

      setIsCheckingAdmin(true);

      // Check if user is admin
      if (!userData?.profile?.isAdmin) {
        // Sign out non-admin users
        await authClient.signOut();
        toast.error("Access denied. Admin privileges required.");
        setIsCheckingAdmin(false);
        return;
      }

      // Admin user - redirect to dashboard
      router.push("/dashboard");
    }

    checkAdminAccess();
  }, [authLoading, isAuthenticated, userData, router]);

  if (authLoading || isCheckingAdmin || (isAuthenticated && userData === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">
            {isCheckingAdmin ? "Verifying access..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && userData?.profile?.isAdmin) {
    return null; // Will redirect to dashboard
  }

  return <AuthScreen />;
}
