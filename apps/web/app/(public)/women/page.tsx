import { CATEGORY_SEO_FAQS } from "@/components/public/category-seo-content";
import { JsonLd } from "@/components/public/json-ld";
import { PublicPageContent } from "@/components/public/public-page-content";
import { buildPublicPageMetadata } from "@/lib/public-metadata";
import { getInitialPublicProfiles } from "@/lib/public-profiles.server";
import { getSegmentConfig } from "@/lib/public-segments";
import { buildCategoryStructuredData } from "@/lib/public-structured-data";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 60;

const config = getSegmentConfig("girls");

export const metadata = buildPublicPageMetadata({
  title: config.metaTitle,
  description: config.metaDescription,
  path: config.href,
});

export default async function AIGirlfriendPage() {
  const siteUrl = getSiteUrl();
  const initialProfiles = await getInitialPublicProfiles("girls");

  return (
    <>
      <JsonLd
        data={buildCategoryStructuredData(
          siteUrl,
          "girls",
          initialProfiles,
          CATEGORY_SEO_FAQS.girls.map((faq) => ({
            name: faq.question,
            text: faq.answer,
          })),
        )}
      />
      <PublicPageContent
        initialProfiles={initialProfiles}
        segment="girls"
        variant="category"
      />
    </>
  );
}
