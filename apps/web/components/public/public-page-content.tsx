import { CharacterGrid } from "@/components/public/character-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PUBLIC_SEGMENTS, type PublicSegment } from "@/lib/public-segments";

type PublicPageContentProps = {
  segment: PublicSegment;
  variant?: "home" | "category";
};

export function PublicPageContent({
  segment,
  variant = "home",
}: PublicPageContentProps) {
  const config = PUBLIC_SEGMENTS[segment];
  const isHome = variant === "home";

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-8">
      <section className="space-y-5 rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card/80 p-5 shadow-sm md:p-8">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">AI Dating</Badge>
          <Badge variant="secondary">AI Companions</Badge>
          <Badge variant="secondary">AI Friends</Badge>
          <Badge variant="secondary">AI Chats</Badge>
        </div>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {isHome
              ? "Discover AI companions built for dating, friendship, and immersive chat."
              : config.heroTitle}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            {isHome
              ? "FeelAI surfaces AI companions on a fully server-rendered homepage so every profile card, every keyword, and every SEO signal is readable from the first request."
              : config.heroDescription}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground md:text-base">
            Add seach and filter here
          </p>
        </div>
        <CharacterGrid segment={segment} />
      </section>
    </main>
  );
}
