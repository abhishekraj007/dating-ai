import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PublicSegment } from "@/lib/public-segments";

type CategoryContentConfig = {
  heading: string;
  intro: string;
  features: Array<{ title: string; body: string }>;
  faqs: Array<{ question: string; answer: string }>;
  relatedGuides: Array<{ title: string; href: string; desc: string }>;
};

const CATEGORY_DATA: Record<"girls" | "guys", CategoryContentConfig> = {
  girls: {
    heading: "Explore AI Girlfriends & Virtual Dating Companions",
    intro:
      "FeelAI features a diverse collection of AI girlfriend profiles crafted for romantic banter, everyday conversation, emotional support, and immersive roleplay. Each companion has distinct personality traits, hobbies, MBTI profiles, and conversation styles.",
    features: [
      {
        title: "Distinct Blueprints",
        body: "Browse characters with varied backgrounds, careers, and interests to find the exact vibe you are looking for.",
      },
      {
        title: "Private & Safe",
        body: "Conversations are encrypted and isolated to your authenticated account. Zero public exposure.",
      },
      {
        title: "Always Available",
        body: "No waiting or matching queues. Your AI girlfriend is ready for uninterrupted conversations 24/7.",
      },
    ],
    faqs: [
      {
        question: "What is an AI girlfriend on FeelAI?",
        answer:
          "An AI girlfriend on FeelAI is a virtual character powered by artificial intelligence, designed to simulate dating-style romance, thoughtful daily chat, and creative roleplay.",
      },
      {
        question: "Can I preview AI girlfriend profiles for free?",
        answer:
          "Yes. FeelAI offers open public profile discovery so you can explore bios, photos, and personality traits before creating an account or starting a chat.",
      },
      {
        question: "How do I choose the right companion?",
        answer:
          "Use the filter bar above to browse by interests, zodiac signs, and personality tags, then click on any profile card to read their complete bio.",
      },
      {
        question: "Are AI girlfriend chats private?",
        answer:
          "Yes. All chats are private to your account and never indexed by web crawlers or visible to other users.",
      },
    ],
    relatedGuides: [
      {
        title: "AI Girlfriend Guide",
        href: "/ai-girlfriend",
        desc: "Complete guide to choosing, chatting with, and connecting with AI girlfriends.",
      },
      {
        title: "AI Dating App",
        href: "/ai-dating-app",
        desc: "How FeelAI transforms virtual companion discovery without traditional swiping fatigue.",
      },
      {
        title: "AI Roleplay Chat",
        href: "/ai-roleplay-chat",
        desc: "Tips for engaging in immersive scenarios and narrative storytelling with AI characters.",
      },
    ],
  },
  guys: {
    heading: "Explore AI Boyfriends & Virtual Companions",
    intro:
      "FeelAI offers a wide range of AI boyfriend companion profiles built for emotional depth, flirty banter, everyday companionship, and creative adventures. Compare traits, occupations, and communication styles to start a conversation with your ideal match.",
    features: [
      {
        title: "Attentive Listeners",
        body: "Companions designed for supportive dialogue, thoughtful check-ins, and engaging conversations.",
      },
      {
        title: "Confidential Chat",
        body: "All chats remain strictly confidential within your account and are never shared publicly.",
      },
      {
        title: "Dynamic Roleplay",
        body: "Explore romantic dates, slice-of-life scenarios, or imaginative adventures at your own pace.",
      },
    ],
    faqs: [
      {
        question: "What is an AI boyfriend on FeelAI?",
        answer:
          "An AI boyfriend is an interactive virtual companion created for dating-style conversation, emotional connection, flirting, and storytelling.",
      },
      {
        question: "How do I start chatting with an AI boyfriend?",
        answer:
          "Select any AI boyfriend profile card above, read their bio and personality traits, and click the Chat button to begin.",
      },
      {
        question: "Is chatting with AI boyfriends free?",
        answer:
          "You can browse profiles and begin messaging for free. Optional premium memberships unlock unlimited messages and custom media.",
      },
      {
        question: "Can I use FeelAI on my phone?",
        answer:
          "Yes. FeelAI is fully responsive and optimized for mobile browsers on iOS and Android.",
      },
    ],
    relatedGuides: [
      {
        title: "AI Boyfriend Guide",
        href: "/ai-boyfriend",
        desc: "Comprehensive guide to AI boyfriends, personality matching, and conversation styles.",
      },
      {
        title: "AI Companion App",
        href: "/ai-companion",
        desc: "Discover how virtual companions provide friendship, romance, and daily interaction.",
      },
      {
        title: "Safety & Privacy Policy",
        href: "/safety",
        desc: "Learn about our adult-only 18+ policy, transparent AI disclosures, and data protection.",
      },
    ],
  },
};

export function CategorySeoContent({ segment }: { segment: PublicSegment }) {
  if (segment !== "girls" && segment !== "guys") {
    return null;
  }

  const content = CATEGORY_DATA[segment];

  return (
    <div className="space-y-10 pt-6">
      {/* Overview */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {content.heading}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
          {content.intro}
        </p>
      </section>

      {/* Highlights */}
      <section className="grid gap-4 md:grid-cols-3">
        {content.features.map((feature) => (
          <Card
            key={feature.title}
            className="border-border/70 bg-card/70 p-5 md:p-6"
          >
            <h3 className="font-semibold tracking-tight text-foreground">
              {feature.title}
            </h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
              {feature.body}
            </p>
          </Card>
        ))}
      </section>

      {/* Related Guides */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Related guides & resources
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {content.relatedGuides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="group flex flex-col justify-between rounded-[calc(var(--radius)*1.25)] border border-border/70 bg-card/70 p-4 transition-all hover:border-primary/40 hover:bg-card"
            >
              <div>
                <h3 className="font-semibold tracking-tight text-foreground group-hover:text-primary">
                  {guide.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {guide.desc}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                <span>Read guide</span>
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Category FAQs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          Category questions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {content.faqs.map((faq) => (
            <Card
              key={faq.question}
              className="space-y-2 border-border/70 bg-card/70 p-5"
            >
              <h3 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
                {faq.question}
              </h3>
              <p className="text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
                {faq.answer}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
