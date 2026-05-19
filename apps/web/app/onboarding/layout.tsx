"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  return <div className="min-h-svh bg-background text-foreground">{children}</div>;
}
