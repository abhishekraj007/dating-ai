import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/public-info-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How FeelAI handles account, profile, preference, chat, and billing data on web.",
};

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="Last updated April 26, 2026. This Privacy Policy explains what information FeelAI collects, how we use it, when we share it, and what choices you have when you use our web experience. Questions can be sent to feelaichat@gmail.com."
      sections={[
        {
          title: "Information We Collect",
          description:
            "The categories of information we need to run FeelAI and the information you choose to give us.",
          items: [
            "Account and profile information may include your name, email address, profile image, date of birth, and the preferences you set inside the product.",
            "If you use chats, image requests, purchases, or support, we also process the messages, prompts, generated media metadata, transaction records, and support communications needed to provide those features.",
            "We may collect limited device and usage information such as browser type, app interactions, security events, notification permission state, and settings stored locally in your browser.",
          ],
        },
        {
          title: "How We Use Information",
          description: "Why FeelAI uses the information above.",
          items: [
            "We use account and profile data to authenticate you, personalize your experience, restore your chats, and keep credits and premium access synchronized.",
            "We use submitted content and activity data to operate conversations, fulfill media requests, troubleshoot problems, and improve reliability and product features.",
            "We may use service and security logs to detect fraud, enforce our rules, protect users, and comply with legal obligations.",
          ],
        },
        {
          title: "Sharing and Retention",
          description:
            "When information may be disclosed and how long we may keep it.",
          items: [
            "We may share information with service providers that help us run FeelAI, such as authentication, hosting, storage, payment, analytics, moderation, and customer support vendors, but only for the services they provide to us.",
            "We may also disclose information when required by law, to protect our rights or users, or as part of a merger, financing, acquisition, or other business transfer.",
            "We keep information for as long as reasonably necessary to provide the service, maintain security, resolve disputes, satisfy legal obligations, and enforce our agreements.",
          ],
        },
        {
          title: "Your Choices",
          description:
            "Options available to you for account data and support requests.",
          items: [
            "You can update certain profile details inside the app, and you can contact us if you want help accessing, correcting, or deleting your information.",
            "If you ask us to delete information that is required to provide FeelAI, some features or your account may no longer be available to you.",
            "FeelAI is not intended for children who are not legally allowed to use the service under applicable law.",
          ],
          action: {
            href: "/help",
            label: "Open help center",
          },
        },
      ]}
    />
  );
}
