"use client";

import { Badge } from "@/components/ui/badge";

type StatusType =
  | "active"
  | "pending"
  | "archived"
  | "queued"
  | "processing"
  | "awaiting_avatar_approval"
  | "completed"
  | "failed"
  | "cancelled"
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
  awaiting_avatar_approval: "awaiting approval",
  completed: "completed",
  failed: "failed",
  cancelled: "cancelled",
  retried: "retried",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant =
    status === "failed"
      ? "destructive"
      : status === "active" || status === "processing"
        ? "default"
        : status === "queued" ||
            status === "pending" ||
            status === "awaiting_avatar_approval"
          ? "outline"
          : "secondary";

  return (
    <Badge variant={variant} className="capitalize">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
