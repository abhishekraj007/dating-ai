import { fetchQuery, api } from "@/lib/convex-client";
import { ExploreClient } from "./explore-client";

export const revalidate = 60; // Revalidate every 60 seconds

export async function generateMetadata() {
  return {
    title: "Explore AI Profiles | StatusAI",
    description:
      "Discover and connect with AI companions. Browse profiles, view interests, and start meaningful conversations.",
    openGraph: {
      title: "Explore AI Profiles | StatusAI",
      description: "Discover and connect with AI companions.",
    },
  };
}

export default async function ExplorePage() {
  // Fetch initial profiles server-side for SEO
  const initialProfiles = await fetchQuery(
    api.features.ai.queries.getProfiles,
    {
      gender: "female",
      limit: 50,
    }
  );

  return <ExploreClient initialProfiles={initialProfiles ?? []} />;
}
