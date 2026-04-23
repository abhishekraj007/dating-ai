import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfilePage } from "@/components/public/public-profile-page";
import { api, fetchQuery } from "@/lib/convex-client";
import { buildPublicProfileStructuredData } from "@/lib/public-structured-data";
import { normalizePublicUsername } from "@/lib/public-profile-routes";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 60;
export const dynamic = "force-dynamic";

type ProfileRouteProps = {
  params: Promise<{ profileSlug: string }>;
};

async function getPublicProfile(profileSlug: string) {
  const profile = await fetchQuery(
    api.features.ai.queries.getPublicProfileByUsername,
    {
      username: normalizePublicUsername(profileSlug),
    },
  );

  if (!profile || profile.gender !== "female") {
    return null;
  }

  if (profile.username !== normalizePublicUsername(profileSlug)) {
    return null;
  }

  return profile;
}

export async function generateMetadata({
  params,
}: ProfileRouteProps): Promise<Metadata> {
  const { profileSlug } = await params;
  const profile = await getPublicProfile(profileSlug);
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/ai-girlfriend/${profileSlug}`;

  if (!profile) {
    return {
      title: "Profile Not Found",
      alternates: { canonical: "/ai-girlfriend" },
    };
  }

  return {
    title: `${profile.name} | AI Girlfriend`,
    description:
      profile.bio ||
      `Meet ${profile.name}, an AI girlfriend on FeelAI for immersive dating and conversation.`,
    alternates: {
      canonical: `/ai-girlfriend/${profileSlug}`,
    },
    openGraph: {
      title: `${profile.name} | AI Girlfriend`,
      description:
        profile.bio ||
        `Meet ${profile.name}, an AI girlfriend on FeelAI for immersive dating and conversation.`,
      url: pageUrl,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${profile.name} | AI Girlfriend`,
      description:
        profile.bio ||
        `Meet ${profile.name}, an AI girlfriend on FeelAI for immersive dating and conversation.`,
    },
  };
}

export default async function AIGirlfriendProfilePage({
  params,
}: ProfileRouteProps) {
  const { profileSlug } = await params;
  const profile = await getPublicProfile(profileSlug);
  if (!profile) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/ai-girlfriend/${profileSlug}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildPublicProfileStructuredData(siteUrl, "girls", pageUrl, {
              name: profile.name,
              age: profile.age,
              bio: profile.bio,
              occupation: profile.occupation,
              image: profile.avatarUrl,
            }),
          ),
        }}
      />
      <PublicProfilePage profile={profile} segment="girls" />
    </>
  );
}
