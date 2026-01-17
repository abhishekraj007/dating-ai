"use client";

import { api } from "@dating-ai/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { ProtectedRoute } from "@/components/protected-route";

export default function DashboardPage() {
  const userData = useQuery(api.user.fetchUserAndProfile);

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back,{" "}
          {userData?.profile?.name || userData?.userMetadata?.name}!
        </p>
      </div>
    </ProtectedRoute>
  );
}
