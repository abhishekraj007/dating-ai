import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    <main className="flex min-w-0 flex-1 flex-col gap-8">
      <section className="space-y-5 rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card/80 p-5 shadow-sm md:p-8">
        <div className="max-w-4xl space-y-4">
          <p className="text-sm font-medium text-primary">{config.title}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-pretty md:text-5xl">
            {config.headline}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
            {config.intro}
          </p>
        </div>
        <Link
          href={config.primaryHref}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {config.primaryLabel}
          <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card/70 p-5 md:p-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Quick answer
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {config.answer}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {config.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[calc(var(--radius)*1.25)] border border-border/70 bg-card/70 p-5"
            >
              <h3 className="font-semibold tracking-tight">
                {section.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {section.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {profiles.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {config.profileHeading}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              These public profiles help visitors compare companion styles
              before entering private chat.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {profiles.slice(0, 10).map((profile, index) => (
              <CharacterCard
                key={profile._id}
                isNew={index < 2}
                priority={index < 5}
                profile={profile}
                segment={config.segment}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Common questions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {config.faqs.map((faq) => (
            <article
              key={faq.title}
              className="rounded-[calc(var(--radius)*1.25)] border border-border/70 bg-card/70 p-5"
            >
              <h3 className="font-semibold tracking-tight">{faq.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {faq.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
