"use client";

import { api } from "@dating-ai/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { ProtectedRoute } from "@/components/protected-route";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileGeneratorButton } from "./_components/profile-generator-button";
import { useProfileGenerator } from "./_hooks/use-profile-generator";
import { PageShell } from "@/components/admin/page-shell";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatChip } from "@/components/admin/stat-chip";

export default function DashboardPage() {
  const userData = useQuery(api.user.fetchUserAndProfile);
  const jobs = useQuery(
    (api as any).features.ai.profileGeneration.getProfileGenerationJobs,
    {},
  ) as Array<{ status?: string }> | null | undefined;
  const { isGenerating, triggerProfileGeneration } = useProfileGenerator();
  const runningCount =
    jobs?.filter((job) => job.status === "queued" || job.status === "processing")
      .length ?? 0;
  const failedCount = jobs?.filter((job) => job.status === "failed").length ?? 0;

  return (
    <ProtectedRoute>
      <PageShell>
        <PageHeader
          title="Dashboard"
          subtitle="Overview of admin operations and profile generation health."
          actions={
            <ProfileGeneratorButton
              isGenerating={isGenerating}
              onGenerate={triggerProfileGeneration}
            />
          }
        />
        <div className="mb-6 flex flex-wrap gap-2">
          <StatChip label="running jobs" value={runningCount} />
          <StatChip label="failed jobs" value={failedCount} variant={failedCount > 0 ? "destructive" : "outline"} />
        </div>
        {userData === undefined ? (
          <Skeleton className="h-5 w-48" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Welcome back, {userData?.profile?.name || userData?.userMetadata?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use this panel to trigger new profile generation manually and monitor generation quality from the Characters page.
              </p>
            </CardContent>
          </Card>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}
