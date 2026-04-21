export type PublicSegment = "girls" | "anime" | "guys";

type SegmentConfig = {
  label: string;
  href: string;
  heroTitle: string;
  heroDescription: string;
  sectionTitle: string;
  metaTitle: string;
  metaDescription: string;
};

export const PUBLIC_SEGMENTS: Record<PublicSegment, SegmentConfig> = {
  girls: {
    label: "Girls",
    href: "/ai-girlfriend",
    heroTitle: "Meet AI girlfriends built for immersive dating and chat.",
    heroDescription:
      "Explore AI girlfriends designed for flirting, companionship, roleplay, and always-on conversation.",
    sectionTitle: "Featured AI girlfriends",
    metaTitle: "AI Girlfriend",
    metaDescription:
      "Browse AI girlfriend profiles built for immersive dating, roleplay, and always-on companionship.",
  },
  guys: {
    label: "Guys",
    href: "/ai-boyfriends",
    heroTitle:
      "Discover AI boyfriends for companionship, dating, and roleplay.",
    heroDescription:
      "Browse AI boyfriend profiles created for emotional connection, flirty chat, and always-available companionship.",
    sectionTitle: "Featured AI boyfriends",
    metaTitle: "AI Boyfriends",
    metaDescription:
      "Explore AI boyfriend profiles for immersive dating chats, roleplay, and virtual companionship.",
  },
  anime: {
    label: "Anime",
    href: "/ai-anime",
    heroTitle: "Explore anime AI companions crafted for fantasy and roleplay.",
    heroDescription:
      "Discover anime-inspired AI companions built for stylized conversation, roleplay, and immersive chats.",
    sectionTitle: "Anime AI companions",
    metaTitle: "AI Anime",
    metaDescription:
      "Discover anime AI companions designed for fantasy chat, roleplay, and immersive AI conversations.",
  },
};

export function segmentFromPathname(pathname: string): PublicSegment {
  if (pathname.startsWith("/ai-boyfriends")) {
    return "guys";
  }

  if (pathname.startsWith("/ai-anime")) {
    return "anime";
  }

  return "girls";
}
