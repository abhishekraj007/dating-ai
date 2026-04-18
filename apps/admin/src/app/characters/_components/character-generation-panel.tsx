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
import { Loader2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { AddCharacterDialog } from "./add-character-dialog";
import { StatChip } from "@/components/admin/stat-chip";
import { StatusBadge } from "@/components/admin/status-badge";

type GenerateCharacterInput = {
  preferredGender?: "female" | "male";
  preferredOccupation?: string;
  preferredInterests?: string[];
  appearanceOverrides?: {
    skinTone?: string;
    hairColor?: string;
    hairStyle?: string;
    eyeColor?: string;
    build?: string;
    outfit?: string;
    vibe?: string;
    expression?: string;
  };
  referenceSubjectDescriptor?: string;
  referenceImageUrl?: string;
  preferredLocation?: string;
  culturalBackground?: string;
};

type InterestOption = {
  value: string;
  label: string;
  emoji?: string;
};

type FailedJob = {
  _id: string;
  status?: "queued" | "processing" | "completed" | "failed";
  source?: "manual" | "cron";
  errorMessage?: string;
  createdAt?: number;
  completedAt?: number;
  selectedGender?: "female" | "male";
  progress?: {
    currentStep: string;
    completedSteps: string[];
    stepModels?: {
      step: string;
      model: string;
    }[];
    message?: string;
    totalSteps: number;
    completedStepCount: number;
  };
  retriedAt?: number;
};

const JOB_PROGRESS_STEPS = [
  { key: "candidate_generation", label: "Generate unique profile blueprint" },
  { key: "avatar_generation", label: "Generate avatar image" },
  { key: "showcase_generation", label: "Generate showcase images" },
  { key: "profile_persist", label: "Save profile to database" },
] as const;

function getCurrentStepLabel(step: string | undefined): string {
  if (!step) return "Unknown";
  if (step === "failed") return "Failed";
  if (step === "completed") return "Completed";
  const matched = JOB_PROGRESS_STEPS.find((item) => item.key === step);
  return matched?.label ?? step;
}

function getStepModel(
  stepModels: { step: string; model: string }[] | undefined,
  step: string,
): string | null {
  if (!stepModels) return null;
  return stepModels.find((entry) => entry.step === step)?.model ?? null;
}

function getJobDisplayStatus(
  status: FailedJob["status"],
  isRetried: boolean,
): "queued" | "processing" | "completed" | "failed" | "retried" {
  if (isRetried) return "retried";
  if (status === "queued") return "queued";
  if (status === "processing") return "processing";
  if (status === "failed") return "failed";
  return "completed";
}

interface CharacterGenerationPanelProps {
  isGenerating: boolean;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  jobs: FailedJob[];
  onRetryFailed: (jobId: string) => Promise<void>;
  onGenerate: (input?: GenerateCharacterInput) => Promise<void>;
  occupationOptions: InterestOption[];
  interestOptions: InterestOption[];
  appearanceOptions?: {
    skinTones: string[];
    hairColors: string[];
    hairStylesFemale: string[];
    hairStylesMale: string[];
    eyeColors: string[];
    buildsFemale: string[];
    buildsMale: string[];
    outfitsFemale: string[];
    outfitsMale: string[];
    vibes: string[];
    expressions: string[];
  };
  isAnalyzingPhoto: boolean;
  onAnalyzePhoto: (file: File) => Promise<{
    subjectDescriptor: string;
    suggestedGender: "female" | "male";
    suggestedAge: number;
    suggestedOccupation?: string;
    suggestedVibe?: string;
    suggestedExpression?: string;
    referenceImageUrl: string;
  } | null>;
}

export function CharacterGenerationPanel({
  isGenerating,
  runningCount,
  completedCount,
  failedCount,
  jobs,
  onRetryFailed,
  onGenerate,
  occupationOptions,
  interestOptions,
  appearanceOptions,
  isAnalyzingPhoto,
  onAnalyzePhoto,
}: CharacterGenerationPanelProps) {
  const hasRunningJobs = runningCount > 0;
  const [isJobsOpen, setIsJobsOpen] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>(
    {},
  );
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

  const toggleExpanded = (jobId: string) => {
    setExpandedJobIds((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  return (
    <div className="mb-5 rounded-xl border border-border/60 bg-card/40 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={hasRunningJobs ? "default" : "secondary"}>
            {hasRunningJobs
              ? `${runningCount} creating`
              : "No active generation"}
            {hasRunningJobs && <Spinner />}
          </Badge>
          <StatChip
            label="completed"
            value={completedCount}
            variant="outline"
          />
          {failedCount > 0 ? (
            <StatChip
              label="failed"
              value={failedCount}
              variant="destructive"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
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
                      const displayStatus = getJobDisplayStatus(
                        job.status,
                        isRetried,
                      );
                      const isExpanded = expandedJobIds[job._id] === true;
                      const hasProgress = Boolean(job.progress);
                      const completedStepCount =
                        job.progress?.completedStepCount ?? 0;
                      const totalSteps = job.progress?.totalSteps ?? 0;
                      const progressSummary =
                        hasProgress && totalSteps > 0
                          ? `${completedStepCount}/${totalSteps} steps completed`
                          : null;

                      return (
                        <div
                          key={job._id}
                          className="rounded border border-border/40 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">
                                {job.source === "cron" ? "Cron" : "Manual"} •{" "}
                                {created}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Gender: {job.selectedGender ?? "auto"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={displayStatus} />
                              {isRunning && <Spinner />}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground break-words">
                            {isFailed
                              ? isRetried
                                ? `Retried on ${retriedAtLabel}`
                                : job.errorMessage ||
                                  "No error reason provided."
                              : isRunning
                                ? job.progress?.message ||
                                  "Generation in progress..."
                                : "Completed"}
                          </p>
                          {hasProgress && (
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground">
                                {progressSummary ||
                                  "Progress details available"}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => toggleExpanded(job._id)}
                              >
                                {isExpanded ? "Hide details" : "View details"}
                              </Button>
                            </div>
                          )}
                          {hasProgress && isExpanded && (
                            <div className="rounded-md border border-border/50 p-3 space-y-2">
                              <p className="text-xs text-muted-foreground">
                                Current step:{" "}
                                {getCurrentStepLabel(job.progress?.currentStep)}
                              </p>
                              {job.progress?.currentStep && (
                                <p className="text-xs text-muted-foreground">
                                  Model:{" "}
                                  {getStepModel(
                                    job.progress?.stepModels,
                                    job.progress.currentStep,
                                  ) ?? "n/a"}
                                </p>
                              )}
                              <div className="space-y-1.5">
                                {JOB_PROGRESS_STEPS.map((step) => {
                                  const isDone = Boolean(
                                    job.progress?.completedSteps.includes(
                                      step.key,
                                    ),
                                  );
                                  const isCurrent =
                                    job.progress?.currentStep === step.key;
                                  const model = getStepModel(
                                    job.progress?.stepModels,
                                    step.key,
                                  );
                                  return (
                                    <div
                                      key={step.key}
                                      className="flex items-center justify-between gap-2 rounded-sm border border-border/30 px-2 py-1.5"
                                    >
                                      <div className="min-w-0">
                                        <p className="text-xs">{step.label}</p>
                                        <p className="text-[10px] text-muted-foreground break-words">
                                          {model
                                            ? `Model: ${model}`
                                            : "Model: n/a"}
                                        </p>
                                      </div>
                                      <Badge
                                        variant={
                                          isDone
                                            ? "secondary"
                                            : isCurrent
                                              ? "default"
                                              : "outline"
                                        }
                                        className="text-[10px]"
                                      >
                                        {isDone
                                          ? "done"
                                          : isCurrent
                                            ? "running"
                                            : "pending"}
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                              {job.progress?.message && (
                                <p className="text-xs text-muted-foreground break-words">
                                  {job.progress.message}
                                </p>
                              )}
                            </div>
                          )}
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
          <AddCharacterDialog
            onGenerate={onGenerate}
            isGenerating={isGenerating}
            occupationOptions={occupationOptions}
            interestOptions={interestOptions}
            appearanceOptions={appearanceOptions}
            isAnalyzingPhoto={isAnalyzingPhoto}
            onAnalyzePhoto={onAnalyzePhoto}
          />
        </div>
      </div>
    </div>
  );
}
