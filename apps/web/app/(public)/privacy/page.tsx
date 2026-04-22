import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/public-info-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "A concise privacy summary for FeelAI web.",
};

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="This fallback privacy page explains the main categories of data the web app uses so users always have an accessible policy route."
      sections={[
        {
          title: "What FeelAI uses",
          description:
            "The essential account and product data used in the web experience.",
          items: [
            "Authentication data is used to identify your account and restore protected features like chats, credits, and premium access.",
            "Chat history and related profile context are used to render conversations and media requests in the app.",
            "Basic client preferences such as theme, language, and browser notification permission can be stored locally in your browser.",
          ],
        },
        {
          title: "How it is used",
          description: "Why the app needs this information.",
          items: [
            "Account data keeps billing, premium gating, and credit balances synchronized across the app.",
            "Local preferences improve the product experience without requiring you to reconfigure the app every time you return.",
            "Operational data may be used to diagnose issues, prevent abuse, and keep the product working reliably.",
          ],
          action: {
            href: "/support",
            label: "Open support",
          },
        },
      ]}
    />
  );
}
