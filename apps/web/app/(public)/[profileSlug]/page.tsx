import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfilePage } from "@/components/public/public-profile-page";
import { api, fetchQuery } from "@/lib/convex-client";
import type { AvatarImageRequest } from "@dating-ai/backend";
import {
  isReservedPublicUsername,
  normalizePublicUsername,
} from "@/lib/public-profile-routes";
import { buildPublicProfileStructuredData } from "@/lib/public-structured-data";
import { getInitialPublicProfiles } from "@/lib/public-profiles.server";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 60;

type ProfileRouteProps = {
  params: Promise<{ profileSlug: string }>;
};

async function getPublicProfile(
  profileSlug: string,
  image?: AvatarImageRequest,
) {
  const normalizedUsername = normalizePublicUsername(profileSlug);
  if (isReservedPublicUsername(normalizedUsername)) {
    return null;
  }

  const profile = await fetchQuery(
    api.features.ai.queries.getPublicProfileByUsername,
    {
      username: normalizedUsername,
      imageWidth: image?.imageWidth,
      imageQuality: image?.imageQuality,
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
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const role = profile.gender === "male" ? "AI Boyfriend" : "AI Girlfriend";
  const ageString = profile.age ? `, ${profile.age}` : "";
  const title = `${profile.name}${ageString} – ${role} Chat`;
  const description = profile.bio
    ? `${profile.bio.slice(0, 150)}... Chat with ${profile.name} on FeelAI.`
    : `Meet ${profile.name}, a virtual ${role.toLowerCase()} on FeelAI for dating-style chat, roleplay, and companionship.`;
  const canonicalPath = `/${profile.username}`;
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${canonicalPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} | FeelAI`,
      description,
      url: pageUrl,
      images: profile.avatarUrl
        ? [
            {
              url: profile.avatarUrl,
              alt: `${profile.name} – ${role}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | FeelAI`,
      description,
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

  const allRelated = await getInitialPublicProfiles(segment, 8);
  const relatedProfiles = allRelated
    .filter((p) => p.username !== profile.username)
    .slice(0, 4);

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
      <PublicProfilePage
        profile={profile}
        relatedProfiles={relatedProfiles}
        segment={segment}
      />
    </>
  );
}
