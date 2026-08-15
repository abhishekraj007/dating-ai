import { JsonLd } from "@/components/public/json-ld";
import { PublicSeoLandingPage } from "@/components/public/public-seo-landing-page";
import { buildPublicPageMetadata } from "@/lib/public-metadata";
import { getInitialPublicProfiles } from "@/lib/public-profiles.server";
import {
  getPublicSeoPageConfig,
  type PublicSeoPageSlug,
} from "@/lib/public-seo-pages";
import { buildSeoGuideStructuredData } from "@/lib/public-structured-data";
import { getSiteUrl } from "@/lib/site";

export function generatePublicSeoMetadata(slug: PublicSeoPageSlug) {
  const config = getPublicSeoPageConfig(slug);

  return buildPublicPageMetadata({
    title: config.title,
    description: config.description,
    path: config.path,
  });
}

export async function PublicSeoPageRoute({
  slug,
}: {
  slug: PublicSeoPageSlug;
}) {
  const config = getPublicSeoPageConfig(slug);
  const siteUrl = getSiteUrl();
  const profiles = await getInitialPublicProfiles(config.segment, 10);
  const pageUrl = `${siteUrl}${config.path}`;

  return (
    <>
      <JsonLd
        data={buildSeoGuideStructuredData(
          siteUrl,
          pageUrl,
          config.title,
          config.description,
          config.faqs.map((faq) => ({ name: faq.title, text: faq.body })),
        )}
      />
      <PublicSeoLandingPage config={config} profiles={profiles} />
    </>
  );
}
