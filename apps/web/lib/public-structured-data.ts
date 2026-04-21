import { PUBLIC_SEGMENTS, type PublicSegment } from "@/lib/public-segments";

type PublicProfileStructuredData = {
  name: string;
  age?: number | null;
  bio?: string | null;
  occupation?: string | null;
  image?: string | null;
};

export function buildHomeStructuredData(siteUrl: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "FeelAI",
      url: siteUrl,
      description:
        "AI dating homepage for discovering AI companions, AI friends, and immersive chat experiences.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "FeelAI",
      url: siteUrl,
      logo: `${siteUrl}/favicon.ico`,
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
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "FeelAI",
      applicationCategory: "DatingApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description:
        "FeelAI helps people discover AI companions for dating, roleplay, friendship, and immersive chat sessions.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is FeelAI?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "FeelAI is an AI dating platform where users discover AI companions, AI friends, and immersive chat experiences built for always-on conversations.",
          },
        },
        {
          "@type": "Question",
          name: "Is FeelAI server-rendered for SEO?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The public homepage is rendered on the server so search engines can index companion cards, SEO copy, and structured data.",
          },
        },
        {
          "@type": "Question",
          name: "Can I switch between dark and light mode?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. FeelAI opens in dark mode by default, and visitors can switch to light mode from the public header.",
          },
        },
      ],
    },
  ];
}

export function buildCategoryStructuredData(
  siteUrl: string,
  segment: PublicSegment,
) {
  const config = PUBLIC_SEGMENTS[segment];
  const categoryUrl = `${siteUrl}${config.href}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `FeelAI ${config.metaTitle}`,
      url: categoryUrl,
      description: config.metaDescription,
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
          name: config.metaTitle,
          item: categoryUrl,
        },
      ],
    },
  ];
}

export function buildPublicProfileStructuredData(
  siteUrl: string,
  segment: PublicSegment,
  profileUrl: string,
  profile: PublicProfileStructuredData,
) {
  const config = PUBLIC_SEGMENTS[segment];

  return [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: `${profile.name} | FeelAI`,
      url: profileUrl,
      isPartOf: `${siteUrl}${config.href}`,
      description:
        profile.bio ?? `${profile.name} is an AI companion profile on FeelAI.`,
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name,
      description: profile.bio ?? undefined,
      image: profile.image ?? undefined,
      jobTitle: profile.occupation ?? undefined,
      additionalName: profile.age ? String(profile.age) : undefined,
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
          name: config.metaTitle,
          item: `${siteUrl}${config.href}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: profile.name,
          item: profileUrl,
        },
      ],
    },
  ];
}
