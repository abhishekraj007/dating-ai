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

function buildProfileItemListStructuredData(
  siteUrl: string,
  segment: PublicSegment,
  profiles: PublicProfileListItem[],
) {
  if (profiles.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
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
) {
  const profileItemList = buildProfileItemListStructuredData(
    siteUrl,
    "girls",
    profiles,
  );
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
          name: "Can I browse AI companion profiles before signing in?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. FeelAI shows public AI companion profiles before sign-in so visitors can browse featured personalities and choose who they want to chat with.",
          },
        },
        {
          "@type": "Question",
          name: "How do I find the right AI companion on FeelAI?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Start with public AI companion profiles, then use filters to find personalities and interests that match the conversation you want.",
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
    profileItemList,
  ].filter(Boolean);
}

export function buildCategoryStructuredData(
  siteUrl: string,
  segment: PublicSegment,
  profiles: PublicProfileListItem[] = [],
) {
  const config = getSegmentConfig(segment);
  const categoryUrl = `${siteUrl}${config.href}`;
  const profileItemList = buildProfileItemListStructuredData(
    siteUrl,
    segment,
    profiles,
  );

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `FeelAI ${config.metaTitle}`,
      url: categoryUrl,
      description: config.metaDescription,
      abstract: config.heroDescription,
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
    profileItemList,
  ].filter(Boolean);
}

export function buildPublicProfileStructuredData(
  siteUrl: string,
  segment: PublicSegment,
  profileUrl: string,
  profile: PublicProfileStructuredData,
) {
  const config = getSegmentConfig(segment);

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
      description: profile.bio
        ? `${profile.bio} This is an AI companion profile on FeelAI.`
        : `${profile.name} is an AI companion profile on FeelAI.`,
      disambiguatingDescription: "AI companion profile",
      image: profile.image ?? undefined,
      jobTitle: profile.occupation ?? undefined,
      knowsAbout: profile.interests ?? undefined,
      additionalProperty: profile.age
        ? [
            {
              "@type": "PropertyValue",
              name: "Profile age",
              value: profile.age,
            },
          ]
        : undefined,
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
