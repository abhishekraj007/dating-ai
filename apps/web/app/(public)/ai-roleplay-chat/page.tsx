import {
  generatePublicSeoMetadata,
  PublicSeoPageRoute,
} from "@/components/public/public-seo-page-route";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata = generatePublicSeoMetadata("ai-roleplay-chat");

export default function AIRoleplayChatSeoPage() {
  return <PublicSeoPageRoute slug="ai-roleplay-chat" />;
}
