import Image from "next/image";
import { CharacterGrid } from "@/components/public/character-grid";
import type { PublicProfileCard } from "@/components/public/character-card";
import { DiscoverPreferenceDialog } from "@/components/public/discover-preference-dialog";
import { PublicFilterBar } from "@/components/public/public-filter-bar";
import { getSegmentConfig, type PublicSegment } from "@/lib/public-segments";

const heroBackgrounds: Record<PublicSegment, string> = {
  girls: "/gf.webp",
  guys: "/bf.webp",
  anime: "/cover.webp",
};

type PublicPageContentProps = {
  initialProfiles?: PublicProfileCard[];
  segment: PublicSegment;
  variant?: "home" | "category";
};

export function PublicPageContent({
  initialProfiles = [],
  segment,
  variant = "home",
}: PublicPageContentProps) {
  const config = getSegmentConfig(segment);
  const isHome = variant === "home";
  const heroBackground = heroBackgrounds[segment];
  // const heroBackground = heroBackgrounds["anime"];

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-8">
      {isHome ? <DiscoverPreferenceDialog /> : null}

      <section className="relative overflow-hidden rounded-[calc(var(--radius)*1.75)] border border-border/70 bg-card shadow-[0_28px_70px_-44px_rgba(0,0,0,0.45)]">
        <div className="relative min-h-[150px] md:min-h-[220px]">
          <Image
            src={heroBackground}
            alt={config.metaTitle}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.14)_0%,rgba(5,5,5,0.28)_38%,rgba(5,5,5,0.72)_100%)] dark:bg-[linear-gradient(180deg,rgba(5,5,5,0.18)_0%,rgba(5,5,5,0.36)_38%,rgba(5,5,5,0.82)_100%)]" />

          <div className="relative flex min-h-[150px] max-w-xl items-end p-5 md:min-h-[220px] md:p-8">
            <div className="space-y-2 pr-8 md:pr-0">
              <h1 className="text-md text-pretty text-balance font-semibold tracking-tight text-white/90 md:text-2xl">
                {isHome
                  ? "Discover AI Characters built for real conversations and companionship."
                  : config.heroTitle}
              </h1>
              {/* Hero description copy lives in page metadata + JSON-LD */}
              {/* <p className="hidden max-w-lg text-sm leading-6 text-white/72 sm:block">
                {isHome
                  ? "Browse AI girlfriends, AI boyfriends, and virtual companions for dating-style chat, friendship, and roleplay."
                  : config.heroDescription}
              </p> */}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <PublicFilterBar />
        <CharacterGrid
          initialProfiles={initialProfiles}
          segment={segment}
          variant={variant}
        />
      </section>
    </main>
  );
}
