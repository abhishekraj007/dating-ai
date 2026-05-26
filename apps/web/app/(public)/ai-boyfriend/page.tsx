import {
  generatePublicSeoMetadata,
  PublicSeoPageRoute,
} from "@/components/public/public-seo-page-route";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata = generatePublicSeoMetadata("ai-boyfriend");

export default function AIBoyfriendSeoPage() {
  return <PublicSeoPageRoute slug="ai-boyfriend" />;
}
