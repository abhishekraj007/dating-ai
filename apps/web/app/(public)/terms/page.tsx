import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public/public-info-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Core terms for using FeelAI on the web, including account, conduct, AI output, and paid feature rules.",
};

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Terms of Service"
      description="Last updated April 26, 2026. These Terms govern your access to and use of FeelAI on the web. By creating an account, purchasing credits or premium, or using the product, you agree to these Terms and our Privacy Policy. Questions can be sent to feelaichat@gmail.com."
      sections={[
        {
          title: "Eligibility and Accounts",
          description:
            "The basic rules for using FeelAI and maintaining an account.",
          items: [
            "You agree to provide accurate account information and to keep your login credentials secure.",
            "You are responsible for activity that happens through your account, including purchases, chats, and submitted content.",
            "We may suspend or restrict access if we believe your account is being used for fraud, abuse, scraping, evasion of limits, or other violations of these Terms.",
          ],
        },
        {
          title: "Acceptable Use",
          description: "What you may not do while using FeelAI.",
          items: [
            "You may not use FeelAI for unlawful, abusive, harassing, infringing, deceptive, or harmful activity.",
            "You may not attempt to reverse engineer the service, scrape data at scale, bypass technical protections, or interfere with platform security or availability.",
            "You may only upload or submit content that you have the right to use and share.",
          ],
        },
        {
          title: "AI Output and User Content",
          description:
            "How submitted content and generated output should be understood.",
          items: [
            "AI-generated responses and media can be inaccurate, incomplete, delayed, or inappropriate, so you should not rely on them as professional, legal, medical, financial, or safety advice.",
            "You keep the rights you already have in the content you submit, but you give us the permissions reasonably necessary to host, process, display, secure, and operate the service using that content.",
            "You are responsible for the content you submit and for how you use any generated output outside the service.",
          ],
        },
        {
          title: "Paid Features",
          description: "How credits, subscriptions, and premium access work.",
          items: [
            "Credits and premium unlock product features, but they do not transfer ownership of FeelAI, its models, or the underlying service.",
            "Prices, plans, and premium features may change over time. We may also update how credits or subscriptions are packaged, subject to applicable law.",
            "Purchases are tied to your authenticated account. After checkout, some screens may require a refresh or a brief delay while billing and premium state synchronize.",
          ],
        },
        {
          title: "Disclaimers, Changes, and Contact",
          description:
            "Important limits on the service and how we communicate updates.",
          items: [
            "FeelAI is provided on an as-available basis to the extent permitted by law, and we do not guarantee uninterrupted service or error-free AI output.",
            "We may update these Terms from time to time by posting a revised version on the site. Continued use after an update means you accept the revised Terms.",
            "If you have questions about these Terms or need to report a violation, contact feelaichat@gmail.com.",
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
