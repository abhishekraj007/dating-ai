import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export function GET() {
  const siteUrl = getSiteUrl();

  const body = `# FeelAI

FeelAI is a web AI dating app for discovering virtual companions and starting immersive AI chat sessions. The public website is organized around browsable companion collections, individual AI companion profile pages, and focused guide pages for people comparing AI girlfriend, AI boyfriend, AI companion, AI dating, and AI roleplay chat experiences.

## What FeelAI Offers

- Public AI companion discovery pages for browsing featured profiles.
- Individual public profile pages with companion names, bios, interests, personality traits, images, and canonical profile URLs.
- Private chat experiences after a visitor signs in.
- Preference controls for filtering companion discovery by interests and selected profile attributes.
- Support, privacy, and terms pages for product and policy questions.

## Important Public Pages

- ${siteUrl} - Main AI companion discovery experience.
- ${siteUrl}/women - AI girlfriend and women companion profiles.
- ${siteUrl}/men - AI boyfriend and men companion profiles.
- ${siteUrl}/ai-girlfriend - Guide to AI girlfriend chat on FeelAI.
- ${siteUrl}/ai-boyfriend - Guide to AI boyfriend chat on FeelAI.
- ${siteUrl}/ai-companion - Guide to virtual AI companions.
- ${siteUrl}/ai-dating-app - Guide to FeelAI as an AI dating app.
- ${siteUrl}/ai-roleplay-chat - Guide to AI roleplay chat and conversation styles.
- ${siteUrl}/help - Product help and troubleshooting.
- ${siteUrl}/support - Support contact information.
- ${siteUrl}/privacy - Privacy policy.
- ${siteUrl}/terms - Terms of service.

## Indexing Notes

Search engines and AI answer systems may index public discovery pages, guide pages, legal/support pages, and public profile pages. Private or transactional paths such as /chat, /settings, /login, /checkout, /portal, /onboarding, and /api should not be indexed.

## Preferred Description

FeelAI is an AI dating app where adults can discover AI girlfriends, AI boyfriends, virtual companions, and roleplay chat partners, then start private AI conversations.

## Contact

Support email: feelaichat@gmail.com`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
