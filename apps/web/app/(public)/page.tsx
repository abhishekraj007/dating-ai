import type { Metadata } from "next";
import {
  CharacterGrid,
  type PublicSegment,
} from "@/components/public/character-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 60;

type HomePageProps = {
  searchParams?: Promise<{
    segment?: string;
  }>;
};

function getSegment(segment?: string): PublicSegment {
  if (segment === "guys" || segment === "anime") {
    return segment;
  }

  return "girls";
}

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

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const segment = getSegment(resolvedSearchParams?.segment);
  const siteUrl = getSiteUrl();

  const structuredData = [
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

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="space-y-5 rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card/80 p-5 shadow-sm md:p-8">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">AI Dating</Badge>
          <Badge variant="secondary">AI Companions</Badge>
          <Badge variant="secondary">AI Friends</Badge>
          <Badge variant="secondary">AI Chats</Badge>
        </div>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Discover AI companions built for dating, friendship, and immersive
            chat.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            FeelAI surfaces AI companions on a fully server-rendered homepage so
            every profile card, every keyword, and every SEO signal is readable
            from the first request.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {segment === "guys"
                ? "Featured AI guys"
                : segment === "anime"
                  ? "Anime AI companions"
                  : "Featured AI girls"}
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Public profiles rendered on the server with dark-first UI and
              light mode support.
            </p>
          </div>
        </div>
        <CharacterGrid segment={segment} />
      </section>
    </main>
  );
}
