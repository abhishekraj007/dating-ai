export type Gender = "female" | "male";

// --- Ethnicity vocabulary ---
//
// Vocabulary chosen for how real users self-identify, not anthropological
// taxonomy. Asia gets specific nationalities because English-speaking users
// actually distinguish them; Africa/Europe/Latin America get broader buckets
// because users rarely filter below that level. Matches typical dating-app
// conventions (Hinge/Bumble) adjusted toward plain-language labels.
//
// Used in three places:
//   1) `aiProfiles.ethnicity` - stored on every generated profile.
//   2) Candidate blueprint Zod schema - LLM is forced to pick from this list.
//   3) Vision analysis in reference mode - vision LLM constrained to same list.
//
// When adding/removing entries, keep in mind: any value written to
// `aiProfiles.ethnicity` must appear in this list for the filter UI to match.
// Old profiles with obsolete values will simply not match the filter.
export const ETHNICITIES = [
  "Indian",
  "Chinese",
  "Japanese",
  "Korean",
  "Vietnamese",
  "Filipino",
  "Asian",
  "Middle Eastern",
  "Black",
  "Hispanic",
  "White",
  "Mixed",
] as const;

export type Ethnicity = (typeof ETHNICITIES)[number];

// Broad filter groups expand to the specific stored values they should match.
// `aiProfiles.ethnicity` always stores exactly one canonical value from
// `ETHNICITIES`; callers can use these helpers to support wider searches such
// as "Asian" matching "Indian" and "Japanese" without duplicating fields.
export const ETHNICITY_FILTER_EXPANSIONS: Record<Ethnicity, readonly Ethnicity[]> =
  {
    Indian: ["Indian"],
    Chinese: ["Chinese"],
    Japanese: ["Japanese"],
    Korean: ["Korean"],
    Vietnamese: ["Vietnamese"],
    Filipino: ["Filipino"],
    Asian: [
      "Asian",
      "Indian",
      "Chinese",
      "Japanese",
      "Korean",
      "Vietnamese",
      "Filipino",
    ],
    "Middle Eastern": ["Middle Eastern"],
    Black: ["Black"],
    Hispanic: ["Hispanic"],
    White: ["White"],
    Mixed: ["Mixed"],
  };

export function expandEthnicityFilters(
  ethnicities: readonly Ethnicity[],
): Ethnicity[] {
  const expanded = new Set<Ethnicity>();
  for (const ethnicity of ethnicities) {
    for (const value of ETHNICITY_FILTER_EXPANSIONS[ethnicity]) {
      expanded.add(value);
    }
  }
  return Array.from(expanded);
}

export function ethnicityMatchesFilters(
  ethnicity: Ethnicity | undefined,
  filters: readonly Ethnicity[],
): boolean {
  if (!ethnicity) return false;
  if (filters.length === 0) return true;
  return expandEthnicityFilters(filters).includes(ethnicity);
}

// --- Tuning knobs ---

export const FEMALE_WEIGHT = 0.75;
export const SEMANTIC_SIMILARITY_THRESHOLD = 0.42;
export const MAX_GENERATION_ATTEMPTS = 12;
export const SHOWCASE_MIN_COUNT = 4;
export const SHOWCASE_MAX_COUNT = 6;
export const SHOWCASE_MIN_SUCCESS = 3;

// --- Name / identity pools ---

export const FIRST_NAMES: Record<Gender, string[]> = {
  female: [
    "Ava",
    "Mila",
    "Ivy",
    "Nora",
    "Lena",
    "Aria",
    "Zara",
    "Sage",
    "Nia",
    "Maya",
    "Elise",
    "Rhea",
    "Priya",
    "Aisha",
    "Sofia",
    "Camille",
    "Emi",
    "Yuki",
    "Leilani",
    "Imani",
  ],
  male: [
    "Kai",
    "Noah",
    "Milo",
    "Axel",
    "Theo",
    "Jasper",
    "Luca",
    "Ryder",
    "Aiden",
    "Dylan",
    "Evan",
    "Rowan",
    "Arjun",
    "Omar",
    "Mateo",
    "Elias",
    "Ren",
    "Kenji",
    "Malik",
    "Diego",
  ],
};

export const LAST_NAMES = [
  "Rivera",
  "Chen",
  "Park",
  "Nguyen",
  "Santos",
  "Kim",
  "Wright",
  "Cruz",
  "Sharma",
  "Patel",
  "Martinez",
  "Singh",
  "Okafor",
  "Tanaka",
  "Rossi",
  "Ahmed",
  "Kowalski",
  "Bennett",
  "Silva",
  "Abebe",
];

export const OCCUPATIONS: Record<Gender, string[]> = {
  female: [
    "Content Creator",
    "Product Designer",
    "Photographer",
    "Barista",
    "Marketing Strategist",
    "Dance Instructor",
    "Startup Founder",
    "ICU Nurse",
    "Pastry Chef",
    "Veterinary Tech",
    "Grad Student in Neuroscience",
    "Indie Game Dev",
    "Ceramicist",
    "Film Editor",
    "Yoga Teacher",
    "UX Researcher",
    "Civil Engineer",
    "Clinical Psychologist",
    "Architecture Student",
    "Music Journalist",
  ],
  male: [
    "Software Engineer",
    "Music Producer",
    "Fitness Coach",
    "Filmmaker",
    "UX Designer",
    "Chef",
    "Entrepreneur",
    "ER Doctor",
    "Structural Engineer",
    "Indie Game Dev",
    "Grad Student in Physics",
    "Carpenter",
    "Pastry Chef",
    "Park Ranger",
    "High School Teacher",
    "Investigative Journalist",
    "Climbing Guide",
    "Industrial Designer",
    "Luthier",
    "Urban Planner",
  ],
};

export const INTERESTS = [
  "Travel",
  "Gym",
  "Coffee",
  "Film Photography",
  "Gaming",
  "Vinyl Records",
  "Fashion",
  "Cooking",
  "Hiking",
  "Art",
  "Podcasts",
  "Movies",
  "Skincare",
  "Books",
  "Tennis",
  "Bouldering",
  "Thrifting",
  "Matcha",
  "Running Clubs",
  "Tarot",
  "Open Mic Nights",
  "Pottery",
  "Surfing",
  "Salsa Dancing",
  "Farmers Markets",
  "Road Trips",
  "Baking Sourdough",
  "Board Games",
  "Scuba Diving",
  "Plant Parenting",
  "Journaling",
  "Yoga",
  "Skateboarding",
  "Language Learning",
  "Cycling",
  "Live Music",
  "Chess",
  "Volunteering",
  "Astrology",
  "Stand-up Comedy",
];

export const PERSONALITY_TRAITS = [
  "Confident",
  "Playful",
  "Adventurous",
  "Ambitious",
  "Witty",
  "Loyal",
  "Calm",
  "Outgoing",
  "Curious",
  "Romantic",
  "Thoughtful",
  "Observant",
  "Sarcastic",
  "Gentle",
  "Driven",
  "Down-to-earth",
];

export const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export const RELATIONSHIP_GOALS = [
  "something meaningful with fun energy",
  "a slow-burn connection that feels real",
  "a playful relationship with deep conversations",
  "a best-friend and partner vibe",
  "someone to cook weeknight dinners with",
  "a low-stakes first date, see where it goes",
  "a partner who gets my weird humor",
  "long walks and longer conversations",
  "no games, just honest chemistry",
];

export const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];

// --- Appearance pools (ephemeral — never persisted) ---

export const HAIR_COLORS = [
  "jet black",
  "dark brown",
  "chestnut brown",
  "warm auburn",
  "honey blonde",
  "platinum blonde",
  "strawberry blonde",
  "deep burgundy",
  "ash brown",
  "copper red",
  "cool black with highlights",
  "natural dark brown with sun-lightened ends",
];

export const HAIR_STYLES_FEMALE = [
  "long wavy hair with a middle part",
  "shoulder-length straight hair",
  "short tousled bob",
  "long straight hair tucked behind the ears",
  "curly shoulder-length hair",
  "loose beach waves past the shoulders",
  "pixie cut with side-swept bangs",
  "long hair in a messy low bun",
  "braided crown with wisps framing the face",
  "blunt bob with curtain bangs",
];

export const HAIR_STYLES_MALE = [
  "short textured crop with a slight fringe",
  "medium-length messy hair",
  "classic side part",
  "tight buzz cut",
  "curly medium-length hair",
  "shoulder-length hair tucked behind the ears",
  "short fade with a bit of volume on top",
  "bed-head tousled style",
];

export const EYE_COLORS = [
  "dark brown",
  "hazel",
  "amber",
  "warm brown with gold flecks",
  "deep green",
  "soft blue-gray",
  "steel blue",
  "black-brown",
];

export const EYE_SHAPES = [
  "almond-shaped",
  "slightly upturned",
  "wide-set",
  "monolid",
  "round",
  "deep-set",
];

export const SKIN_TONES = [
  "fair skin with cool undertones",
  "warm ivory skin",
  "light olive skin",
  "warm olive skin",
  "golden tan skin",
  "warm brown skin",
  "deep brown skin with warm undertones",
  "rich dark skin with cool undertones",
  "medium beige skin",
];

export const SKIN_CUES = [
  "smooth glowing skin with a natural radiance",
  "subtle dimples when smiling",
  "flawless complexion with a soft healthy glow",
  "clear luminous skin, naturally lit",
  "a sunkissed golden glow on the cheeks",
  "dewy fresh skin with a natural highlight",
  "warm even-toned skin with a slight flush on the cheeks",
];

export const BUILDS_FEMALE = [
  "slim toned build, around 5'5\"",
  "petite with a fit frame, around 5'3\"",
  "athletic toned build, around 5'7\"",
  "curvy with a fit waist, around 5'5\"",
  "tall and slender with long legs, around 5'9\"",
  "hourglass figure with a toned midsection, around 5'6\"",
  "voluptuous curvy figure with full hips, around 5'4\"",
  "thick and curvy with a defined waist, around 5'5\"",
  "busty athletic build with toned legs, around 5'6\"",
  "fit petite build with a flat stomach, around 5'2\"",
];

export const BUILDS_MALE = [
  "lean muscular build, around 5'11\"",
  "athletic build with broad shoulders and defined arms, around 6'0\"",
  "tall and fit, around 6'2\"",
  "toned athletic build, around 5'10\"",
  "muscular and strong, around 6'0\"",
  "lean swimmer's build with visible definition, around 6'1\"",
  "broad muscular build with a V-taper, around 6'0\"",
  "tall athletic build with defined abs, around 6'3\"",
  "compact muscular build, around 5'9\"",
  "lean fit surfer build, around 5'11\"",
];

export const STYLE_SIGNATURES_FEMALE = [
  "a small gold hoop in each ear and a dainty layered necklace",
  "a tiny nose stud and a silver ring on the index finger",
  "thin-frame tortoiseshell glasses",
  "a delicate tattoo on the inner forearm",
  "a signature red lip and minimal jewelry",
  "stacked thin gold rings on both hands",
  "a small cross necklace and stud earrings",
  "round wire-frame glasses and a half-up hair clip",
];

export const STYLE_SIGNATURES_MALE = [
  "a small silver stud in one ear",
  "a leather cord bracelet on the right wrist",
  "thin-frame round glasses",
  "a subtle sleeve tattoo visible below short sleeves",
  "a simple silver chain around the neck",
  "a vintage watch with a worn leather strap",
  "a trimmed short beard with a clean groomed look",
  "no jewelry, just a clean minimalist look",
];

export const OUTFIT_STYLES_FEMALE = [
  // Stylish casual
  "a fitted crop top and high-waisted jeans",
  "a flowy summer dress with thin straps",
  "a tight ribbed tank top and a denim skirt",
  "an oversized blazer over a lace bralette",
  "a bodycon mini dress",
  "a silk camisole and tailored trousers",
  "a cropped sweater showing a hint of midriff",
  // Sexy / revealing
  "a low-cut bodysuit and high-waisted shorts",
  "a sheer mesh top over a bralette",
  "a tight mini skirt and an off-shoulder top",
  "a backless halter dress",
  "a deep V-neck dress with a thigh-high slit",
  "a fitted bikini top and a sarong wrap",
  "a lace-trimmed slip dress",
  // Athletic / active
  "a sports bra and yoga leggings",
  "a matching athletic set showing toned midriff",
];

export const OUTFIT_STYLES_MALE = [
  // Stylish casual
  "a fitted henley with rolled sleeves",
  "a crisp white t-shirt and dark jeans",
  "an open button-down shirt over a fitted tee",
  "a well-fitted polo and chinos",
  "a leather jacket over a plain crew neck",
  "a linen shirt with top buttons open",
  // Athletic / active
  "a fitted tank top showing defined arms",
  "athletic shorts and a compression top",
  // Smart casual
  "a tailored blazer with no undershirt, chest visible",
  "a slim turtleneck sweater",
  "a casual suit jacket with a v-neck underneath",
];

export const VIBES = [
  "clean-girl",
  "streetwear",
  "cottagecore",
  "downtown minimalist",
  "preppy",
  "athleisure",
  "goth-lite",
  "indie",
  "dark academia",
  "coastal",
  "Y2K",
  "soft-minimal",
];

export const CITY_ARCHETYPES = [
  "coastal college town",
  "dense creative metro",
  "mountain-side city",
  "beach-suburb",
  "artsy mid-size city",
  "warehouse-district neighborhood of a big city",
  "quiet tree-lined residential neighborhood",
  "design-district downtown",
  "historic cobblestone old-town",
];

// Maps each city archetype to concrete "City, Region" strings for the
// location field displayed on profile cards and fed to the agent prompt.
export const LOCATIONS_BY_ARCHETYPE: Record<string, string[]> = {
  "coastal college town": [
    "Santa Cruz, CA",
    "San Luis Obispo, CA",
    "Wilmington, NC",
    "Santa Barbara, CA",
    "Savannah, GA",
    "Byron Bay, AU",
    "Brighton, UK",
  ],
  "dense creative metro": [
    "Brooklyn, NY",
    "Los Angeles, CA",
    "East London, UK",
    "Berlin, DE",
    "Toronto, CA",
    "Melbourne, AU",
    "Portland, OR",
    "Amsterdam, NL",
  ],
  "mountain-side city": [
    "Boulder, CO",
    "Asheville, NC",
    "Salt Lake City, UT",
    "Innsbruck, AT",
    "Queenstown, NZ",
    "Banff, CA",
  ],
  "beach-suburb": [
    "Encinitas, CA",
    "Bondi, AU",
    "Haleiwa, HI",
    "Venice Beach, CA",
    "Gold Coast, AU",
    "Biarritz, FR",
  ],
  "artsy mid-size city": [
    "Austin, TX",
    "Nashville, TN",
    "Lisbon, PT",
    "Marfa, TX",
    "Providence, RI",
    "Ghent, BE",
    "Oaxaca, MX",
  ],
  "warehouse-district neighborhood of a big city": [
    "Bushwick, NY",
    "Hackney, UK",
    "Kreuzberg, DE",
    "Fitzroy, AU",
    "Logan Square, IL",
    "Barrio Italia, CL",
  ],
  "quiet tree-lined residential neighborhood": [
    "Evanston, IL",
    "Decatur, GA",
    "Takoma Park, MD",
    "Fremantle, AU",
    "Hampstead, UK",
    "Kichijoji, JP",
  ],
  "design-district downtown": [
    "San Francisco, CA",
    "Copenhagen, DK",
    "Stockholm, SE",
    "Chicago, IL",
    "Seoul, KR",
    "Milan, IT",
    "Helsinki, FI",
  ],
  "historic cobblestone old-town": [
    "Prague, CZ",
    "Bruges, BE",
    "Edinburgh, UK",
    "Cartagena, CO",
    "Old Montreal, CA",
    "Tallinn, EE",
    "Porto, PT",
  ],
};

export const QUIRKS = [
  "collects vintage film cameras",
  "always has a book in her bag",
  "obsessed with making the perfect espresso",
  "makes playlists for every mood",
  "names all her houseplants",
  "a ridiculously competitive at board games",
  "keeps a running list of favorite doors in the city",
  "can recite the entire plot of a niche 90s movie",
  "writes Letterboxd reviews no one asked for",
  "a hoarder of weird-shaped coffee mugs",
  "always brings homemade cookies to parties",
  "keeps a small succulent on their desk named after a dinosaur",
];

export const EXPRESSIONS = [
  "a warm inviting smile showing teeth",
  "a soft laugh mid-motion, looking genuinely happy",
  "a confident smile with direct eye contact",
  "a playful smirk with slightly raised eyebrow",
  "a radiant full smile with sparkling eyes",
  "a flirty glance with a slight lip bite",
  "a warm slight smile, eyes bright and engaged",
];

// --- Avatar shot style library ---

export type AvatarShotStyle = {
  id: string;
  setting: string;
  composition: string;
  lighting: string;
  style: string;
};

export const AVATAR_SHOT_STYLES: AvatarShotStyle[] = [
  {
    id: "iphone_selfie",
    setting:
      "indoors in a casual home setting, shallow out-of-focus background",
    composition:
      "chest-up iPhone front-camera selfie, arm partially visible holding the phone, subject slightly off-center",
    lighting: "soft natural daylight from a nearby window",
    style:
      "candid smartphone photo, mild front-camera distortion, slight grain",
  },
  {
    id: "mirror_selfie",
    setting:
      "in front of a full-length mirror in a bedroom or hallway, everyday clothing",
    composition:
      "chest-up mirror selfie, smartphone partially visible in one hand",
    lighting: "warm indoor lamp light mixed with a bit of ambient daylight",
    style: "honest phone-camera mirror selfie, natural and unposed",
  },
  {
    id: "outdoor_candid",
    setting:
      "outside on a quiet street or small park, blurred trees or buildings in the background",
    composition:
      "waist-up candid portrait, subject slightly off-center, relaxed posture",
    lighting: "soft overcast daylight or dappled afternoon sun",
    style:
      "35mm film look with natural color, candid expression caught mid-thought",
  },
  {
    id: "window_light_indoor",
    setting:
      "indoors by a large window, simple room with a plant or books softly blurred behind",
    composition: "close chest-up portrait, three-quarter angle",
    lighting: "soft directional window light, subtle shadows on the face",
    style: "quiet documentary portrait, 50mm lens at f/2.0, faint film grain",
  },
  {
    id: "golden_hour_park",
    setting:
      "in a park or open outdoor area during golden hour, warm sunlit haze",
    composition: "waist-up candid portrait, subject centered but not rigid",
    lighting: "warm low-angle golden-hour sunlight backlighting the hair",
    style: "35mm film feel, slight haze, natural skin tones",
  },
];

// --- Showcase scene library ---

/**
 * High-level category used by the slot picker to enforce visual diversity
 * across a single profile's grid (never pick 3 indoor_cozy scenes, etc.).
 * Kept as a plain string union here instead of importing from `profileGen/types`
 * to avoid a circular import across the generated action bundle.
 */
export type ShowcaseSceneCategory =
  | "indoor_cozy"
  | "outdoor_urban"
  | "social"
  | "activity"
  | "travel"
  | "creative"
  | "night_social"
  | "selfie";

/**
 * How "swipe-stopping" a scene is on a dating app. Used by
 * `pickShowcaseScenes` to guarantee every grid contains at least one
 * flirty-or-bold scene (swipe hook) rather than an all-cozy grid.
 *
 *  - `bold`   : body-forward / confident / going-out / activewear.
 *  - `flirty` : flattering, intimate, socially-confident; not overtly sexy.
 *  - `casual` : cozy / creative / quiet lifestyle scenes.
 */
export type SceneBoldness = "casual" | "flirty" | "bold";

/**
 * A scene is a *family* of visually-related photos. Every textual axis
 * (action / setting / composition / lighting / style) is an array of 2-4
 * alternatives that are sampled at plan time, so two profiles landing on the
 * same scene still produce different prompts. On top of this baseline we
 * inject a rotating accent prop, season, time-of-day, and an optional
 * per-slot LLM vignette.
 */
export type ShowcaseScene = {
  id: string;
  category: ShowcaseSceneCategory;
  boldness: SceneBoldness;
  buildActions: Array<(candidate: { interests: string[] }) => string>;
  settings: string[];
  compositions: string[];
  lightings: string[];
  styles: string[];
  interestAffinity?: string[];
  vibeAffinity?: string[];
  requireDaylight?: boolean;
};

/**
 * Generic, scene-agnostic props. The LLM vignette step is expected to override
 * these with scene-appropriate props when it fires; this pool is only the
 * fallback when the vignette call fails or is skipped (e.g. on retry slots).
 */
export const SHOWCASE_ACCENT_PROPS: string[] = [
  "a small crossbody bag",
  "a worn leather notebook tucked under one arm",
  "an iced drink in a reusable tumbler",
  "a film camera on a thin strap",
  "a paperback book with a folded corner",
  "a canvas tote with a baguette poking out",
  "a knit beanie held in one hand",
  "a pair of tortoise-shell sunglasses",
  "a linen scarf draped loosely",
  "a small bouquet of dried flowers",
  "a set of wired earbuds just taken out",
  "a takeaway coffee cup from a local cafe",
  "a tiny polaroid in one hand",
  "a vintage watch visible on the wrist",
  "a denim jacket slung over one shoulder",
];

export const SHOWCASE_SEASONS: string[] = [
  "late spring, soft green foliage",
  "mid-summer, warm dry air",
  "early autumn, amber leaves and a cool breeze",
  "crisp winter, low soft sun",
];

export const SHOWCASE_TIMES_OF_DAY: string[] = [
  "early morning, thin blue light",
  "mid-morning, soft white daylight",
  "midday, bright but slightly overcast",
  "late afternoon, warm low sun",
  "golden hour, honey-warm backlight",
  "dusk, cool violet sky",
  "early evening, warm streetlights beginning",
  "late night, moody ambient light only",
];

export const SHOWCASE_SCENES: ShowcaseScene[] = [
  {
    id: "hobby_lifestyle",
    category: "activity",
    boldness: "casual",
    buildActions: [
      (c) =>
        `enjoying ${(c.interests[0] ?? "a favorite hobby").toLowerCase()} in a relaxed, absorbed way`,
      (c) =>
        `in the middle of ${(c.interests[0] ?? "their favorite activity").toLowerCase()}, hands busy, expression focused`,
      (c) =>
        `caught mid-${(c.interests[0] ?? "hobby").toLowerCase()}, looking genuinely engaged rather than posed`,
    ],
    settings: [
      "in an authentic lifestyle setting that matches the hobby, uncluttered but lived-in",
      "in a small dedicated corner of a home set up for the hobby, with the tools of it visible",
      "in a neighborhood spot that suits the hobby - low-key, not staged",
    ],
    compositions: [
      "three-quarter candid framing, subject engaged in the activity rather than posing",
      "medium shot with hands and tools in frame, face relaxed and in focus",
      "slightly wide candid, environment visible enough to read the hobby at a glance",
    ],
    lightings: [
      "soft natural light appropriate to the environment",
      "muted overhead practical light mixed with one window source",
      "warm directional light with soft shadows grounding the subject",
    ],
    styles: [
      "documentary lifestyle photo, 35mm film feel",
      "quiet lifestyle editorial, muted color palette",
      "honest candid, subtle grain, natural skin tones",
    ],
  },
  {
    id: "park_rooftop_day",
    category: "outdoor_urban",
    boldness: "casual",
    buildActions: [
      () =>
        "walking casually or sitting on a low wall, looking out or slightly away from the camera",
      () =>
        "standing near a railing with one hand resting on it, gaze toward the skyline",
      () =>
        "taking a small unhurried pause on a bench, arms relaxed, eyes soft",
    ],
    settings: [
      "on a city rooftop with distant skyline softly out of focus",
      "in an urban park with mid-rise buildings rising through trees behind",
      "on a pedestrian bridge with a river and skyline softly compressed behind",
    ],
    compositions: [
      "full-body or three-quarter framing, subject slightly off-center",
      "waist-up environmental portrait with skyline negative space on one side",
      "medium-wide candid, subject framed against negative sky space",
    ],
    lightings: [
      "bright afternoon daylight, soft natural shadows",
      "hazy late-afternoon sun filtering between buildings",
      "overcast daylight, even and flattering",
    ],
    styles: [
      "editorial candid, 50mm lens, shallow depth of field",
      "urban lifestyle editorial, clean color grade",
      "35mm candid feel, natural contrast",
    ],
    requireDaylight: true,
  },
  {
    id: "night_cozy_bar",
    category: "night_social",
    boldness: "flirty",
    buildActions: [
      () =>
        "sitting at a small table with a drink, mid-conversation, caught laughing softly",
      () =>
        "leaning on a wooden bar counter, drink in hand, half-smiling at someone off-frame",
      () =>
        "tucked into a corner booth, glass raised slightly, warm-lit expression",
    ],
    settings: [
      "inside a cozy low-lit bar or bistro with warm string-lights",
      "in a small wine bar with exposed brick and a soft backlit shelf of bottles",
      "inside an intimate jazz-adjacent bar with tinted sconces and dark wood",
    ],
    compositions: [
      "chest-up candid framing, slight tilt, background softly blurred",
      "three-quarter seated framing, drink and hands visible in lower third",
      "medium close candid, environment readable but heavily out of focus",
    ],
    lightings: [
      "warm tungsten and candlelight, moody but flattering",
      "amber sconce light pooling on the subject, deep shadow surround",
      "dim warm ambient with a single accent source on the face",
    ],
    styles: [
      "film-look night photo, noticeable but pleasant grain",
      "cinematic low-light candid, warm highlights",
      "moody editorial night feel, fine grain, rich shadows",
    ],
  },
  {
    id: "travel_cobblestone",
    category: "travel",
    boldness: "casual",
    buildActions: [
      () =>
        "strolling down a cobblestone street or stopping to look at a small shop window",
      () => "pausing on an old-town corner to check a paper map or phone",
      () =>
        "mid-step on a narrow lane, small tote over one shoulder, unhurried",
    ],
    settings: [
      "a narrow old-town street with warm-toned stone walls and soft shop lights",
      "a tree-lined side street in a historic quarter, painted shutters closed behind",
      "a small plaza with a stone fountain and handful of locals softly out of focus",
    ],
    compositions: [
      "full-body travel candid, environment clearly visible",
      "three-quarter wide environmental shot, architecture anchoring both sides",
      "waist-up candid with a doorway or archway framing the subject",
    ],
    lightings: [
      "soft late-afternoon sun between buildings",
      "cool morning light just after sunrise, long soft shadows",
      "overcast travel light, even tones, no harsh shadows",
    ],
    styles: [
      "travel editorial, 28mm wide candid",
      "quiet travel documentary, muted palette",
      "35mm street-photo feel, honest color",
    ],
    requireDaylight: true,
  },
  {
    id: "with_friends",
    category: "social",
    boldness: "casual",
    buildActions: [
      () =>
        "laughing with two friends who are slightly out of focus in the foreground or background",
      () =>
        "mid-conversation in a small group, leaning in, genuinely engaged expression",
      () =>
        "sharing a private joke with one friend, the other glimpsed at the edge of frame",
    ],
    settings: [
      "an outdoor cafe terrace, natural and social",
      "a casual living-room gathering, low couches and soft lamp light",
      "a sunny backyard or stoop hangout with drinks on a small table",
    ],
    compositions: [
      "three-quarter framing, subject clearly the focus while friends remain soft and blurred",
      "medium group candid, subject center-weighted and sharpest in the frame",
      "over-the-shoulder composition, friend's blurred shape anchoring the foreground",
    ],
    lightings: [
      "soft natural daylight through a window or trees",
      "warm indoor ambient light, mixed practicals",
      "golden-hour light spilling across the whole group",
    ],
    styles: [
      "candid social snapshot, 35mm feel",
      "honest lifestyle editorial, gentle grain",
      "documentary hangout feel, natural color",
    ],
  },
  {
    id: "activity_gym_climb",
    category: "activity",
    boldness: "bold",
    buildActions: [
      (c) => {
        const interest = c.interests.find((i) =>
          /gym|bouldering|climbing|yoga|running|cycling|skate|tennis|surfing|dance|salsa/i.test(
            i,
          ),
        );
        if (interest) {
          return `in the middle of ${interest.toLowerCase()}, focused and mid-motion`;
        }
        return "in a fitness or climbing setting, mid-activity";
      },
      (c) => {
        const interest = c.interests.find((i) =>
          /gym|bouldering|climbing|yoga|running|cycling|skate|tennis|surfing|dance|salsa/i.test(
            i,
          ),
        );
        if (interest) {
          return `just paused between sets of ${interest.toLowerCase()}, breathing, a slight smile`;
        }
        return "in a fitness setting, pausing between sets, light sweat visible";
      },
      () =>
        "in athletic gear mid-movement, limbs blurred subtly, expression calm and focused",
    ],
    settings: [
      "at a climbing gym with colorful wall holds softly out of focus",
      "in a pilates or yoga studio with warm wood floors and large mirrors",
      "at a track or outdoor basketball court, functional sport environment",
    ],
    compositions: [
      "three-quarter action framing, a hint of motion blur in limbs but face sharp",
      "medium candid with athletic posture clear, equipment visible",
      "tight three-quarter shot emphasizing focus and effort",
    ],
    lightings: [
      "bright functional indoor lighting",
      "daylight through large gym windows, soft shadows",
      "warm early-morning sun for outdoor sport settings",
    ],
    styles: [
      "sports-documentary feel, natural skin, minimal color grading",
      "editorial fitness candid, muted color palette",
      "honest action-lifestyle photo, 35mm feel",
    ],
    interestAffinity: [
      "Gym",
      "Bouldering",
      "Yoga",
      "Cycling",
      "Tennis",
      "Surfing",
      "Skateboarding",
      "Running Clubs",
      "Salsa Dancing",
    ],
  },
  {
    id: "mirror_selfie_full_body",
    category: "selfie",
    boldness: "bold",
    buildActions: [
      () =>
        "a casual full-body mirror selfie, everyday outfit, neutral confident posture",
      () =>
        "a mirror selfie on the way out the door, tote or jacket in hand, unhurried",
      () => "a low-angle mirror selfie, one hip shifted, relaxed expression",
    ],
    settings: [
      "in front of a full-length mirror in a bedroom or hallway, minimal clutter",
      "in a clean tiled bathroom with soft overhead warm light",
      "at a floor mirror leaning against the wall, plants in the edge of frame",
    ],
    compositions: [
      "full-body mirror selfie, smartphone visible in one hand",
      "three-quarter mirror selfie, phone partially in frame, subject slightly angled",
      "straight-on full-body mirror selfie, balanced composition",
    ],
    lightings: [
      "mixed warm room light and a slice of daylight",
      "soft overhead diffused light, neutral color",
      "warm lamp light complemented by a window just out of frame",
    ],
    styles: [
      "honest smartphone mirror photo, realistic proportions",
      "natural phone-camera look, mild grain, true-to-life color",
      "slightly overexposed phone selfie, soft contrast",
    ],
  },
  {
    id: "cafe_food_candid",
    category: "indoor_cozy",
    boldness: "flirty",
    buildActions: [
      () =>
        "holding a matcha or coffee cup mid-sip, gaze soft, off toward the window",
      () =>
        "reaching for a pastry on a small ceramic plate, hand and face both in frame",
      () =>
        "laughing softly at the table, both hands resting near a cortado and a small book",
    ],
    settings: [
      "at a small cafe table with a warm wooden surface, simple ceramic cups",
      "at a marble bistro counter with pastries and a small glass of water",
      "at a corner table near a big window, city softly blurred outside",
    ],
    compositions: [
      "close candid three-quarter framing, hands and face in frame",
      "over-the-drink composition, cup in sharp foreground, face soft behind",
      "medium tabletop shot, full breakfast setup visible but subject dominant",
    ],
    lightings: [
      "soft window daylight",
      "warm cafe pendant lights mixing with a cool window source",
      "directional morning sun through blinds, gentle patterned shadow",
    ],
    styles: [
      "lifestyle food-adjacent candid, 50mm at f/2.0",
      "editorial cafe feel, warm but clean color grading",
      "honest documentary-lifestyle frame, subtle grain",
    ],
  },
  {
    id: "getting_ready_candid",
    category: "selfie",
    boldness: "flirty",
    buildActions: [
      () =>
        "pausing mid-getting-ready, fixing an earring or adjusting a jacket collar",
      () =>
        "tying back hair at a vanity, gaze directed at the mirror rather than camera",
      () =>
        "buttoning a shirt or cuff, caught in a small quiet moment of preparation",
    ],
    settings: [
      "in front of a vanity mirror with soft warm lamps",
      "at a bedroom mirror with clothes softly visible on the bed behind",
      "in a small hallway mirror scene, jacket half-on",
    ],
    compositions: [
      "chest-up candid, gaze directed at the mirror rather than camera",
      "waist-up three-quarter framing, hands actively doing something",
      "intimate tight frame, shoulders and face, warm reflections visible",
    ],
    lightings: [
      "warm low-wattage lamp light with soft shadows",
      "single directional warm light from one side",
      "mixed warm lamp light and a slice of cool daylight",
    ],
    styles: [
      "intimate candid, slight film grain, warm color palette",
      "quiet lifestyle editorial, muted saturation",
      "honest get-ready candid, 35mm feel",
    ],
  },
  {
    id: "cozy_reading_indoor",
    category: "indoor_cozy",
    boldness: "casual",
    buildActions: [
      () => "curled up with a book or laptop, wrapped in an oversized sweater",
      () =>
        "sitting cross-legged on a couch, a hot drink balanced nearby, paperback open in lap",
      () =>
        "stretched out by a window with a book face-down on the thigh, gaze drifting outside",
    ],
    settings: [
      "on a couch with soft throws and a plant or two in view",
      "in a reading nook by a window, a stack of books and a small lamp visible",
      "on a rug on the floor with a mug and open notebook nearby",
    ],
    compositions: [
      "three-quarter lifestyle framing, cozy setting clearly visible",
      "wide environmental shot with the subject anchored in a corner of frame",
      "close candid, hands and page in sharp foreground, face softly in focus",
    ],
    lightings: [
      "soft morning window light, gentle contrast",
      "warm table lamp light with window daylight mixing",
      "overcast afternoon light through sheer curtains",
    ],
    styles: [
      "slow-living editorial, warm tones",
      "quiet indoor documentary, muted palette",
      "soft film feel, natural color, subtle grain",
    ],
  },
  {
    id: "roadtrip_car",
    category: "travel",
    boldness: "casual",
    buildActions: [
      () =>
        "in the passenger seat with sunglasses on, wind lightly moving the hair, smiling slightly",
      () =>
        "leaning against the open car door at a rest stop, horizon behind, relaxed pose",
      () =>
        "sitting on the hood at golden hour, legs crossed, small smile to the side",
    ],
    settings: [
      "inside a car on a daytime road trip, softly blurred landscape out the window",
      "at a scenic pullout on an open highway, car visible at the edge of frame",
      "on a small rural road next to fields or low hills",
    ],
    compositions: [
      "chest-up candid from the driver-side angle",
      "three-quarter environmental shot with car and landscape balanced",
      "medium-wide shot, subject leaning on car, horizon centered low",
    ],
    lightings: [
      "natural daylight through the windshield",
      "late-afternoon warm sun flaring subtly on the edge of the frame",
      "overcast travel-day light, even and soft",
    ],
    styles: [
      "35mm road-trip film look, warm highlights",
      "nostalgic travel editorial, slight grain, warm palette",
      "honest road-trip candid, natural color",
    ],
    requireDaylight: true,
  },
  {
    id: "rooftop_event",
    category: "night_social",
    boldness: "flirty",
    buildActions: [
      () =>
        "at a small rooftop dinner or party, drink in hand, mid-laugh with string lights behind",
      () =>
        "leaning on a rooftop railing at dusk, glass in hand, a private smile",
      () =>
        "mid-conversation at a rooftop gathering, face softly lit by bulb lights above",
    ],
    settings: [
      "on a rooftop with bokeh string lights and city rooftops softly visible behind",
      "on a warehouse rooftop terrace, a small crowd softly out of focus behind",
      "on a residential rooftop deck with plants and low furniture framing the subject",
    ],
    compositions: [
      "chest-up candid, slightly elevated camera angle",
      "three-quarter framing with string lights as bokeh in negative space",
      "medium shot, subject side-lit with cityscape dim behind",
    ],
    lightings: [
      "warm magic-hour ambient light plus small warm bulbs",
      "cooling dusk sky with warm strand-light fill on the face",
      "ambient night light with a single warm practical on the subject",
    ],
    styles: [
      "film-look party candid, flattering skin tones",
      "editorial night-social shot, fine grain",
      "cinematic golden-to-blue-hour palette, warm highlights",
    ],
  },
  {
    id: "water_beach_dock",
    category: "travel",
    boldness: "bold",
    buildActions: [
      () =>
        "sitting on the edge of a wooden dock or walking barefoot on wet sand",
      () =>
        "standing in shallow water with jeans rolled, looking down the shoreline",
      () =>
        "on a rock near the water with legs tucked, hair catching the breeze",
    ],
    settings: [
      "at a calm lake dock or quiet waterfront",
      "on a rocky coastline with low waves",
      "on a wooden pier extending into still water, distant horizon",
    ],
    compositions: [
      "full-body or three-quarter wide environmental shot",
      "medium shot with water dominating half the frame, subject off-center",
      "low-angle environmental composition, horizon line high in the frame",
    ],
    lightings: [
      "soft golden-hour sun reflecting off the water",
      "cool blue-hour light just after sunset",
      "overcast coastal light, soft and even",
    ],
    styles: [
      "editorial travel feel, natural tones, subtle film grain",
      "quiet coastal editorial, muted palette",
      "35mm seaside candid, warm highlights",
    ],
    vibeAffinity: ["coastal", "clean-girl", "soft-minimal", "Y2K"],
    requireDaylight: true,
  },
  {
    id: "farmers_market",
    category: "outdoor_urban",
    boldness: "casual",
    buildActions: [
      () =>
        "browsing fresh produce at a market stall, holding a paper bag or bouquet",
      () =>
        "paying at a small stand, tote on shoulder, warm exchange with the vendor",
      () =>
        "walking between stalls with a loaf of bread sticking out of a canvas bag",
    ],
    settings: [
      "at a bustling outdoor farmers market with stalls softly blurred behind",
      "at a neighborhood weekend market with flower stands in frame",
      "at a covered market hall with dappled light and painted signage",
    ],
    compositions: [
      "three-quarter candid, hands interacting with the environment",
      "medium candid, market stall occupying one side of the frame",
      "over-the-shoulder composition watching the subject move through the stalls",
    ],
    lightings: [
      "bright mid-morning daylight with dappled shadows",
      "soft overcast light, saturated produce color",
      "warm late-morning sun cutting through market awnings",
    ],
    styles: [
      "lifestyle documentary, warm natural color",
      "editorial market candid, 35mm feel",
      "honest weekend-morning palette, subtle grain",
    ],
    requireDaylight: true,
  },
  {
    id: "creative_workspace",
    category: "creative",
    boldness: "casual",
    buildActions: [
      () =>
        "at a creative workspace mid-project, pen in hand or adjusting a camera",
      () => "sketching on a pad at a cluttered desk, face relaxed and absorbed",
      () =>
        "tuning an instrument or adjusting a lens, hands clearly doing the work",
    ],
    settings: [
      "at a home desk with tools of a craft (cameras, sketchpads, laptop, instrument)",
      "in a small studio space with a pegboard of tools softly out of focus",
      "at a second-hand wooden table with warm books and paper clutter",
    ],
    compositions: [
      "three-quarter candid, workspace clearly in frame",
      "tighter medium shot, hands-and-face with tools in foreground",
      "wider environmental shot showing the whole creative space",
    ],
    lightings: [
      "soft directional window light",
      "warm practical desk lamp light with one cool daylight source",
      "cool even overhead light, quiet studio feel",
    ],
    styles: [
      "quiet documentary portrait, muted palette",
      "editorial creative lifestyle, honest color",
      "soft studio candid, subtle grain",
    ],
  },
  {
    id: "with_pet",
    category: "indoor_cozy",
    boldness: "casual",
    buildActions: [
      () =>
        "hanging out with a small dog or cat, mid-laugh as the pet nudges closer",
      () => "sitting on the floor with a pet in the lap, both calm and content",
      () =>
        "playing gently with a pet, face turned toward it, genuine amused smile",
    ],
    settings: [
      "on a couch with a visible pet, soft throws and a plant nearby",
      "on a sunny apartment floor with a rug, pet alert and close",
      "by a window seat with the pet curled up next to the subject",
    ],
    compositions: [
      "chest-up candid, pet clearly visible in the frame",
      "three-quarter framing, pet anchoring the lower third",
      "intimate close candid, subject and pet both sharp",
    ],
    lightings: [
      "soft natural daylight",
      "warm morning light through sheer curtains",
      "overcast afternoon light, gentle contrast",
    ],
    styles: [
      "warm lifestyle candid, genuine expression",
      "honest pet-moment editorial, subtle grain",
      "soft indoor documentary, natural color",
    ],
  },
  {
    id: "bookstore_browse",
    category: "creative",
    boldness: "casual",
    buildActions: [
      () =>
        "pulling a book from a tall shelf, eyes on the spine, expression curious",
      () => "standing in a narrow aisle with an open book, face softly lit",
      () =>
        "at a small table in the bookstore with a pile of picks, half-smiling",
    ],
    settings: [
      "inside a small independent bookstore with tightly packed wooden shelves",
      "in a used bookstore with warm yellowed light and handwritten signs",
      "in a design or photo bookstore with large-format books on display tables",
    ],
    compositions: [
      "three-quarter candid, bookshelves filling the background",
      "medium shot, subject in an aisle, corridor of books leading back",
      "intimate chest-up frame with a book held softly in hand",
    ],
    lightings: [
      "warm overhead practical light mixed with a window source",
      "soft tungsten shelf lighting pooling on the face",
      "cool indirect daylight from a front window",
    ],
    styles: [
      "quiet indoor documentary, muted warm palette",
      "editorial bookstore lifestyle, 35mm feel",
      "soft film candid, fine grain",
    ],
  },
  {
    id: "art_gallery_wander",
    category: "creative",
    boldness: "casual",
    buildActions: [
      () =>
        "standing slightly off-center in a bright gallery, looking at something out of frame",
      () =>
        "reading a small wall label next to an artwork, expression thoughtful",
      () => "crossing between rooms in a gallery, doorway framing the subject",
    ],
    settings: [
      "in a small contemporary art gallery with white walls and warm wood floors",
      "in a museum hallway with soft directional lighting and one framed work visible",
      "in a minimal exhibition space with a single sculpture softly blurred behind",
    ],
    compositions: [
      "wide environmental portrait, architecture anchoring both sides",
      "medium three-quarter candid with an artwork visible in the frame",
      "tight chest-up shot with the gallery wall as clean negative space",
    ],
    lightings: [
      "soft even gallery lighting, neutral color",
      "directional spot light from above, slight shadow on one side",
      "cool museum daylight through a clerestory window",
    ],
    styles: [
      "quiet editorial portrait, clean color grade",
      "minimal gallery-lifestyle feel, honest palette",
      "soft documentary candid, subtle grain",
    ],
  },
  {
    id: "kitchen_cooking",
    category: "indoor_cozy",
    boldness: "casual",
    buildActions: [
      () => "mid-cook at the stove, wooden spoon in hand, steam rising softly",
      () => "chopping vegetables on a wooden board, unhurried, small smile",
      () => "plating a simple dish at the counter, face calm and focused",
    ],
    settings: [
      "in a small home kitchen with warm wood accents and a few herbs on the windowsill",
      "at a marble counter with a cutting board and fresh produce around",
      "at a galley kitchen with soft overhead light and a half-open window",
    ],
    compositions: [
      "three-quarter candid, hands and cooking surface clearly in frame",
      "medium tabletop shot with ingredients and the subject",
      "over-the-shoulder composition watching the subject cook",
    ],
    lightings: [
      "soft morning window light mixed with warm overhead",
      "warm practical light from under-cabinet sources",
      "late-afternoon light cutting across the counter",
    ],
    styles: [
      "slow-living lifestyle editorial, warm palette",
      "honest home-cooking documentary, 35mm feel",
      "soft indoor candid, natural color, subtle grain",
    ],
  },
  {
    id: "train_window",
    category: "travel",
    boldness: "casual",
    buildActions: [
      () =>
        "looking out a train window, one hand resting on the sill, softly smiling",
      () =>
        "reading a paperback at a window seat on a train, landscape blurred past",
      () =>
        "listening to music on a train, a small journal on the table, gaze distant",
    ],
    settings: [
      "at a train window seat with countryside softly streaking past",
      "at an intercity train table with a coffee and a small book",
      "at a metro window seat with city rooftops flickering by",
    ],
    compositions: [
      "waist-up candid, window filling the frame behind",
      "three-quarter profile shot from across the aisle",
      "close chest-up frame with the window reflection subtly doubled",
    ],
    lightings: [
      "natural daylight through the train window",
      "soft overcast daylight diffused by the glass",
      "late-afternoon warm sun flickering across the subject",
    ],
    styles: [
      "quiet travel documentary, 35mm feel",
      "soft film editorial, gentle grain",
      "honest transit candid, natural color",
    ],
    requireDaylight: true,
  },
  {
    id: "picnic_park",
    category: "outdoor_urban",
    boldness: "flirty",
    buildActions: [
      () =>
        "on a picnic blanket with a small spread of food, mid-laugh with someone off-frame",
      () =>
        "leaning back on hands on the grass, face tilted up toward soft sun",
      () =>
        "cross-legged on a blanket, paperback in lap, gaze off into the park",
    ],
    settings: [
      "on a grassy park lawn with blurred trees and other picnickers behind",
      "in a quiet stretch of park next to a small pond",
      "at the edge of a city park with skyline softly visible through the trees",
    ],
    compositions: [
      "three-quarter environmental shot, blanket and food anchoring the lower third",
      "wider candid showing the whole picnic setup",
      "chest-up candid with grass filling negative space",
    ],
    lightings: [
      "dappled afternoon light through the trees",
      "warm golden-hour sun backlighting the subject",
      "soft overcast daylight, saturated greens",
    ],
    styles: [
      "35mm park-lifestyle candid, warm palette",
      "editorial picnic feel, natural color, subtle grain",
      "slow-living outdoor documentary",
    ],
    requireDaylight: true,
  },
  {
    id: "dance_studio_class",
    category: "activity",
    boldness: "bold",
    buildActions: [
      () =>
        "mid-dance move in a studio, limbs softly blurred, expression focused",
      () =>
        "resting between rounds of practice, water bottle in hand, soft smile",
      () => "stretching at a ballet barre or yoga mat, calm and centered",
    ],
    settings: [
      "in a dance studio with a full-wall mirror and warm wood floors",
      "in a small boutique pilates or barre studio with natural light",
      "in a loft-style movement studio with large windows",
    ],
    compositions: [
      "three-quarter action framing, motion blur subtle, face sharp",
      "wider environmental shot, mirror doubling the subject softly",
      "medium candid, studio space clearly readable",
    ],
    lightings: [
      "bright even daylight through large studio windows",
      "mixed overhead warm and cool light, soft shadows",
      "warm afternoon sun cutting diagonally across the floor",
    ],
    styles: [
      "sports-documentary feel, natural skin tones",
      "quiet movement editorial, muted palette",
      "honest studio candid, 35mm feel",
    ],
    interestAffinity: [
      "Salsa Dancing",
      "Yoga",
      "Pilates",
      "Ballet",
      "Barre",
      "Dance",
    ],
  },
  {
    id: "street_night_city",
    category: "night_social",
    boldness: "flirty",
    buildActions: [
      () =>
        "walking along a lit street at night, hands in pockets, glancing to the side",
      () =>
        "standing near a crosswalk under a warm streetlight, soft half-smile",
      () => "leaning on a brick wall in a lit alley, relaxed, eyes soft",
    ],
    settings: [
      "on a lit urban street at night with soft neon reflections in wet pavement",
      "in a quiet downtown block with warm window light from a restaurant behind",
      "under a warm streetlamp on a residential block, trees softly lit",
    ],
    compositions: [
      "waist-up candid, streetlights as bokeh in negative space",
      "medium-wide environmental shot, subject centered on the pavement",
      "three-quarter framing with warm shop signage softly visible",
    ],
    lightings: [
      "warm streetlight with cool ambient night sky",
      "mixed neon and tungsten, soft highlights on face",
      "low-key ambient night light with one warm practical source",
    ],
    styles: [
      "cinematic night-street feel, subtle grain",
      "editorial urban-night candid, moody warm-cool contrast",
      "35mm night photo, honest low-light skin tones",
    ],
  },
  {
    id: "record_shop_vintage",
    category: "creative",
    boldness: "casual",
    buildActions: [
      () =>
        "flipping through records at a record shop, head slightly tilted, focused",
      () => "pulling a record half out of its sleeve, eyes on the cover",
      () =>
        "at the listening station in a record shop, one headphone pressed to an ear",
    ],
    settings: [
      "inside a small record shop with wooden crates and posters on the walls",
      "at a used vinyl store with warm overhead light and tight aisles",
      "in a hybrid book-and-record shop with eclectic decor",
    ],
    compositions: [
      "three-quarter candid, record crates filling the foreground",
      "medium shot, subject with record in hand, shop softly out of focus",
      "chest-up frame with album art visible in the lower third",
    ],
    lightings: [
      "warm overhead practical light, soft shadows",
      "tungsten shop lighting mixing with one window source",
      "cool diffuse daylight through a front window",
    ],
    styles: [
      "quiet lifestyle editorial, warm palette",
      "documentary-style candid, 35mm feel",
      "soft film grain, honest color",
    ],
    interestAffinity: ["Vinyl", "Music", "Record Collecting", "Concerts"],
  },
];

// --- Bio quality filters ---

export const BANNED_BIO_PHRASES = [
  "adventure",
  "foodie",
  "wanderlust",
  "fluent in sarcasm",
  "partner in crime",
  "good vibes",
  "live laugh love",
  "looking for my person",
  "probably overthinking this",
];

export const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "have",
  "has",
  "just",
  "any",
  "all",
  "you",
  "your",
  "mine",
  "our",
  "are",
  "not",
  "but",
  "too",
  "very",
  "really",
  "love",
  "like",
  "about",
  "some",
  "what",
  "when",
  "then",
  "than",
  "also",
  "can",
  "will",
  "would",
  "could",
  "been",
  "being",
  "here",
  "there",
  "their",
  "they",
  "them",
  "who",
  "which",
  "how",
  "where",
  "because",
  "always",
  "never",
  "stuff",
  "things",
]);

// NOTE: intentionally avoid naming specific skin features here. Phrases like
// "avoid excessive blemishes or acne" or "avoid dull or tired-looking skin"
// prime the model to consider those features in the first place and often
// produce the opposite effect (over-smoothed plastic skin, or amplified
// freckles/marks). The rest of the list targets pure image-quality issues.
export const INLINE_NEGATIVES =
  "Avoid extra fingers or distorted hands, avoid text or watermarks, avoid cartoon or render look, avoid over-smoothed plastic skin, avoid uncanny valley AI artifacts.";
