import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { CharacterCard, type PublicProfileCard } from "@/components/public/character-card";
import type { PublicSeoPageConfig } from "@/lib/public-seo-pages";

type PublicSeoLandingPageProps = {
  config: PublicSeoPageConfig;
  profiles: PublicProfileCard[];
};

export function PublicSeoLandingPage({
  config,
  profiles,
}: PublicSeoLandingPageProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8">
      {/* Hero Section */}
      <section className="space-y-5 rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card/80 p-5 shadow-sm md:p-8">
        <div className="max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            <span>{config.title}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-pretty md:text-5xl">
            {config.headline}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground text-pretty md:text-lg md:leading-8">
            {config.intro}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href={config.primaryHref}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {config.primaryLabel}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/safety"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border/80 bg-background/60 px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            Safety & 18+ policy
          </Link>
        </div>
      </section>

      {/* Quick Answer & Features */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col justify-between rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card/70 p-5 md:p-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Direct answer
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
              {config.answer}
            </p>
          </div>
          <div className="mt-6 border-t border-border/50 pt-4 text-xs text-muted-foreground">
            100% virtual companions &bull; Private, encrypted chat &bull; 18+
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {config.sections.map((section) => (
            <article
              key={section.title}
              className="flex flex-col rounded-[calc(var(--radius)*1.25)] border border-border/70 bg-card/70 p-5"
            >
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {section.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
                {section.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Profiles Grid */}
      {profiles.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {config.profileHeading}
              </h2>
              <p className="mt-1 max-w-3xl text-xs text-muted-foreground md:text-sm">
                Explore real active profiles to find the companion, personality,
                and conversation style you want.
              </p>
            </div>
            <Link
              href={config.primaryHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline md:text-sm"
            >
              Browse all {config.primaryLabel.toLowerCase()}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {profiles.slice(0, 10).map((profile, index) => (
              <CharacterCard
                key={profile._id}
                isNew={index < 2}
                priority={index < 4}
                profile={profile}
                segment={config.segment}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* FAQs Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {config.faqs.map((faq) => (
            <article
              key={faq.title}
              className="rounded-[calc(var(--radius)*1.25)] border border-border/70 bg-card/70 p-5"
            >
              <h3 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
                {faq.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
                {faq.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
