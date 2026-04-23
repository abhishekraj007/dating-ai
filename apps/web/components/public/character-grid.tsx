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
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
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
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle>Anime companions are coming next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          We are keeping the anime tab reserved until we seed dedicated anime
          profiles and public detail pages.
        </CardContent>
      </Card>
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
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle>No public companions available yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The public catalog is still being seeded. Check back shortly for more
          profiles.
        </CardContent>
      </Card>
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
        <div ref={loadMoreRef} className="flex justify-center py-4">
          <div className="rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm text-muted-foreground shadow-sm">
            Loading more profiles...
          </div>
        </div>
      ) : null}
    </div>
  );
}
