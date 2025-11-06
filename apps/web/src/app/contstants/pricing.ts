export interface Tier {
  name: string;
  id: "starter" | "pro" | "advanced" | "free" | "monthly" | "yearly";
  description: string;
  features: string[];
  featured: boolean;
  priceId?: Record<string, string> | null;
  frequency?: string;
}
export interface PolarTier extends Tier {
  productId?: string | null;
  price?: number;
}

export const POLAR_PRICES: PolarTier[] = [
  {
    name: "Free",
    id: "free",
    description: "Free tier.",
    features: [
      "50 Credits",
      "Create Unlimited AI Models",
      "Access to all tools",
      "Images gets deleted after 24 hours",
    ],
    featured: false,
    productId: null,
    price: 0,
    frequency: "/month",
  },
  {
    name: "Yearly",
    id: "yearly",
    description: "Yearly subscription.",
    features: [
      "Everything in Free",
      "100 credits per month",
      "Community support",
      "Standard processing",
    ],
    featured: true,
    productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO_YEARLY,
    price: 99,
    frequency: "/year",
  },
  {
    name: "Monthly",
    id: "monthly",
    description: "Monthly subscription.",
    features: [
      "All Free features",
      "Unlimited credits",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
      "API access",
    ],
    featured: false,
    productId: process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY,
    price: 15,
    frequency: "/month",
  },
];
