import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfilePage } from "@/components/public/public-profile-page";
import { api, fetchQuery } from "@/lib/convex-client";
import {
  isReservedPublicUsername,
  normalizePublicUsername,
} from "@/lib/public-profile-routes";
import { buildPublicProfileStructuredData } from "@/lib/public-structured-data";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 60;
export const dynamic = "force-dynamic";

type ProfileRouteProps = {
  params: Promise<{ profileSlug: string }>;
};

async function getPublicProfile(profileSlug: string) {
  const normalizedUsername = normalizePublicUsername(profileSlug);
  if (isReservedPublicUsername(normalizedUsername)) {
    return null;
  }

  const profile = await fetchQuery(
    api.features.ai.queries.getPublicProfileByUsername,
    {
      username: normalizedUsername,
    },
  );

  if (!profile || profile.username !== normalizedUsername) {
    return null;
  }

  return profile;
}

function getProfileSegment(gender: "female" | "male") {
  return gender === "male" ? "guys" : "girls";
}

export async function generateMetadata({
  params,
}: ProfileRouteProps): Promise<Metadata> {
  const { profileSlug } = await params;
  const profile = await getPublicProfile(profileSlug);

  if (!profile) {
    return {
      title: "Profile Not Found",
      alternates: { canonical: "/" },
    };
  }

  const canonicalPath = `/${profile.username}`;
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${canonicalPath}`;

  return {
    title: `${profile.name} | FeelAI`,
    description:
      profile.bio ||
      `Meet ${profile.name} on FeelAI for immersive dating and conversation.`,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${profile.name} | FeelAI`,
      description:
        profile.bio ||
        `Meet ${profile.name} on FeelAI for immersive dating and conversation.`,
      url: pageUrl,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${profile.name} | FeelAI`,
      description:
        profile.bio ||
        `Meet ${profile.name} on FeelAI for immersive dating and conversation.`,
      images: profile.avatarUrl ? [profile.avatarUrl] : undefined,
    },
  };
}

export default async function PublicProfileRoute({ params }: ProfileRouteProps) {
  const { profileSlug } = await params;
  const profile = await getPublicProfile(profileSlug);

  if (!profile) {
    notFound();
  }

  const segment = getProfileSegment(profile.gender);
  const canonicalPath = `/${profile.username}`;
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${canonicalPath}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildPublicProfileStructuredData(siteUrl, segment, pageUrl, {
              name: profile.name,
              age: profile.age,
              bio: profile.bio,
              interests: profile.interests,
              occupation: profile.occupation,
              image: profile.avatarUrl,
            }),
          ),
        }}
      />
      <PublicProfilePage profile={profile} segment={segment} />
    </>
  );
}
