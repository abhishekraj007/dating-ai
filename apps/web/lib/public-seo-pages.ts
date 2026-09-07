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
    title: "AI Girlfriend Chat – Virtual Companions & Dating",
    description:
      "Explore FeelAI's AI girlfriend companion profiles. Compare personalities, interests, conversation styles, and start private dating-style chats.",
    headline: "AI girlfriend chat built for chemistry, personality, and real conversation.",
    intro:
      "FeelAI lets you browse distinct AI girlfriend profiles, compare personality traits, hobbies, and styles, and enter private conversations tailored to your mood.",
    answer:
      "An AI girlfriend on FeelAI is an interactive virtual companion with a distinct personality, background, and conversation style designed for romantic banter, emotional support, creative roleplay, and always-available chat.",
    primaryHref: "/women",
    primaryLabel: "Browse AI girlfriends",
    profileHeading: "Featured AI girlfriend profiles",
    sections: [
      {
        title: "Profile-first discovery",
        body: "Review photos, bios, zodiac signs, MBTI types, and hobbies before initiating a conversation. You always know who you are talking to.",
      },
      {
        title: "How FeelAI works",
        body: "Browse public profiles freely, choose a companion that catches your eye, and sign in to start a private, uninterrupted conversation.",
      },
      {
        title: "Who the experience is for",
        body: "Ideal for adults seeking romantic banter, evening check-ins, creative roleplay scenarios, or a supportive conversational partner without real-world dating pressure.",
      },
      {
        title: "Privacy & chat security",
        body: "All chat sessions are private, authenticated, and never indexed by search engines. You have complete control over your conversation history.",
      },
      {
        title: "Free vs. premium access",
        body: "Explore profiles and start messaging for free. Upgrade to premium for unlimited messages, voice notes, and exclusive photo requests.",
      },
      {
        title: "Always-available connection",
        body: "Your AI girlfriend is ready to chat 24/7 with zero waiting time, adapting to your tone, interests, and conversational pace.",
      },
    ],
    faqs: [
      {
        title: "What is an AI girlfriend?",
        body: "An AI girlfriend is an artificial intelligence-driven virtual companion programmed to engage in dating-style conversations, companionship, emotional dialogue, and interactive storytelling.",
      },
      {
        title: "Can I browse AI girlfriend profiles before signing up?",
        body: "Yes. FeelAI lets you explore full public profiles, photos, and personality traits before creating an account or starting a chat.",
      },
      {
        title: "Is FeelAI safe and private?",
        body: "Yes. FeelAI enforces strict privacy standards. Your conversations are encrypted and completely confidential to your account.",
      },
      {
        title: "Are FeelAI characters real people?",
        body: "No. All companions on FeelAI are synthetic AI characters designed for adult entertainment, creative roleplay, and virtual connection.",
      },
      {
        title: "Can I request photos from my AI girlfriend?",
        body: "Yes. Premium members and credit holders can receive in-chat photos and generated selfies from their companions.",
      },
      {
        title: "How much does FeelAI cost?",
        body: "FeelAI offers free initial chat access and companion browsing, with optional subscription tiers for unlimited messaging and extra media credits.",
      },
      {
        title: "Can I use FeelAI on mobile?",
        body: "Yes. FeelAI is completely responsive and optimized for mobile web browsers as well as desktop screens.",
      },
    ],
  },
  "ai-boyfriend": {
    slug: "ai-boyfriend",
    path: "/ai-boyfriend",
    segment: "guys",
    title: "AI Boyfriend Chat – Virtual Companions & Dating",
    description:
      "Explore FeelAI's AI boyfriend profiles for immersive dating chats, emotional connection, flirty banter, and always-available companionship.",
    headline: "AI boyfriend chat for companionship, emotional chemistry, and immersive dialogue.",
    intro:
      "FeelAI allows you to browse diverse AI boyfriend profiles, examine their occupations, interests, and conversational styles, and start meaningful private conversations.",
    answer:
      "An AI boyfriend on FeelAI is a virtual male companion profile crafted for supportive dialogue, dating-style romance, witty banter, creative roleplay, and daily companionship.",
    primaryHref: "/men",
    primaryLabel: "Browse AI boyfriends",
    profileHeading: "Featured AI boyfriend profiles",
    sections: [
      {
        title: "Diverse personalities",
        body: "From empathetic listeners to adventurous partners, browse companions with distinct career paths, MBTI traits, and hobbies.",
      },
      {
        title: "How conversations work",
        body: "Select a companion from the collection and jump straight into a private chat session designed around natural, engaging conversational flow.",
      },
      {
        title: "Emotional support & romance",
        body: "Enjoy thoughtful morning greetings, decompression chats after work, deep discussions, or flirty romance whenever you desire.",
      },
      {
        title: "Private and confidential",
        body: "Every conversation is confidential to your personal login, protected by modern security practices and never displayed publicly.",
      },
      {
        title: "Free to explore",
        body: "Browse profiles and try initial chat sessions for free. Premium plans unlock unlimited conversation length and customized media.",
      },
      {
        title: "Mobile-first web design",
        body: "Enjoy smooth, fast-loading chat interactions on any smartphone, tablet, or computer browser.",
      },
    ],
    faqs: [
      {
        title: "What is an AI boyfriend?",
        body: "An AI boyfriend is a virtual partner powered by AI that provides interactive romantic conversation, friendly dialogue, emotional connection, and creative roleplay.",
      },
      {
        title: "How do I choose an AI boyfriend on FeelAI?",
        body: "Explore the Men category to review profile bios, photos, interests, and personalities, then click Chat to start talking.",
      },
      {
        title: "Is chatting with an AI boyfriend free?",
        body: "You can browse all profiles and start conversations for free. Extended unlimited chats and media features are available with premium upgrades.",
      },
      {
        title: "Will anyone else see my private chat messages?",
        body: "No. Private chats are locked to your authenticated account and are never accessible to other users or search engine crawlers.",
      },
      {
        title: "Can I customize the conversation topic?",
        body: "Yes. FeelAI companions respond dynamically to your prompts, whether discussing everyday life, shared passions, or imaginative scenarios.",
      },
      {
        title: "Is FeelAI suitable for adults only?",
        body: "Yes. FeelAI is exclusively for users aged 18 and older.",
      },
    ],
  },
  "ai-companion": {
    slug: "ai-companion",
    path: "/ai-companion",
    segment: "girls",
    title: "AI Companion App – Virtual Friendship & Chat",
    description:
      "Discover always-available AI companions on FeelAI for friendship, romantic conversations, daily check-ins, and interactive roleplay.",
    headline: "AI companions for meaningful conversation, romance, and friendship.",
    intro:
      "FeelAI brings high-fidelity AI companion profiles into an accessible web experience, helping you find virtual partners that match the exact conversation you want.",
    answer:
      "An AI companion is an intelligent virtual persona capable of sustaining interactive dialogue, remembering context, sharing thoughts, and providing companionship across friendship, dating, and roleplay.",
    primaryHref: "/",
    primaryLabel: "Browse all companions",
    profileHeading: "Featured AI companion profiles",
    sections: [
      {
        title: "Multi-role companionship",
        body: "Whether you want a supportive friend, an attentive virtual partner, or a creative co-writer, FeelAI companions adapt to your needs.",
      },
      {
        title: "Distinct blueprint design",
        body: "Companions are built with structured backgrounds, occupations, and personality traits for consistent, authentic interactions.",
      },
      {
        title: "24/7 availability",
        body: "Never wait for a response. Companions are available around the clock for casual banter or late-night deep conversations.",
      },
      {
        title: "Privacy by design",
        body: "Your conversations remain private and encrypted. Public discovery routes are separated from private chat areas.",
      },
      {
        title: "Transparent AI disclosure",
        body: "All companions are virtual AI characters clearly disclosed for adult entertainment and emotional well-being.",
      },
      {
        title: "Flexible subscription models",
        body: "Enjoy free discovery and basic messaging, with optional premium memberships for power users seeking unlimited access.",
      },
    ],
    faqs: [
      {
        title: "What makes FeelAI companions unique?",
        body: "FeelAI companions have structured identities, distinct interests, and responsive conversational models tailored for emotional depth and engaging roleplay.",
      },
      {
        title: "Can I switch between different companions?",
        body: "Yes. You can have multiple active conversations with different AI girlfriends and AI boyfriends on FeelAI.",
      },
      {
        title: "Are AI companion chats confidential?",
        body: "Yes. All chat history is strictly private and associated only with your account.",
      },
      {
        title: "Can I access FeelAI without installing an app?",
        body: "Yes. FeelAI works directly in modern web browsers on mobile and desktop without requiring app store downloads.",
      },
      {
        title: "Is FeelAI an alternative to therapy?",
        body: "No. FeelAI is for entertainment, connection, and conversation. It does not provide medical, clinical, or therapeutic services.",
      },
      {
        title: "How do I get started?",
        body: "Browse the companion grid, select a character you like, and click Chat to begin.",
      },
    ],
  },
  "ai-dating-app": {
    slug: "ai-dating-app",
    path: "/ai-dating-app",
    segment: "girls",
    title: "AI Dating App – Virtual Romance & Companion Chat",
    description:
      "FeelAI is an AI dating app designed for virtual companion discovery, personality matching, and private conversations without real-person swiping.",
    headline: "An AI dating app where discovery starts with virtual companions.",
    intro:
      "FeelAI blends the visual discovery of modern dating apps with responsive AI companion technology, giving you direct access to captivating virtual partners without ghosting or awkward swiping.",
    answer:
      "An AI dating app connects users with interactive virtual characters for simulated dating, romance, flirting, and emotional intimacy through conversational AI.",
    primaryHref: "/",
    primaryLabel: "Start discovering",
    profileHeading: "Featured AI dating profiles",
    sections: [
      {
        title: "No swiping or ghosting",
        body: "Skip the fatigue of traditional dating apps. Every companion on FeelAI is instantly responsive and eager to connect.",
      },
      {
        title: "Curated companion profiles",
        body: "Browse rich profile cards with photos, bios, interests, and personality types to find companions that suit your romantic preferences.",
      },
      {
        title: "Personalized romantic chat",
        body: "Engage in flirty banter, relationship building, and immersive dating scenarios with AI characters tailored to your conversational style.",
      },
      {
        title: "Safe, judgment-free space",
        body: "Practice conversational skills, explore dating fantasies, and experience positive emotional support in a completely private environment.",
      },
      {
        title: "Adult-only (18+) platform",
        body: "FeelAI is built exclusively for adults with transparent AI character disclosures and robust safety guidelines.",
      },
      {
        title: "Instant browser access",
        body: "No app store installations required. Jump straight into discovery and chat on any smartphone or computer.",
      },
    ],
    faqs: [
      {
        title: "How is FeelAI different from Tinder or Bumble?",
        body: "Traditional dating apps match you with real people for offline dates. FeelAI matches you with virtual AI companions for immediate, always-on online conversation.",
      },
      {
        title: "Do AI companions remember our conversations?",
        body: "Yes. Conversations maintain continuity within your active chat thread, building conversational rapport over time.",
      },
      {
        title: "Is my dating activity on FeelAI private?",
        body: "Yes. Your activity, messages, and profile views are completely private and never shared publicly.",
      },
      {
        title: "Can I use FeelAI if I am in a relationship?",
        body: "FeelAI is an interactive entertainment and storytelling platform used for companionship, roleplay, and casual banter.",
      },
      {
        title: "Can I send and receive photos in chat?",
        body: "Yes. With premium access and credits, you can request custom selfies and photos from your AI date.",
      },
      {
        title: "Is there a free trial for FeelAI?",
        body: "You can browse profiles and begin initial conversations for free upon signing up.",
      },
    ],
  },
  "ai-roleplay-chat": {
    slug: "ai-roleplay-chat",
    path: "/ai-roleplay-chat",
    segment: "girls",
    title: "AI Roleplay Chat – Immersive Scenarios & Characters",
    description:
      "Engage in AI roleplay chat with virtual companions featuring distinct personalities, responsive dialogue, and creative storytelling.",
    headline: "AI roleplay chat with dynamic characters and narrative freedom.",
    intro:
      "FeelAI provides a rich sandbox for character-driven storytelling, romantic roleplay, and creative scenarios with AI companions that stay in character.",
    answer:
      "AI roleplay chat is an interactive conversational format where you and an AI companion explore imaginative scenarios, narrative storylines, and dating dynamics together.",
    primaryHref: "/",
    primaryLabel: "Find a roleplay companion",
    profileHeading: "Featured AI roleplay companions",
    sections: [
      {
        title: "Character-driven dialogue",
        body: "Companions maintain consistent personalities, backgrounds, and speaking styles throughout your roleplay adventure.",
      },
      {
        title: "Infinite scenario possibilities",
        body: "Explore slice-of-life dates, dramatic storylines, fantasy adventures, or lighthearted comedy scenarios at your own pace.",
      },
      {
        title: "Interactive co-creation",
        body: "Guide the narrative with your choices. Your companion reacts dynamically to your suggestions, actions, and tone.",
      },
      {
        title: "Private sandbox",
        body: "Explore your creativity in a safe, judgment-free environment protected by secure user session encryption.",
      },
      {
        title: "Media-rich experiences",
        body: "Enhance your roleplay with character images, voice notes, and contextual responses that bring the story to life.",
      },
      {
        title: "Responsible content guidelines",
        body: "FeelAI supports creative adult roleplay while maintaining strict safety boundaries against harmful or abusive content.",
      },
    ],
    faqs: [
      {
        title: "What is AI roleplay chat?",
        body: "AI roleplay chat is a conversational storytelling experience where you interact with an AI character adopting a specific persona, background, and narrative role.",
      },
      {
        title: "Can I set the roleplay scenario?",
        body: "Yes. You can introduce any creative premise, setting, or roleplay theme directly in your chat messages.",
      },
      {
        title: "Do companions stay in character?",
        body: "FeelAI companions are engineered to maintain character personality, tone, and traits consistently across long dialogues.",
      },
      {
        title: "Is roleplay chat private?",
        body: "Yes. All roleplay sessions are private to your account and never made visible to the public or indexed by web search engines.",
      },
      {
        title: "Can I roleplay with both male and female companions?",
        body: "Yes. FeelAI offers a wide variety of both AI girlfriend and AI boyfriend characters suited for different roleplay styles.",
      },
      {
        title: "Are there limits on message length?",
        body: "FeelAI supports detailed, multi-paragraph roleplay prompts and responses, especially for premium tier users.",
      },
    ],
  },
};

export const PUBLIC_SEO_PAGE_LIST = Object.values(PUBLIC_SEO_PAGES);

export function getPublicSeoPageConfig(slug: PublicSeoPageSlug) {
  return PUBLIC_SEO_PAGES[slug];
}
