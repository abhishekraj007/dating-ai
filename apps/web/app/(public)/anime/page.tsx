import { notFound } from "next/navigation";
import { JsonLd } from "@/components/public/json-ld";
import { PublicPageContent } from "@/components/public/public-page-content";
import { noIndexRobots, buildPublicPageMetadata } from "@/lib/public-metadata";
import { ANIME_ENABLED, getSegmentConfig } from "@/lib/public-segments";
import { buildCategoryStructuredData } from "@/lib/public-structured-data";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 60;

const config = getSegmentConfig("anime");

export const metadata = ANIME_ENABLED
  ? buildPublicPageMetadata({
      title: config.metaTitle,
      description: config.metaDescription,
      path: config.href,
    })
  : {
      title: "Page Not Found",
      robots: noIndexRobots,
    };

export default function AIAnimePage() {
  if (!ANIME_ENABLED) notFound();

  const siteUrl = getSiteUrl();

  return (
    <>
      <JsonLd data={buildCategoryStructuredData(siteUrl, "anime")} />
      <PublicPageContent segment="anime" variant="category" />
    </>
  );
}
