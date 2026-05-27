import type { Metadata } from "next";
import { PublicPageContent } from "@/components/public/public-page-content";
import { getSiteUrl } from "@/lib/site";
import { getSegmentConfig } from "@/lib/public-segments";
import { buildCategoryStructuredData } from "@/lib/public-structured-data";
import { getInitialPublicProfiles } from "@/lib/public-profiles.server";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const config = getSegmentConfig("girls");

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

export default async function AIGirlfriendPage() {
  const siteUrl = getSiteUrl();
  const initialProfiles = await getInitialPublicProfiles("girls");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildCategoryStructuredData(siteUrl, "girls", initialProfiles),
          ),
        }}
      />
      <PublicPageContent
        initialProfiles={initialProfiles}
        segment="girls"
        variant="category"
      />
    </>
  );
}
