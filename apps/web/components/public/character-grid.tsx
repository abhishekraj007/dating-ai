import { api, fetchQuery } from "@/lib/convex-client";
import {
  CharacterCard,
  type PublicProfileCard,
} from "@/components/public/character-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicSegment } from "@/lib/public-segments";

type CharacterGridProps = {
  segment: PublicSegment;
};

export async function CharacterGrid({ segment }: CharacterGridProps) {
  if (segment === "anime") {
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

  const gender = segment === "guys" ? "male" : "female";
  const profiles = (await fetchQuery(
    api.features.ai.queries.getPublicProfiles,
    {
      gender,
      limit: 24,
    },
  )) as PublicProfileCard[];

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
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {profiles.map((profile, index) => (
        <CharacterCard
          key={profile._id}
          isNew={index < 2}
          priority={index < 5}
          segment={segment}
          profile={profile}
        />
      ))}
    </div>
  );
}
