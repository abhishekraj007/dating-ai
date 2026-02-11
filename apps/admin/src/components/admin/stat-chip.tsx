"use client";

import { Badge } from "@/components/ui/badge";

interface StatChipProps {
  label: string;
  value: string | number;
  variant?: "default" | "secondary" | "outline" | "destructive";
}

export function StatChip({
  label,
  value,
  variant = "secondary",
}: StatChipProps) {
  return (
    <Badge variant={variant} className="gap-1.5 px-2.5 py-1 text-xs">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </Badge>
  );
}
