import type { PublicSegment } from "@/lib/public-segments";

export type PublicSeoPageSlug =
  | "ai-girlfriend"
  | "ai-boyfriend"
  | "ai-companion"
  | "ai-dating-app"
  | "ai-roleplay-chat";

type PublicSeoSection = {
  title: string;
  body: string;
};

export type PublicSeoPageConfig = {
  slug: PublicSeoPageSlug;
  path: string;
  segment: PublicSegment;
  title: string;
  description: string;
  headline: string;
  intro: string;
  answer: string;
  primaryHref: string;
  primaryLabel: string;
  profileHeading: string;
  sections: PublicSeoSection[];
  faqs: PublicSeoSection[];
};

export const PUBLIC_SEO_PAGES: Record<
  PublicSeoPageSlug,
  PublicSeoPageConfig
> = {
  "ai-girlfriend": {
    slug: "ai-girlfriend",
    path: "/ai-girlfriend",
    segment: "girls",
    title: "AI Girlfriend Chat",
    description:
      "Explore FeelAI's AI girlfriend profiles for dating-style chat, emotional companionship, roleplay, and always-on conversation.",
    headline: "AI girlfriend chat built around personality, chemistry, and conversation.",
    intro:
      "FeelAI helps you browse AI girlfriend profiles, compare personalities and interests, and start a private chat with the companion that fits your mood.",
    answer:
      "An AI girlfriend on FeelAI is a virtual companion profile designed for dating-style conversation, flirting, roleplay, friendship, and ongoing emotional connection.",
    primaryHref: "/women",
    primaryLabel: "Browse AI girlfriends",
    profileHeading: "Featured AI girlfriend profiles",
    sections: [
      {
        title: "Profile-first discovery",
        body: "Each public profile highlights the companion's name, personality cues, interests, and conversation style before you start chatting.",
      },
      {
        title: "Conversation variety",
        body: "Use AI girlfriend profiles for light flirting, deeper companionship, creative roleplay, or casual daily conversation.",
      },
      {
        title: "Private after sign-in",
        body: "Discovery pages are public, while actual chats happen inside the signed-in FeelAI experience.",
      },
    ],
    faqs: [
      {
        title: "What is an AI girlfriend?",
        body: "An AI girlfriend is a virtual companion designed for dating-style conversation, companionship, and roleplay through AI chat.",
      },
      {
        title: "Can I browse profiles before chatting?",
        body: "Yes. FeelAI lets visitors view public AI girlfriend profiles before choosing who to chat with.",
      },
    ],
  },
  "ai-boyfriend": {
    slug: "ai-boyfriend",
    path: "/ai-boyfriend",
    segment: "guys",
    title: "AI Boyfriend Chat",
    description:
      "Explore FeelAI's AI boyfriend profiles for virtual companionship, dating-style chat, roleplay, and emotional conversation.",
    headline: "AI boyfriend chat for companionship, chemistry, and immersive conversation.",
    intro:
      "FeelAI lets you browse AI boyfriend profiles, compare interests and personality traits, and start private conversations with virtual companions.",
    answer:
      "An AI boyfriend on FeelAI is a virtual male companion profile built for dating-style conversation, support, flirting, roleplay, and everyday chat.",
    primaryHref: "/men",
    primaryLabel: "Browse AI boyfriends",
    profileHeading: "Featured AI boyfriend profiles",
    sections: [
      {
        title: "Browse by personality",
        body: "Public profiles make it easier to pick an AI boyfriend based on interests, vibe, occupation, and conversation style.",
      },
      {
        title: "Built for repeat chats",
        body: "FeelAI focuses on companion profiles that feel easy to return to for daily conversation and roleplay.",
      },
      {
        title: "Mobile-first web experience",
        body: "The public web app is responsive, so visitors can browse and choose companions from mobile or desktop.",
      },
    ],
    faqs: [
      {
        title: "What is an AI boyfriend?",
        body: "An AI boyfriend is a virtual companion designed for dating-style chat, companionship, flirting, and roleplay.",
      },
      {
        title: "Does FeelAI have public AI boyfriend profiles?",
        body: "Yes. FeelAI publishes browsable AI boyfriend profiles so visitors can compare companions before signing in.",
      },
    ],
  },
  "ai-companion": {
    slug: "ai-companion",
    path: "/ai-companion",
    segment: "girls",
    title: "AI Companion App",
    description:
      "Use FeelAI to discover AI companions for friendship, dating-style chat, roleplay, and always-available conversation.",
    headline: "AI companions for dating-style chat, friendship, and roleplay.",
    intro:
      "FeelAI brings AI companion profiles into a browsable web experience, helping you find personalities that fit the kind of conversation you want.",
    answer:
      "An AI companion is a virtual character you can chat with for friendship, emotional conversation, creative roleplay, dating-style dialogue, or casual everyday messages.",
    primaryHref: "/",
    primaryLabel: "Browse companions",
    profileHeading: "Featured AI companion profiles",
    sections: [
      {
        title: "Clear companion profiles",
        body: "Profiles give visitors a quick read on interests, personality, style, and profile imagery before starting a chat.",
      },
      {
        title: "Flexible conversation goals",
        body: "FeelAI companions can support romantic chat, friendship, story-driven roleplay, or simple daily conversation.",
      },
      {
        title: "Search-friendly public pages",
        body: "Public companion pages are built to be discoverable while keeping private chat areas out of search results.",
      },
    ],
    faqs: [
      {
        title: "What can I use an AI companion for?",
        body: "AI companions can be used for casual conversation, roleplay, dating-style chat, emotional support-style dialogue, and creative storytelling.",
      },
      {
        title: "Are FeelAI chats public?",
        body: "No. Public pages help with discovery, while chats happen in the private signed-in experience.",
      },
    ],
  },
  "ai-dating-app": {
    slug: "ai-dating-app",
    path: "/ai-dating-app",
    segment: "girls",
    title: "AI Dating App",
    description:
      "FeelAI is an AI dating app for discovering virtual companions, browsing AI profiles, and starting immersive dating-style chats.",
    headline: "An AI dating app where discovery starts with virtual companion profiles.",
    intro:
      "FeelAI combines public AI companion discovery with private chat, giving visitors a fast way to browse profiles before choosing a conversation partner.",
    answer:
      "An AI dating app lets adults interact with virtual companions through AI chat instead of matching with real people. FeelAI focuses on browsable AI profiles and private dating-style conversations.",
    primaryHref: "/",
    primaryLabel: "Start discovering",
    profileHeading: "Featured AI dating profiles",
    sections: [
      {
        title: "Different from traditional dating apps",
        body: "FeelAI is built for AI companion conversation, not real-person matching or offline dating.",
      },
      {
        title: "Public discovery, private chat",
        body: "Searchable public pages help visitors understand the app, while chat, billing, and account areas stay outside indexing.",
      },
      {
        title: "Companion categories",
        body: "Visitors can browse AI girlfriend and AI boyfriend collections, then filter by interests inside the app experience.",
      },
    ],
    faqs: [
      {
        title: "Is FeelAI a traditional dating app?",
        body: "No. FeelAI is an AI dating app for virtual companion chat, not a platform for matching with real people.",
      },
      {
        title: "Who is FeelAI for?",
        body: "FeelAI is for adults who want to explore virtual companion profiles and private AI conversations.",
      },
    ],
  },
  "ai-roleplay-chat": {
    slug: "ai-roleplay-chat",
    path: "/ai-roleplay-chat",
    segment: "girls",
    title: "AI Roleplay Chat",
    description:
      "Discover FeelAI companions for AI roleplay chat, immersive character conversations, dating-style dialogue, and creative scenarios.",
    headline: "AI roleplay chat with virtual companions that have distinct personalities.",
    intro:
      "FeelAI profiles make roleplay easier to start by showing a companion's interests, personality traits, style, and conversation cues upfront.",
    answer:
      "AI roleplay chat uses virtual companion profiles to support creative scenarios, character-driven dialogue, dating-style conversation, and ongoing interactive stories.",
    primaryHref: "/",
    primaryLabel: "Find a roleplay companion",
    profileHeading: "Featured AI roleplay companions",
    sections: [
      {
        title: "Character-driven conversations",
        body: "Public profiles help visitors choose a companion whose personality and interests fit the roleplay scenario they want.",
      },
      {
        title: "Good for light or immersive prompts",
        body: "FeelAI supports simple casual chat as well as deeper roleplay sessions once a visitor starts a private conversation.",
      },
      {
        title: "Discovery pages stay crawlable",
        body: "Guide and profile pages are public, while private roleplay chats are intentionally excluded from search indexing.",
      },
    ],
    faqs: [
      {
        title: "What is AI roleplay chat?",
        body: "AI roleplay chat is a conversation with a virtual character where you can explore scenarios, moods, personalities, and story-driven dialogue.",
      },
      {
        title: "Can I choose a companion by personality?",
        body: "Yes. FeelAI profile pages show personality traits, interests, and bios so visitors can pick a companion before chatting.",
      },
    ],
  },
};

export const PUBLIC_SEO_PAGE_LIST = Object.values(PUBLIC_SEO_PAGES);

export function getPublicSeoPageConfig(slug: PublicSeoPageSlug) {
  return PUBLIC_SEO_PAGES[slug];
}
