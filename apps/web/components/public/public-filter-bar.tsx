"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDiscoverPreferences,
  type DiscoverUserPreferences,
} from "@/hooks/use-discover-preferences";
import { cn } from "@/lib/utils";

type FilterOptions = {
  interests: Array<{
    value: string;
    label: string;
    emoji: string;
  }>;
  ethnicities: Array<{
    value: string;
    label: string;
  }>;
};

type PreferenceKey = "interestPreferences" | "ethnicityPreferences";

function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button type="button" onClick={onRemove} className="cursor-pointer">
      <Badge
        variant="outline"
        className="h-8 gap-1.5 rounded-full border-border/70 bg-card/80 px-3 text-foreground transition-colors hover:bg-muted"
      >
        <span>{label}</span>
        <X className="size-3 text-muted-foreground" />
      </Badge>
    </button>
  );
}

export function PublicFilterBar() {
  const filterOptions = useQuery(
    api.features.filters.queries.getFilterOptions,
  ) as FilterOptions | undefined;
  const { effectivePreferences, savePreferences } = useDiscoverPreferences();
  const [pendingKey, setPendingKey] = useState<PreferenceKey | "reset" | null>(
    null,
  );

  const selectedEthnicities = effectivePreferences.ethnicityPreferences;
  const selectedInterests = effectivePreferences.interestPreferences;
  const hasActiveFilters =
    selectedEthnicities.length > 0 || selectedInterests.length > 0;

  const updatePreferences = async (
    nextPreferences: DiscoverUserPreferences,
    key: PreferenceKey | "reset",
  ) => {
    setPendingKey(key);

    try {
      await savePreferences(nextPreferences);
    } finally {
      setPendingKey(null);
    }
  };

  const toggleArrayPreference = async (key: PreferenceKey, value: string) => {
    const currentValues = effectivePreferences[key];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    await updatePreferences(
      {
        ...effectivePreferences,
        [key]: nextValues,
      },
      key,
    );
  };

  const clearFilters = async () => {
    await updatePreferences(
      {
        ...effectivePreferences,
        interestPreferences: [],
        ethnicityPreferences: [],
      },
      "reset",
    );
  };

  const isLoadingOptions = filterOptions === undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex h-9 items-center rounded-full border border-border/70 bg-card/70 px-3 text-sm text-muted-foreground shadow-sm">
          <SlidersHorizontal className="mr-2 size-4" />
          Refine matches
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full border-border/70 bg-card/80",
                selectedEthnicities.length > 0 &&
                  "border-primary/40 bg-primary/6 text-foreground",
              )}
            >
              Ethnicity
              {selectedEthnicities.length > 0 ? (
                <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-xs text-primary">
                  {selectedEthnicities.length}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72">
            <DropdownMenuLabel>Match any selected ethnicity</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoadingOptions
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="px-3 py-2">
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))
              : filterOptions.ethnicities.map((ethnicity) => (
                  <DropdownMenuCheckboxItem
                    key={ethnicity.value}
                    checked={selectedEthnicities.includes(ethnicity.value)}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={() => {
                      void toggleArrayPreference(
                        "ethnicityPreferences",
                        ethnicity.value,
                      );
                    }}
                    disabled={pendingKey === "ethnicityPreferences"}
                  >
                    {ethnicity.label}
                  </DropdownMenuCheckboxItem>
                ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-full border-border/70 bg-card/80",
                selectedInterests.length > 0 &&
                  "border-primary/40 bg-primary/6 text-foreground",
              )}
            >
              Interests
              {selectedInterests.length > 0 ? (
                <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-xs text-primary">
                  {selectedInterests.length}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <DropdownMenuLabel>Match any selected interest</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoadingOptions
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="px-3 py-2">
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))
              : filterOptions.interests.map((interest) => (
                  <DropdownMenuCheckboxItem
                    key={interest.value}
                    checked={selectedInterests.includes(interest.value)}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={() => {
                      void toggleArrayPreference(
                        "interestPreferences",
                        interest.value,
                      );
                    }}
                    disabled={pendingKey === "interestPreferences"}
                  >
                    <span className="truncate">
                      {interest.label}
                      {interest.emoji ? ` ${interest.emoji}` : ""}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
            onClick={() => {
              void clearFilters();
            }}
            disabled={pendingKey === "reset"}
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        ) : null}
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap gap-2">
          {selectedEthnicities.map((ethnicity) => (
            <ActiveFilterChip
              key={ethnicity}
              label={ethnicity}
              onRemove={() => {
                void toggleArrayPreference("ethnicityPreferences", ethnicity);
              }}
            />
          ))}
          {selectedInterests.map((interest) => (
            <ActiveFilterChip
              key={interest}
              label={interest}
              onRemove={() => {
                void toggleArrayPreference("interestPreferences", interest);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
