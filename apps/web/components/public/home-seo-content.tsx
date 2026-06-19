import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles, Users, Heart, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PUBLIC_SEO_PAGE_LIST } from "@/lib/public-seo-pages";

const howItWorksSteps = [
  {
    number: "1",
    title: "Browse companion profiles",
    description:
      "Explore public AI girlfriend and AI boyfriend profiles with photos, bios, interests, and personality traits. No sign-up needed to start discovering.",
  },
  {
    number: "2",
    title: "Pick your match",
    description:
      "Filter by interests, personality, and style to find the AI companion that fits the kind of conversation you want, from casual chat to immersive roleplay.",
  },
  {
    number: "3",
    title: "Start chatting",
    description:
      "Sign in to begin a private conversation with your chosen AI companion. Chat anytime, build a connection, and explore dating-style dialogue at your own pace.",
  },
];

const features = [
  {
    icon: Users,
    title: "Profile-first discovery",
    description:
      "Every AI companion has a detailed profile with personality cues, interests, occupation, and conversation style so you know who you are chatting with before you start.",
  },
  {
    icon: MessageCircle,
    title: "Private AI chat",
    description:
      "Move from browsing to private conversation in one tap. Chat with AI girlfriends and AI boyfriends for dating-style dialogue, flirting, and companionship.",
  },
  {
    icon: Sparkles,
    title: "Roleplay and creativity",
    description:
      "Use AI companion profiles for creative roleplay, story-driven conversations, and immersive scenarios. Each character brings a unique personality to the chat.",
  },
  {
    icon: Heart,
    title: "Always-on companionship",
    description:
      "AI companions are available any time. Whether you want a quick chat, a deep conversation, or someone to talk to late at night, your companion is ready.",
  },
];

const faqs = [
  {
    question: "What is FeelAI?",
    answer:
      "FeelAI is an AI dating platform where users discover AI companions, AI friends, and immersive chat experiences built for always-on conversations.",
  },
  {
    question: "Can I browse AI companion profiles before signing in?",
    answer:
      "Yes. FeelAI shows public AI companion profiles before sign-in so visitors can browse featured personalities and choose who they want to chat with.",
  },
  {
    question: "How do I find the right AI companion on FeelAI?",
    answer:
      "Start with public AI companion profiles, then use filters to find personalities and interests that match the conversation you want.",
  },
  {
    question: "Is FeelAI a traditional dating app?",
    answer:
      "No. FeelAI is an AI dating app for virtual companion chat, not a platform for matching with real people. All companions are AI characters.",
  },
  {
    question: "Can I use FeelAI for roleplay?",
    answer:
      "Yes. FeelAI companion profiles support creative roleplay, character-driven dialogue, dating-style conversation, and ongoing interactive stories.",
  },
  {
    question: "Are my chats private?",
    answer:
      "Public discovery pages help you browse and choose companions, while all actual conversations happen in the private signed-in experience.",
  },
];

export function HomeSeoContent() {
  return (
    <div className="space-y-12 pt-4">
      {/* Intro section */}
      <section className="max-w-3xl space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          AI companions for dating-style chat, roleplay, and friendship
        </h2>
        <p className="text-base leading-7 text-muted-foreground">
          FeelAI is an AI dating app where you can browse AI girlfriend and AI
          boyfriend profiles, compare personalities and interests, and start
          private conversations with virtual companions. Whether you want casual
          chat, emotional connection, creative roleplay, or dating-style
          dialogue, FeelAI helps you find the right companion for the
          conversation you want.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          How FeelAI works
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {howItWorksSteps.map((step) => (
            <Card
              key={step.number}
              className="space-y-3 border-border/70 bg-card/70 p-5 md:p-6"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {step.number}
              </div>
              <h3 className="font-semibold tracking-tight">{step.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Why people choose FeelAI
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="flex gap-4 border-border/70 bg-card/70 p-5 md:p-6"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="size-5 text-primary" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Category links */}
      <section className="space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Explore by category
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Learn more about each type of AI companion experience on FeelAI with
          dedicated guides for every conversation style.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_SEO_PAGE_LIST.map((page) => (
            <Link
              key={page.slug}
              href={page.path}
              className="group flex items-center justify-between gap-3 rounded-[calc(var(--radius)*1.25)] border border-border/70 bg-card/70 p-4 transition-all hover:border-primary/40 hover:bg-card"
            >
              <div className="min-w-0 space-y-1">
                <h3 className="font-semibold tracking-tight">{page.title}</h3>
                <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                  {page.description}
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Frequently asked questions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card
              key={faq.question}
              className="space-y-2 border-border/70 bg-card/70 p-5"
            >
              <h3 className="font-semibold tracking-tight">
                {faq.question}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {faq.answer}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="flex flex-col items-start gap-4 rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card/70 p-6 md:flex-row md:items-center md:gap-6 md:p-8">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Shield className="size-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Private, secure, and always available
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Public profile pages are indexed for discovery, but all conversations
            happen in a private, signed-in environment. FeelAI is built for
            adults who want to explore AI companion chat in a safe and private
            space.
          </p>
        </div>
      </section>
    </div>
  );
}
