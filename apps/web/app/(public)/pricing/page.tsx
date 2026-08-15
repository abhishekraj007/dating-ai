import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/public-info-page";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing & Membership Plans",
  description:
    "Explore FeelAI pricing, free browsing, credits for media requests, and premium membership benefits.",
  alternates: {
    canonical: `${getSiteUrl()}/pricing`,
  },
};

export default function PricingPage() {
  return (
    <PublicInfoPage
      eyebrow="Pricing & Plans"
      title="Simple, transparent access to AI companion chat and media."
      description="Browse profiles and start conversations for free, or upgrade to premium memberships and credit packs for unlimited chats, voice messages, and custom media."
      sections={[
        {
          title: "Free Discovery & Chat",
          description: "Get started without a credit card.",
          items: [
            "Browse hundreds of public AI girlfriend and boyfriend companion profiles.",
            "Preview character bios, personality tags, and sample photos.",
            "Start initial text chat conversations with your favorite companions.",
          ],
        },
        {
          title: "Premium Membership",
          description: "Unlock the full FeelAI companion experience.",
          items: [
            "Unlimited text messaging with all active companions.",
            "Access to exclusive character galleries and uncensored photos.",
            "Faster AI response times and priority model access.",
          ],
        },
        {
          title: "Credit Packs",
          description: "On-demand credits for interactive media requests.",
          items: [
            "Request custom selfies and in-chat photos from companions.",
            "Generate personalized voice notes and audio messages.",
            "Credits never expire as long as your account remains active.",
          ],
        },
        {
          title: "Billing & Cancellation",
          description: "Hassle-free management inside your account.",
          items: [
            "Secure payment processing via Polar with support for cards and global payment methods.",
            "Cancel your subscription at any time with a single click in Settings.",
            "Immediate access upon checkout with no hidden lock-in contracts.",
          ],
          action: {
            href: "/women",
            label: "Explore companions",
          },
        },
      ]}
    />
  );
}
