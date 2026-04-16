// Zodiac signs for filtering
export const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpius",
  "Sagittarius",
  "Capricornus",
  "Aquarius",
  "Pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

// Interests for profile matching and filtering
export const INTERESTS = [
  // --- Lifestyle ---
  "Travel",
  "Cooking",
  "Fitness",
  "Yoga",
  "Hiking",
  "Fashion",
  "Foodie",
  "Wine Tasting",
  "Coffee",
  "Meditation",
  "Nature",
  "Adventure",
  "Pets",
  // --- Social & Entertainment ---
  "Movies",
  "Music",
  "Gaming",
  "Dancing",
  "Karaoke",
  "Comedy",
  "Stand-up Comedy",
  "Board Games",
  "Sports",
  // --- Creative ---
  "Photography",
  "Art",
  "Reading",
  "Writing",
  "Poetry",
  "Pottery",
  // --- Active & Outdoors ---
  "Surfing",
  "Scuba Diving",
  "Snowboarding",
  // --- Dating & Romance ---
  "Deep Conversations",
  "Late Night Talks",
  "Flirting",
  "Romance",
  "Cuddling",
  "Roleplay",
  "Cosplay",
  // --- Adult / Spicy ---
  "Intimacy",
  "Dirty Talk",
  "Sexting",
  "BDSM",
  "Fantasy",
] as const;

export type Interest = (typeof INTERESTS)[number];

// Interest emojis for display
export const INTEREST_EMOJIS: Record<string, string> = {
  // Lifestyle
  Travel: "✈️",
  Cooking: "🍳",
  Fitness: "💪",
  Yoga: "🧘",
  Hiking: "🥾",
  Fashion: "👗",
  Foodie: "🍽️",
  "Wine Tasting": "🍷",
  Coffee: "☕",
  Meditation: "🧘",
  Nature: "🌿",
  Adventure: "🗺️",
  Pets: "🐕",
  // Social & Entertainment
  Movies: "🎬",
  Music: "🎵",
  Gaming: "🎮",
  Dancing: "💃",
  Karaoke: "🎤",
  Comedy: "😂",
  "Stand-up Comedy": "🎙️",
  "Board Games": "🎲",
  Sports: "🏀",
  // Creative
  Photography: "📷",
  Art: "🎨",
  Reading: "📚",
  Writing: "✍️",
  Poetry: "📝",
  Pottery: "🏺",
  // Active & Outdoors
  Surfing: "🏄",
  "Scuba Diving": "🤿",
  Snowboarding: "🏂",
  // Dating & Romance
  "Deep Conversations": "💬",
  "Late Night Talks": "🌙",
  Flirting: "😏",
  Romance: "💕",
  Cuddling: "🤗",
  Roleplay: "🎭",
  Cosplay: "🦸",
  // Adult / Spicy
  Intimacy: "💋",
  "Dirty Talk": "🔥",
  Sexting: "📱",
  BDSM: "⛓️",
  Fantasy: "✨",
};
