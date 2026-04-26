import type { Metadata } from "next";
import { PublicPageContent } from "@/components/public/public-page-content";
import { getSiteUrl } from "@/lib/site";
import { buildHomeStructuredData } from "@/lib/public-structured-data";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();

  return {
    title: "Chat with AI Characters - FeelAI",
    description: "Explore AI Characters for stories, roleplay, and knowledge.",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: "Chat with AI Characters - FeelAI",
      description:
        "Engage with AI Characters for creative storytelling and learning.",
      url: siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: "Chat with AI Characters - FeelAI",
      description:
        "Chat with AI Characters designed for creativity, roleplay, and education.",
    },
  };
}

export default async function HomePage() {
  const siteUrl = getSiteUrl();
  const structuredData = buildHomeStructuredData(siteUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PublicPageContent segment="girls" variant="home" />
    </>
  );
}
