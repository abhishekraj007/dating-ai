import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/public-info-page";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Answers to common FeelAI questions and quick troubleshooting tips.",
};

export default function HelpCenterPage() {
  return (
    <PublicInfoPage
      eyebrow="Help Center"
      title="Everything you need to get back into FeelAI quickly."
      description="This page covers the core questions we already answer in structured data plus the most common next steps for access, billing, and chat issues."
      sections={[
        {
          title: "About FeelAI",
          description: "The basics behind the web experience and companion discovery flow.",
          items: [
            "FeelAI is an AI dating platform built for immersive companions, AI friends, and always-on conversations.",
            "The public homepage is server-rendered so search engines can index companion cards, supporting copy, and structured data from the first request.",
            "You can switch between dark and light mode at any time from the public UI or inside the account tab.",
          ],
        },
        {
          title: "Common fixes",
          description: "Try these before contacting support.",
          items: [
            "If billing or credits look out of date, reopen the account tab or refresh after checkout completes.",
            "If a chat image is locked, confirm your premium state from the account screen and reopen the conversation.",
            "If chat loading feels stuck, return to the chat list and reopen the conversation so the signed image URLs refresh.",
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