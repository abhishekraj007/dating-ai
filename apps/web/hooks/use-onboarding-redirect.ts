"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";

export function useOnboardingRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );

  const isOnOnboarding = pathname.startsWith("/onboarding");
  const hasCompletedOnboarding = Boolean(
    userData?.profile?.hasCompletedOnboarding,
  );

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || userData === undefined) {
      return;
    }

    if (!hasCompletedOnboarding && !isOnOnboarding) {
      router.replace("/onboarding/languages");
      return;
    }

    if (hasCompletedOnboarding && isOnOnboarding) {
      router.replace("/");
    }
  }, [
    hasCompletedOnboarding,
    isAuthLoading,
    isAuthenticated,
    isOnOnboarding,
    router,
    userData,
  ]);
}
