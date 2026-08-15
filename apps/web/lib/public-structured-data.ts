import { getSegmentConfig, type PublicSegment } from "@/lib/public-segments";
import { buildPublicProfileHref } from "@/lib/public-profile-routes";

type PublicProfileListItem = {
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  tagline?: string | null;
};

type PublicProfileStructuredData = {
  name: string;
  age?: number | null;
  bio?: string | null;
  interests?: string[] | null;
  occupation?: string | null;
  image?: string | null;
};

export type StructuredFaq = {
  name: string;
  text: string;
};

type StructuredDataNode = Record<string, unknown>;

function websiteNode(siteUrl: string) {
  return {
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    name: "FeelAI",
    url: siteUrl,
    description:
      "AI dating homepage for discovering AI companions, AI friends, and immersive chat experiences.",
  };
}

function buildFaqPage(faqs: StructuredFaq[]) {
  if (faqs.length === 0) {
    return null;
  }

  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.name,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.text,
      },
    })),
  };
}

function buildStructuredDataGraph(nodes: Array<StructuredDataNode | null>) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function buildProfileItemListStructuredData(
  siteUrl: string,
  segment: PublicSegment,
  profiles: PublicProfileListItem[],
) {
  if (profiles.length === 0) {
    return null;
  }

  return {
    "@type": "ItemList",
    name:
      segment === "guys"
        ? "Featured AI boyfriend profiles"
        : "Featured AI girlfriend profiles",
    itemListElement: profiles.flatMap((profile, index) => {
      const href = buildPublicProfileHref(segment, profile.username);

      return href
        ? [
            {
              "@type": "ListItem",
              position: index + 1,
              url: `${siteUrl}${href}`,
              name: profile.name,
              image: profile.avatarUrl ?? undefined,
              description: profile.tagline ?? undefined,
            },
          ]
        : [];
    }),
  };
}

export function buildHomeStructuredData(
  siteUrl: string,
  profiles: PublicProfileListItem[] = [],
  faqs: StructuredFaq[] = [],
) {
  return buildStructuredDataGraph([
    websiteNode(siteUrl),
    {
      "@type": "Organization",
      name: "FeelAI",
      url: siteUrl,
      logo: `${siteUrl}/app-logo.png`,
    },
    {
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
    buildFaqPage(faqs),
    buildProfileItemListStructuredData(siteUrl, "girls", profiles),
  ]);
}

export function buildCategoryStructuredData(
  siteUrl: string,
  segment: PublicSegment,
  profiles: PublicProfileListItem[] = [],
  faqs: StructuredFaq[] = [],
) {
  const config = getSegmentConfig(segment);
  const categoryUrl = `${siteUrl}${config.href}`;

  return buildStructuredDataGraph([
    {
      "@type": "CollectionPage",
      name: `FeelAI ${config.metaTitle}`,
      url: categoryUrl,
      description: config.metaDescription,
      abstract: config.heroDescription,
      isPartOf: websiteNode(siteUrl),
    },
    {
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
    buildFaqPage(faqs),
    buildProfileItemListStructuredData(siteUrl, segment, profiles),
  ]);
}

export function buildPublicProfileStructuredData(
  siteUrl: string,
  segment: PublicSegment,
  profileUrl: string,
  profile: PublicProfileStructuredData,
  faqs: StructuredFaq[] = [],
) {
  const config = getSegmentConfig(segment);
  const companionRole = segment === "guys" ? "AI Boyfriend" : "AI Girlfriend";

  return buildStructuredDataGraph([
    {
      "@type": "ProfilePage",
      name: `${profile.name} – ${companionRole} | FeelAI`,
      url: profileUrl,
      isPartOf: websiteNode(siteUrl),
      description:
        profile.bio ??
        `${profile.name} is a virtual ${companionRole.toLowerCase()} companion profile on FeelAI.`,
      mainEntity: {
        "@type": "Thing",
        name: profile.name,
        description: profile.bio
          ? `${profile.bio} (Virtual ${companionRole} profile on FeelAI)`
          : `${profile.name} is a virtual ${companionRole.toLowerCase()} profile on FeelAI.`,
        image: profile.image ?? undefined,
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Companion Type",
            value: companionRole,
          },
          ...(profile.age
            ? [
                {
                  "@type": "PropertyValue",
                  name: "Profile age",
                  value: profile.age,
                },
              ]
            : []),
          ...(profile.occupation
            ? [
                {
                  "@type": "PropertyValue",
                  name: "Occupation",
                  value: profile.occupation,
                },
              ]
            : []),
          ...(profile.interests && profile.interests.length > 0
            ? [
                {
                  "@type": "PropertyValue",
                  name: "Interests",
                  value: profile.interests.join(", "),
                },
              ]
            : []),
        ],
      },
    },
    {
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
    buildFaqPage(faqs),
  ]);
}

export function buildSeoGuideStructuredData(
  siteUrl: string,
  pageUrl: string,
  title: string,
  description: string,
  faqs: StructuredFaq[],
) {
  return buildStructuredDataGraph([
    {
      "@type": "WebPage",
      name: `${title} - FeelAI`,
      url: pageUrl,
      description,
      isPartOf: websiteNode(siteUrl),
    },
    {
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
          name: title,
          item: pageUrl,
        },
      ],
    },
    buildFaqPage(faqs),
  ]);
}
