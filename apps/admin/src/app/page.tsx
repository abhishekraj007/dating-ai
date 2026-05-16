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
    isAuthenticated ? {} : "skip",
  );
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const isWaitingForUserData = isAuthenticated && userData === undefined;
  const pendingMessage = authLoading
    ? "Checking session..."
    : isWaitingForUserData || isCheckingAdmin
      ? "Verifying admin access..."
      : isAuthenticated && userData?.profile?.isAdmin
        ? "Opening dashboard..."
        : undefined;

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
      router.replace("/dashboard");
    }

    checkAdminAccess();
  }, [authLoading, isAuthenticated, userData, router]);

  return (
    <AuthScreen
      isPending={Boolean(pendingMessage)}
      pendingMessage={pendingMessage}
    />
  );
}
