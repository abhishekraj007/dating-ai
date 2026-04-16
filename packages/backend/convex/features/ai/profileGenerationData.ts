export type Gender = "female" | "male";

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
  "a single small beauty mark near the mouth",
  "subtle dimples when smiling",
  "a faint scar on the left eyebrow",
  "clear skin with visible natural pores",
  "a sunkissed look with a hint of cheek flush",
  "a tiny mole on the left cheekbone",
  "soft freckles on the shoulders",
];

export const BUILDS_FEMALE = [
  "slim build, around 5'4\"",
  "petite and soft, around 5'2\"",
  "athletic build, around 5'6\"",
  "curvy build, around 5'5\"",
  "tall and lean, around 5'9\"",
  "average build with a soft frame, around 5'5\"",
];

export const BUILDS_MALE = [
  "lean build, around 5'10\"",
  "athletic build with broad shoulders, around 6'0\"",
  "tall and wiry, around 6'2\"",
  "average build, around 5'9\"",
  "stocky and strong, around 5'11\"",
  "slim swimmer's build, around 6'1\"",
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
  "a trimmed short beard and a single eyebrow scar",
  "no jewelry, just a clean minimalist look",
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
  "a gentle closed-mouth smile",
  "a soft laugh mid-motion",
  "a relaxed neutral expression looking just past the camera",
  "a warm slight smile, eyes slightly squinted",
  "a confident half-smile",
  "looking slightly off-camera with a thoughtful expression",
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

export type ShowcaseScene = {
  id: string;
  buildAction: (candidate: { interests: string[] }) => string;
  setting: string;
  composition: string;
  lighting: string;
  style: string;
  interestAffinity?: string[];
  vibeAffinity?: string[];
  requireDaylight?: boolean;
};

export const SHOWCASE_SCENES: ShowcaseScene[] = [
  {
    id: "hobby_lifestyle",
    buildAction: (c) =>
      `enjoying ${(c.interests[0] ?? "a favorite hobby").toLowerCase()} in a relaxed, absorbed way`,
    setting:
      "in an authentic lifestyle setting that matches the hobby, uncluttered but lived-in",
    composition:
      "three-quarter candid framing, subject engaged in the activity rather than posing",
    lighting: "soft natural light appropriate to the environment",
    style: "documentary lifestyle photo, 35mm film feel",
  },
  {
    id: "park_rooftop_day",
    buildAction: () =>
      "walking casually or sitting on a low wall, looking out or slightly away from the camera",
    setting:
      "on a city rooftop or in a park with distant skyline softly out of focus",
    composition:
      "full-body or three-quarter framing, subject slightly off-center",
    lighting: "bright afternoon daylight, soft natural shadows",
    style: "editorial candid, 50mm lens, shallow depth of field",
    requireDaylight: true,
  },
  {
    id: "night_cozy_bar",
    buildAction: () =>
      "sitting at a small table with a drink, mid-conversation, caught laughing softly",
    setting: "inside a cozy low-lit bar or bistro with warm string-lights",
    composition:
      "chest-up candid framing, slight tilt, background softly blurred",
    lighting: "warm tungsten and candlelight, moody but flattering",
    style: "film-look night photo, noticeable but pleasant grain",
  },
  {
    id: "travel_cobblestone",
    buildAction: () =>
      "strolling down a cobblestone street or stopping to look at a small shop window",
    setting:
      "a narrow old-town street with warm-toned stone walls and soft shop lights",
    composition: "full-body travel candid, environment clearly visible",
    lighting: "soft late-afternoon sun between buildings",
    style: "travel editorial, 28mm wide candid",
    requireDaylight: true,
  },
  {
    id: "with_friends",
    buildAction: () =>
      "laughing with two friends who are slightly out of focus in the foreground or background",
    setting:
      "an outdoor cafe terrace or casual living-room gathering, natural and social",
    composition:
      "three-quarter framing, subject clearly the focus while friends remain soft and blurred",
    lighting: "soft natural daylight or warm indoor ambient light",
    style: "candid social snapshot, 35mm feel",
  },
  {
    id: "activity_gym_climb",
    buildAction: (c) => {
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
    setting:
      "at a climbing gym, pilates studio, or track, authentic sports environment",
    composition:
      "three-quarter action framing, a hint of motion blur in limbs but face sharp",
    lighting:
      "bright functional indoor lighting or daylight through large windows",
    style: "sports-documentary feel, natural skin, minimal color grading",
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
    buildAction: () =>
      "a casual full-body mirror selfie, everyday outfit, neutral confident posture",
    setting:
      "in front of a full-length mirror in a bedroom or hallway, minimal clutter",
    composition: "full-body mirror selfie, smartphone visible in one hand",
    lighting: "mixed warm room light and a slice of daylight",
    style: "honest smartphone mirror photo, realistic proportions",
  },
  {
    id: "cafe_food_candid",
    buildAction: () =>
      "holding a matcha or coffee cup mid-sip, or reaching for a plate on the table",
    setting:
      "at a small cafe table with a warm wooden surface, simple ceramic cups",
    composition: "close candid three-quarter framing, hands and face in frame",
    lighting: "soft window daylight or warm cafe pendant lights",
    style: "lifestyle food-adjacent candid, 50mm at f/2.0",
  },
  {
    id: "getting_ready_candid",
    buildAction: () =>
      "pausing mid-getting-ready, fixing an earring or adjusting a jacket collar",
    setting:
      "in front of a vanity mirror or a bedroom mirror with soft warm lamps",
    composition:
      "chest-up candid, gaze directed at the mirror rather than camera",
    lighting: "warm low-wattage lamp light with soft shadows",
    style: "intimate candid, slight film grain, warm color palette",
  },
  {
    id: "cozy_reading_indoor",
    buildAction: () =>
      "curled up with a book or laptop, wrapped in an oversized sweater",
    setting:
      "on a couch or by a window, soft throws and a plant or two in view",
    composition:
      "three-quarter lifestyle framing, cozy setting clearly visible",
    lighting: "soft morning window light, gentle contrast",
    style: "slow-living editorial, warm tones",
  },
  {
    id: "roadtrip_car",
    buildAction: () =>
      "in the passenger seat with sunglasses on, wind lightly moving the hair, smiling slightly",
    setting:
      "inside a car on a daytime road trip, softly blurred landscape out the window",
    composition: "chest-up candid from the driver-side angle",
    lighting: "natural daylight through the windshield",
    style: "35mm road-trip film look, warm highlights",
    requireDaylight: true,
  },
  {
    id: "rooftop_event",
    buildAction: () =>
      "at a small rooftop dinner or party, drink in hand, mid-laugh with string lights behind",
    setting:
      "on a rooftop at dusk with bokeh string lights and city rooftops softly visible",
    composition: "chest-up candid, slightly elevated camera angle",
    lighting: "warm magic-hour ambient light plus small warm bulbs",
    style: "film-look party candid, flattering skin tones",
  },
  {
    id: "water_beach_dock",
    buildAction: () =>
      "sitting on the edge of a wooden dock or walking barefoot on wet sand",
    setting: "at a calm lake dock or quiet beach in early evening",
    composition: "full-body or three-quarter wide environmental shot",
    lighting: "soft golden-hour sun reflecting off the water",
    style: "editorial travel feel, natural tones, subtle film grain",
    vibeAffinity: ["coastal", "clean-girl", "soft-minimal", "Y2K"],
    requireDaylight: true,
  },
  {
    id: "farmers_market",
    buildAction: () =>
      "browsing fresh produce at a market stall, holding a paper bag or bouquet",
    setting:
      "at a bustling outdoor farmers market with stalls softly blurred behind",
    composition: "three-quarter candid, hands interacting with the environment",
    lighting: "bright mid-morning daylight with dappled shadows",
    style: "lifestyle documentary, warm natural color",
    requireDaylight: true,
  },
  {
    id: "creative_workspace",
    buildAction: () =>
      "at a creative workspace mid-project, pen in hand or adjusting a camera",
    setting:
      "at a home desk or small studio with visible tools of a craft (cameras, sketchpads, laptop, instrument)",
    composition: "three-quarter candid, workspace clearly in frame",
    lighting: "soft directional window light",
    style: "quiet documentary portrait, muted palette",
  },
  {
    id: "with_pet",
    buildAction: () =>
      "hanging out with a small dog or cat, mid-laugh as the pet nudges closer",
    setting: "on a couch or a sunny apartment floor with a visible pet",
    composition: "chest-up candid, pet clearly visible in the frame",
    lighting: "soft natural daylight",
    style: "warm lifestyle candid, genuine expression",
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

export const INLINE_NEGATIVES =
  "Avoid glossy airbrushed skin, avoid beauty-ad retouching, avoid uncanny facial symmetry, avoid studio backdrop unless specified, avoid extra fingers or distorted hands, avoid text or watermarks, avoid cartoon or render look.";
