import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/public-info-page";

export const metadata: Metadata = {
  title: "Support",
  description: "Support steps and troubleshooting guidance for FeelAI web.",
};

export default function SupportPage() {
  return (
    <PublicInfoPage
      eyebrow="Support"
      title="Troubleshoot billing, access, and chat issues on web."
      description="This fallback support page is available directly inside the web app so users always have a working place to start, even when an external support destination is not configured."
      sections={[
        {
          title: "Billing and subscriptions",
          description: "Credits, premium access, and checkout troubleshooting.",
          items: [
            "Use the Account tab to reopen the credits or premium purchase flows without leaving the app.",
            "If your purchase completed but the UI looks stale, give it a moment and reopen the page so the latest account state is fetched.",
            "For locked images, verify premium status first because chat media gating is tied to the current viewer plan.",
          ],
        },
        {
          title: "Chat issues",
          description: "Steps for conversation and image request problems.",
          items: [
            "Return to the chat list and reopen the conversation if messages or media stop updating.",
            "Selfie and image requests use credits, so confirm your credit balance from the account tab before retrying.",
            "If a conversation looks broken after a network interruption, refresh the route to rebuild the chat view from the latest backend state.",
          ],
          action: {
            href: "/help",
            label: "See help center",
          },
        },
      ]}
    />
  );
}
