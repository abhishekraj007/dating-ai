import Image from "next/image";
import { CharacterGrid } from "@/components/public/character-grid";
import { DiscoverPreferenceDialog } from "@/components/public/discover-preference-dialog";
import { PublicFilterBar } from "@/components/public/public-filter-bar";
import { getSegmentConfig, type PublicSegment } from "@/lib/public-segments";

const heroBackgrounds: Record<PublicSegment, string> = {
  girls: "/gf.webp",
  guys: "/bf.webp",
  anime: "/anime.webp",
};

type PublicPageContentProps = {
  segment: PublicSegment;
  variant?: "home" | "category";
};

export function PublicPageContent({
  segment,
  variant = "home",
}: PublicPageContentProps) {
  const config = getSegmentConfig(segment);
  const isHome = variant === "home";
  const heroBackground = heroBackgrounds[segment];

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
          {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_40%)]" /> */}

          <div className="relative flex min-h-[150px] items-end p-5 md:min-h-[220px] md:p-8 max-w-md">
            <h1 className="text-md text-pretty text-balance font-semibold tracking-tight md:text-3xl text-white/82">
              {isHome
                ? "Discover AI companions built for dating, friendship, and immersive chat."
                : config.heroTitle}
            </h1>

            {/* <div className="max-w-3xl space-y-4 rounded-[calc(var(--radius)*1.25)] border border-white/12 bg-black/18 p-5 text-white shadow-[0_26px_60px_-42px_rgba(0,0,0,0.8)] backdrop-blur-md md:p-7">
              <h1 className="text-4xl text-balance font-semibold tracking-tight md:text-5xl">
                {isHome
                  ? "Discover AI companions built for dating, friendship, and immersive chat."
                  : config.heroTitle}
              </h1>
            </div> */}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <PublicFilterBar />
        <CharacterGrid segment={segment} variant={variant} />
      </section>
    </main>
  );
}
