import type { PublicProfileCard } from "@/components/public/character-card";
import { api, fetchQuery } from "@/lib/convex-client";
import type { PublicSegment } from "@/lib/public-segments";

const INITIAL_PUBLIC_PROFILE_LIMIT = 24;
const ADULT_DISCOVERY_TERMS = [
  "adult",
  "dirty talk",
  "erotic",
  "explicit",
  "nsfw",
  "sexting",
];

function genderFromSegment(segment: PublicSegment) {
  if (segment === "guys") {
    return "male" as const;
  }

  if (segment === "girls") {
    return "female" as const;
  }

  return null;
}

export async function getInitialPublicProfiles(
  segment: PublicSegment,
  limit = INITIAL_PUBLIC_PROFILE_LIMIT,
): Promise<PublicProfileCard[]> {
  const gender = genderFromSegment(segment);

  if (!gender) {
    return [];
  }

  try {
    const profiles = await fetchQuery(api.features.ai.queries.getPublicProfiles, {
      gender,
      limit: limit * 3,
    });

    return profiles.filter(isBroadDiscoverySafeProfile).slice(0, limit);
  } catch (error) {
    console.error("Failed to fetch initial public profiles", error);
    return [];
  }
}

function isBroadDiscoverySafeProfile(profile: PublicProfileCard) {
  const searchableText = [
    profile.tagline,
    profile.occupation,
    ...profile.interests,
  ]
    .join(" ")
    .toLowerCase();

  return !ADULT_DISCOVERY_TERMS.some((term) => searchableText.includes(term));
}
