const RESERVED_PUBLIC_PROFILE_SLUGS = new Set([
  "_next",
  "about",
  "ai-boyfriend",
  "ai-companion",
  "ai-dating-app",
  "ai-girlfriend",
  "ai-roleplay-chat",
  "api",
  "anime",
  "chat",
  "checkout",
  "contact",
  "help",
  "login",
  "men",
  "onboarding",
  "portal",
  "pricing",
  "privacy",
  "safety",
  "settings",
  "store-screenshots",
  "support",
  "terms",
  "women",
]);

export function normalizePublicProfileUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

export function isReservedPublicProfileUsername(value: string) {
  const normalizedUsername = normalizePublicProfileUsername(value);
  return !normalizedUsername || RESERVED_PUBLIC_PROFILE_SLUGS.has(normalizedUsername);
}
