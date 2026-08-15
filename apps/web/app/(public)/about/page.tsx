import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/public-info-page";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us – AI Companions & Virtual Dating",
  description:
    "Learn about FeelAI, our mission to create immersive virtual AI companions, and how our interactive dating and roleplay platform works.",
  alternates: {
    canonical: `${getSiteUrl()}/about`,
  },
};

export default function AboutPage() {
  return (
    <PublicInfoPage
      eyebrow="About FeelAI"
      title="Crafting the next generation of conversational AI companions."
      description="FeelAI was built to provide meaningful, engaging, and safe virtual companionship for adults seeking connection, creative roleplay, and dating-style conversation."
      sections={[
        {
          title: "Our Mission",
          description:
            "Bringing virtual companions to life with distinct personalities, backgrounds, and conversational styles.",
          items: [
            "We believe AI companions can provide engaging storytelling, emotional connection, and casual conversation whenever you want.",
            "Each companion has unique traits, occupations, and interests to make every chat feel personalized and distinct.",
            "Our platform is built mobile-first, ensuring responsive and fast conversation experiences across devices.",
          ],
        },
        {
          title: "What FeelAI Is",
          description: "An entertainment-focused virtual companion platform.",
          items: [
            "100% artificial intelligence virtual characters.",
            "A safe environment to explore romance, flirty banter, dating scenarios, and creative roleplay.",
            "Designed for adults who enjoy narrative immersion and always-available companionship.",
          ],
        },
        {
          title: "What FeelAI Is Not",
          description: "Clear boundaries on what our service provides.",
          items: [
            "FeelAI is not a human dating app; you will never be matched with real people.",
            "FeelAI is not a licensed medical, psychological, or therapy service.",
            "Our characters are fictional entities and should not replace real-world human relationships.",
          ],
        },
        {
          title: "Privacy & Security",
          description: "Your conversations remain private to your account.",
          items: [
            "All private chats are isolated and never indexed by search engines or bots.",
            "Account credentials and billing information are secured through industry-standard encryption.",
            "You have full control over your conversation history and preferences.",
          ],
          action: {
            href: "/safety",
            label: "Read safety policy",
          },
        },
      ]}
    />
  );
}
