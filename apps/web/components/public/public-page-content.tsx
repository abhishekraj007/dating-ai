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
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {isHome ? "Featured AI girlfriends" : config.sectionTitle}
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Public profiles rendered on the server with dark-first UI and
              light mode support.
            </p>
          </div>
        </div>
        <CharacterGrid segment={segment} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Server-rendered profile catalog</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            FeelAI ships the public profile grid as HTML so search engines can
            see companion names, ages, and descriptive copy without hydration.
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Design-system-first UI</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            The landing page reuses shadcn and radix-nova primitives instead of
            custom CSS-heavy widgets, keeping the system consistent and fast.
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle>Dark by default, light on demand</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Visitors land in a dark immersive experience first, then can switch
            to light mode instantly from the header toggle.
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4 pb-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Frequently asked questions
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Visible FAQ content supports the structured data embedded on this
            page.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>What can I use FeelAI for?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              FeelAI is built for AI dating, AI companions, AI friendship, and
              immersive conversational roleplay with always-available profiles.
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>Why is SSR important here?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Server rendering helps search engines index companion listings,
              metadata, and structured content immediately instead of relying on
              client-side rendering.
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>Does FeelAI support theme switching?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Yes. Dark mode is the default public experience, and visitors can
              move to light mode from the toggle in the top header.
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
