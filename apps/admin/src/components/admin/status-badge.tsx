"use client";

import { Badge } from "@/components/ui/badge";

type StatusType =
  | "active"
  | "pending"
  | "archived"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "retried";

interface StatusBadgeProps {
  status: StatusType;
}

const STATUS_LABELS: Record<StatusType, string> = {
  active: "active",
  pending: "pending",
  archived: "archived",
  queued: "queued",
  processing: "processing",
  completed: "completed",
  failed: "failed",
  retried: "retried",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant =
    status === "failed"
      ? "destructive"
      : status === "active" || status === "processing"
        ? "default"
        : status === "queued" || status === "pending"
          ? "outline"
          : "secondary";

  return (
    <Badge variant={variant} className="capitalize">
      {STATUS_LABELS[status]}
    </Badge>
  );
}

