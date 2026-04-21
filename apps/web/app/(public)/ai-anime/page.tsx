import type { Metadata } from "next";
import { PublicPageContent } from "@/components/public/public-page-content";
import { getSiteUrl } from "@/lib/site";
import { PUBLIC_SEGMENTS } from "@/lib/public-segments";
import { buildCategoryStructuredData } from "@/lib/public-structured-data";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const config = PUBLIC_SEGMENTS.anime;

  return {
    title: config.metaTitle,
    description: config.metaDescription,
    alternates: {
      canonical: config.href,
    },
    openGraph: {
      title: `FeelAI | ${config.metaTitle}`,
      description: config.metaDescription,
      url: `${siteUrl}${config.href}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `FeelAI | ${config.metaTitle}`,
      description: config.metaDescription,
    },
  };
}

export default function AIAnimePage() {
  const siteUrl = getSiteUrl();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildCategoryStructuredData(siteUrl, "anime")),
        }}
      />
      <PublicPageContent segment="anime" variant="category" />
    </>
  );
}
