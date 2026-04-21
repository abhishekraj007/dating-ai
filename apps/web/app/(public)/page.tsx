import type { Metadata } from "next";
import { PublicPageContent } from "@/components/public/public-page-content";
import { getSiteUrl } from "@/lib/site";
import { buildHomeStructuredData } from "@/lib/public-structured-data";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();

  return {
    title: "AI Dating, AI Companions & AI Friends",
    description:
      "Explore AI dating companions, AI friends, and immersive AI chat experiences built for roleplay, flirtation, and always-on connection.",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: "FeelAI | AI Dating, AI Companions & AI Friends",
      description:
        "SSR-powered AI dating homepage built to showcase AI companions, AI friends, and immersive AI chats.",
      url: siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: "FeelAI | AI Dating, AI Companions & AI Friends",
      description:
        "Explore AI dating companions, AI friends, and immersive AI chats.",
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
