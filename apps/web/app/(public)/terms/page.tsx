import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/public-info-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Core terms for using FeelAI on the web.",
};

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Terms of Service"
      description="These fallback terms outline the main expectations for using FeelAI while the full policy surface continues to evolve."
      sections={[
        {
          title: "Using FeelAI",
          description: "What users agree to when accessing the product.",
          items: [
            "You are responsible for using FeelAI in compliance with local laws and platform rules.",
            "Account access, subscription state, and credit balances are tied to your authenticated identity.",
            "Abuse, fraud, scraping, or attempts to bypass account limits may result in access restrictions.",
          ],
        },
        {
          title: "Purchases and content",
          description: "How paid features and generated content should be treated.",
          items: [
            "Credits and premium unlock product features, but they do not transfer ownership of the platform or its models.",
            "AI-generated outputs can be imperfect, so you should review important content before relying on it.",
            "Purchased features may change as the product evolves, but account access and billing state should continue to reflect completed purchases.",
          ],
          action: {
            href: "/privacy",
            label: "Read privacy policy",
          },
        },
      ]}
    />
  );
}