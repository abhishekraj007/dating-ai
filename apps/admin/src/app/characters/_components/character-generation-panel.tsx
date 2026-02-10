"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, Plus, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

type FailedJob = {
  _id: string;
  status?: "queued" | "processing" | "completed" | "failed";
  source?: "manual" | "cron";
  errorMessage?: string;
  createdAt?: number;
  completedAt?: number;
  selectedGender?: "female" | "male";
  retriedAt?: number;
};

interface CharacterGenerationPanelProps {
  totalCharacters: number;
  isGenerating: boolean;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  jobs: FailedJob[];
  onRetryFailed: (jobId: string) => Promise<void>;
  onGenerate: () => Promise<void>;
}

export function CharacterGenerationPanel({
  totalCharacters,
  isGenerating,
  runningCount,
  completedCount,
  failedCount,
  jobs,
  onRetryFailed,
  onGenerate,
}: CharacterGenerationPanelProps) {
  const hasRunningJobs = runningCount > 0;
  const [isJobsOpen, setIsJobsOpen] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState<"all" | "failed" | "running">(
    "all",
  );

  const filteredJobs = jobs.filter((job) => {
    if (jobFilter === "failed")
      return job.status === "failed" && !job.retriedAt;
    if (jobFilter === "running")
      return job.status === "queued" || job.status === "processing";
    return true;
  });

  const copyError = async (message: string | undefined) => {
    try {
      await navigator.clipboard.writeText(
        message || "No error reason provided.",
      );
      toast.success("Error copied");
    } catch {
      toast.error("Failed to copy error");
    }
  };

  const handleRetry = async (jobId: string) => {
    setRetryingJobId(jobId);
    try {
      await onRetryFailed(jobId);
    } finally {
      setRetryingJobId(null);
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold">Characters</h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-sm text-muted-foreground sm:whitespace-nowrap">
            {totalCharacters} system characters
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={hasRunningJobs ? "default" : "secondary"}>
              {hasRunningJobs
                ? `${runningCount} creating`
                : "No active generation"}
              {hasRunningJobs && <Spinner />}
            </Badge>
            <Badge variant="outline">{completedCount} completed</Badge>
            {failedCount > 0 && (
              <Badge variant="destructive">{failedCount} failed</Badge>
            )}
          </div>
          <Sheet open={isJobsOpen} onOpenChange={setIsJobsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <ListChecks className="mr-2 h-4 w-4" />
                Generation Jobs
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xl">
              <SheetHeader>
                <SheetTitle>Generation Jobs</SheetTitle>
                <SheetDescription>
                  Track recent generation attempts, inspect failures, and retry.
                </SheetDescription>
              </SheetHeader>

              <div className="px-4 pb-4">
                <div className="mb-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={jobFilter === "all" ? "default" : "outline"}
                    onClick={() => setJobFilter("all")}
                    className="h-7 px-3"
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={jobFilter === "running" ? "default" : "outline"}
                    onClick={() => setJobFilter("running")}
                    className="h-7 px-3"
                  >
                    Running
                  </Button>
                  <Button
                    size="sm"
                    variant={jobFilter === "failed" ? "default" : "outline"}
                    onClick={() => setJobFilter("failed")}
                    className="h-7 px-3"
                  >
                    Failed
                  </Button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto space-y-2 pr-1">
                  {filteredJobs.length === 0 ? (
                    <div className="rounded-md border border-border/60 p-3 text-sm text-muted-foreground">
                      No jobs found for this filter.
                    </div>
                  ) : (
                    filteredJobs.map((job) => {
                      const created = job.createdAt
                        ? new Date(job.createdAt).toLocaleString()
                        : "Unknown time";
                      const isFailed = job.status === "failed";
                      const isRetried = Boolean(job.retriedAt);
                      const retriedAtLabel = job.retriedAt
                        ? new Date(job.retriedAt).toLocaleString()
                        : "unknown time";
                      const isRunning =
                        job.status === "queued" || job.status === "processing";
                      const statusLabel = job.status ?? "unknown";

                      return (
                        <div
                          key={job._id}
                          className="rounded border border-border/40 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {job.source === "cron" ? "Cron" : "Manual"} •{" "}
                              {created}
                            </p>
                            <Badge
                              variant={
                                isFailed && !isRetried
                                  ? "destructive"
                                  : isRunning
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {isRetried ? "retried" : statusLabel}
                              {isRunning && <Spinner />}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground break-words">
                            {isFailed
                              ? isRetried
                                ? `Retried on ${retriedAtLabel}`
                                : job.errorMessage ||
                                  "No error reason provided."
                              : isRunning
                                ? "Generation in progress..."
                                : "Completed"}
                          </p>
                          {isFailed && !isRetried && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyError(job.errorMessage)}
                              >
                                Copy Error
                              </Button>
                              <Button
                                size="sm"
                                disabled={retryingJobId === job._id}
                                onClick={() => handleRetry(job._id)}
                              >
                                {retryingJobId === job._id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Retry
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Character
          </Button>
        </div>
      </div>
    </div>
  );
}
