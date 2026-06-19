import type { Metadata } from "next";
import { PublicPageContent } from "@/components/public/public-page-content";
import { getSiteUrl } from "@/lib/site";
import { buildHomeStructuredData } from "@/lib/public-structured-data";
import { getInitialPublicProfiles } from "@/lib/public-profiles.server";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();

  return {
    title: "FeelAI - AI Girlfriend & AI Boyfriend Chat for Virtual Companions",
    description:
      "Browse AI girlfriends, AI boyfriends, and virtual companions for dating-style chat, roleplay, friendship, and immersive conversations. Start chatting with AI companions on FeelAI.",
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title:
        "FeelAI - AI Girlfriend & AI Boyfriend Chat for Virtual Companions",
      description:
        "Browse AI companion profiles and start immersive dating-style chat with virtual companions on FeelAI.",
      url: siteUrl,
      siteName: "FeelAI",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "FeelAI - AI Girlfriend & AI Boyfriend Chat",
      description:
        "Discover AI girlfriends, AI boyfriends, and virtual companions for dating-style chat, roleplay, and friendship.",
    },
  };
}

export default async function HomePage() {
  const siteUrl = getSiteUrl();
  const initialProfiles = await getInitialPublicProfiles("girls");
  const structuredData = buildHomeStructuredData(siteUrl, initialProfiles);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicPageContent
        initialProfiles={initialProfiles}
        segment="girls"
        variant="home"
      />
    </>
  );
}
