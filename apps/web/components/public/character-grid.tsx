"use client";

import { useEffect, useRef } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import {
  CharacterCard,
  type PublicProfileCard,
} from "@/components/public/character-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublicSegment } from "@/lib/public-segments";
import {
  genderPreferenceFromSegment,
  segmentFromGenderPreference,
} from "@/lib/public-segments";
import { useDiscoverPreferences } from "@/hooks/use-discover-preferences";
import { Sparkles, Users } from "lucide-react";

type CharacterGridProps = {
  segment: PublicSegment;
  variant?: "home" | "category";
};

const PAGE_SIZE = 24;

function CharacterGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card/90 shadow-sm"
        >
          <div className="relative aspect-[3/4] overflow-hidden">
            <Skeleton className="h-full w-full rounded-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 space-y-3 p-4">
              <Skeleton className="h-5 w-2/3 bg-white/20" />
              <Skeleton className="h-4 w-4/5 bg-white/15" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CharacterGrid({
  segment,
  variant = "category",
}: CharacterGridProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { effectivePreferences } = useDiscoverPreferences();

  const resolvedSegment =
    variant === "home"
      ? segmentFromGenderPreference(effectivePreferences.genderPreference)
      : segment;

  if (resolvedSegment === "anime") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-12">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/5"></div>
          <Sparkles className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
        <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
          Your anime adventure awaits
        </h3>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Find unique anime personalities for you to connect with. They'll be
          ready to chat and go on adventures with you soon!
        </p>
      </div>
    );
  }

  const genderPreference =
    variant === "home"
      ? effectivePreferences.genderPreference
      : (genderPreferenceFromSegment(resolvedSegment) ?? "female");
  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.features.ai.queries.getPublicProfilesPaginated,
    {
      genderPreference,
      interestPreferences: effectivePreferences.interestPreferences,
      ethnicityPreferences: effectivePreferences.ethnicityPreferences,
    },
    { initialNumItems: PAGE_SIZE },
  );

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || status !== "CanLoadMore") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore(PAGE_SIZE);
        }
      },
      {
        rootMargin: "800px 0px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, status]);

  const profiles = (results ?? []) as PublicProfileCard[];

  if (isLoading && profiles.length === 0) {
    return <CharacterGridSkeleton count={10} />;
  }

  if (profiles.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-10 px-8">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/5"></div>
          <Users className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
        <h3 className="mb-2 text-md font-semibold tracking-tight text-foreground">
          Looking for your perfect match?
        </h3>
        <p className="max-w-md text-center text-sm md:text-sm text-muted-foreground">
          Could not find any profiles. Check back shortly to start discovering
          new connections.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {profiles.map((profile, index) => (
          <CharacterCard
            key={profile._id}
            isNew={index < 2}
            priority={index < 5}
            segment={resolvedSegment}
            profile={profile}
          />
        ))}
      </div>

      {status === "LoadingMore" ? <CharacterGridSkeleton count={4} /> : null}

      {status === "CanLoadMore" ? (
        <div ref={loadMoreRef} className="h-px w-full" aria-hidden="true" />
      ) : null}
    </div>
  );
}
