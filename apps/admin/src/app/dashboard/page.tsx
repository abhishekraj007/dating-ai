"use client";

import { api } from "@dating-ai/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { ProtectedRoute } from "@/components/protected-route";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileGeneratorButton } from "./_components/profile-generator-button";
import { useProfileGenerator } from "./_hooks/use-profile-generator";

export default function DashboardPage() {
  const userData = useQuery(api.user.fetchUserAndProfile);
  const { isGenerating, triggerProfileGeneration } = useProfileGenerator();

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <ProfileGeneratorButton
            isGenerating={isGenerating}
            onGenerate={triggerProfileGeneration}
          />
        </div>
        {userData === undefined ? (
          <Skeleton className="h-5 w-48" />
        ) : (
          <p className="text-muted-foreground">
            Welcome back,{" "}
            {userData?.profile?.name || userData?.userMetadata?.name}!
          </p>
        )}
      </div>
    </ProtectedRoute>
  );
}
