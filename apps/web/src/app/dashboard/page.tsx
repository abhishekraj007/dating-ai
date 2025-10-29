"use client";

import { api } from "@convex-starter/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const userData = useQuery(api.user.fetchUserAndProfile);
  const hasCheckedAuth = useRef(false);

  console.log("Dashboard", { userData });

  useEffect(() => {
    // Only redirect if we've loaded and confirmed user is null
    if (
      userData !== undefined &&
      userData === null &&
      !hasCheckedAuth.current
    ) {
      hasCheckedAuth.current = true;
      router.push("/auth");
    }
  }, [userData, router]);

  if (userData === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (userData === null) {
    return null;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
    </div>
  );
}
