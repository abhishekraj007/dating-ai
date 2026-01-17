import { fetchQuery, api } from "@/lib/convex-client";
import { ProfileClient } from "./profile-client";
import { notFound } from "next/navigation";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import type { Metadata } from "next";

export const revalidate = 60; // Revalidate every 60 seconds

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;

  const profile = await fetchQuery(api.features.ai.queries.getProfile, {
    profileId: id as Id<"aiProfiles">,
  });

  if (!profile) {
    return {
      title: "Profile Not Found | StatusAI",
    };
  }

  return {
    title: `${profile.name} | StatusAI`,
    description:
      profile.bio ||
      `Connect with ${profile.name} on StatusAI. ${profile.occupation || ""} ${profile.zodiacSign || ""}`.trim(),
    openGraph: {
      title: `${profile.name} | StatusAI`,
      description: profile.bio || `Connect with ${profile.name}`,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : undefined,
    },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;

  // Fetch profile server-side for SEO
  const profile = await fetchQuery(api.features.ai.queries.getProfile, {
    profileId: id as Id<"aiProfiles">,
  });

  if (!profile) {
    notFound();
  }

  return <ProfileClient profileId={id} initialProfile={profile} />;
}
