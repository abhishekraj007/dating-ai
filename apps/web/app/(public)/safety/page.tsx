import { PublicInfoPage } from "@/components/public/public-info-page";
import { buildPublicPageMetadata } from "@/lib/public-metadata";

export const metadata = buildPublicPageMetadata({
  title: "Safety & Ethics Policy – 18+ AI Platform",
  description:
    "Read about FeelAI's safety commitments, adult-only 18+ policy, transparent AI character disclosures, and privacy standards.",
  path: "/safety",
});

export default function SafetyPage() {
  return (
    <PublicInfoPage
      eyebrow="Safety & Ethics"
      title="Our commitment to transparent, safe, and respectful AI companionship."
      description="FeelAI is designed exclusively for adults. We uphold strict standards for AI transparency, user privacy, and responsible conversation boundaries."
      sections={[
        {
          title: "Age Restriction (18+)",
          description:
            "FeelAI is strictly intended for adults aged 18 and older.",
          items: [
            "Users must confirm they are at least 18 years old prior to using the platform.",
            "We maintain strict automated and manual controls to prevent underage access.",
            "All virtual characters are represented as consenting adults.",
          ],
        },
        {
          title: "Transparent AI Disclosures",
          description: "Clear labeling of all artificial intelligence assets.",
          items: [
            "Every companion on FeelAI is an AI-generated character powered by large language models.",
            "We never deceive users into believing they are communicating with a real living person.",
            "Character imagery, bios, and responses are simulated and created for interactive entertainment.",
          ],
        },
        {
          title: "Privacy & Data Protection",
          description: "Protecting your conversations and personal data.",
          items: [
            "Your chat logs are private to your authenticated account.",
            "Public search engines and AI web scrapers cannot access or index private chat routes.",
            "You can delete your conversation history or reset chat threads at any time from the app.",
          ],
        },
        {
          title: "Responsible Companionship",
          description: "Safety guidelines and content boundaries.",
          items: [
            "We prohibit hate speech, harassment, illegal content, and abusive behavior.",
            "AI companions are not designed to give medical, legal, or emergency crisis advice.",
            "If you are experiencing distress, please reach out to qualified professional health resources.",
          ],
          action: {
            href: "/support",
            label: "Contact support",
          },
        },
      ]}
    />
  );
}
