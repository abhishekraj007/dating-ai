export type PublicSegment = "girls" | "guys" | "anime";
export type DiscoverGenderPreference = "female" | "male" | "both";

/**
 * Feature flag — set to true to enable the Anime section across
 * tabs, sidebar, header, the /ai-anime route, and the sitemap.
 */
export const ANIME_ENABLED = false;

type SegmentConfig = {
  label: string;
  href: string;
  heroTitle: string;
  heroDescription: string;
  sectionTitle: string;
  metaTitle: string;
  metaDescription: string;
};

const ALL_SEGMENTS: Record<PublicSegment, SegmentConfig> = {
  girls: {
    label: "Girls",
    href: "/ai-girlfriend",
    heroTitle: "Meet AI Women built for immersive dating and chat.",
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
    heroTitle: "Discover AI Men built for companionship and dating.",
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

/** Active segments — derived from ANIME_ENABLED. Header, sidebar, and sitemap iterate this. */
export const PUBLIC_SEGMENTS: Partial<Record<PublicSegment, SegmentConfig>> =
  ANIME_ENABLED
    ? ALL_SEGMENTS
    : { girls: ALL_SEGMENTS.girls, guys: ALL_SEGMENTS.guys };

/** Convenience accessor that always returns a config (fallback to girls). */
export function getSegmentConfig(segment: PublicSegment): SegmentConfig {
  return ALL_SEGMENTS[segment];
}

export function segmentFromPathname(pathname: string): PublicSegment {
  if (pathname.startsWith("/ai-boyfriends")) {
    return "guys";
  }

  if (ANIME_ENABLED && pathname.startsWith("/ai-anime")) {
    return "anime";
  }

  return "girls";
}

export function segmentFromGenderPreference(
  genderPreference: DiscoverGenderPreference | null | undefined,
): PublicSegment {
  return genderPreference === "male" ? "guys" : "girls";
}

export function genderPreferenceFromSegment(
  segment: PublicSegment,
): DiscoverGenderPreference | null {
  if (segment === "girls") {
    return "female";
  }

  if (segment === "guys") {
    return "male";
  }

  return null;
}
