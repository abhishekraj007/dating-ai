import type { Metadata } from "next";
import { PublicSeoLandingPage } from "@/components/public/public-seo-landing-page";
import { getInitialPublicProfiles } from "@/lib/public-profiles.server";
import {
  getPublicSeoPageConfig,
  type PublicSeoPageSlug,
} from "@/lib/public-seo-pages";
import { getSiteUrl } from "@/lib/site";

export function generatePublicSeoMetadata(slug: PublicSeoPageSlug): Metadata {
  const config = getPublicSeoPageConfig(slug);
  const siteUrl = getSiteUrl();

  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical: config.path,
    },
    openGraph: {
      title: `${config.title} - FeelAI`,
      description: config.description,
      url: `${siteUrl}${config.path}`,
      type: "website",
      images: [
        {
          url: "/app-logo.png",
          alt: "FeelAI app logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${config.title} - FeelAI`,
      description: config.description,
      images: ["/app-logo.png"],
    },
  };
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
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${config.title} - FeelAI`,
      url: pageUrl,
      description: config.description,
      isPartOf: siteUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: config.title,
          item: pageUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: config.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.title,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.body,
        },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <PublicSeoLandingPage config={config} profiles={profiles} />
    </>
  );
}
