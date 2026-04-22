import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PageAction = {
  href: string;
  label: string;
};

type PageSection = {
  title: string;
  description: string;
  items?: string[];
  action?: PageAction;
};

export function PublicInfoPage({
  eyebrow,
  title,
  description,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: PageSection[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-2 md:py-4">
      <section className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_24px_48px_-34px_rgba(0,0,0,0.75)] md:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          {eyebrow}
        </p>
        <div className="mt-3 max-w-3xl space-y-3">
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            {title}
          </h1>
          <p className="text-pretty text-base leading-7 text-muted-foreground md:text-lg">
            {description}
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card
            key={section.title}
            className="rounded-[2rem] border border-border/70 bg-card/85 py-5 shadow-[0_24px_48px_-34px_rgba(0,0,0,0.72)]"
          >
            <CardHeader className="gap-1 px-5">
              <CardTitle className="text-balance text-2xl font-semibold tracking-tight">
                {section.title}
              </CardTitle>
              <CardDescription className="text-pretty text-base">
                {section.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5">
              {section.items ? (
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : null}

              {section.action ? (
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={section.action.href}>
                    {section.action.label}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}