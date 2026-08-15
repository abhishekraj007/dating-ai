import { JsonLd } from "@/components/public/json-ld";
import { PublicPageContent } from "@/components/public/public-page-content";
import { HOME_SEO_FAQS } from "@/components/public/home-seo-content";
import { buildPublicPageMetadata } from "@/lib/public-metadata";
import { getInitialPublicProfiles } from "@/lib/public-profiles.server";
import { buildHomeStructuredData } from "@/lib/public-structured-data";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 60;

const HOME_TITLE = "FeelAI - AI Girlfriend & AI Boyfriend Chat";
const HOME_DESCRIPTION =
  "Browse AI girlfriends, AI boyfriends, and virtual companions for dating-style chat, roleplay, friendship, and immersive conversations.";

export const metadata = buildPublicPageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  absoluteTitle: HOME_TITLE,
});

export default async function HomePage() {
  const siteUrl = getSiteUrl();
  const initialProfiles = await getInitialPublicProfiles("girls");
  const structuredData = buildHomeStructuredData(
    siteUrl,
    initialProfiles,
    HOME_SEO_FAQS.map((faq) => ({ name: faq.question, text: faq.answer })),
  );

  return (
    <>
      <JsonLd data={structuredData} />
      <PublicPageContent
        initialProfiles={initialProfiles}
        segment="girls"
        variant="home"
      />
    </>
  );
}
