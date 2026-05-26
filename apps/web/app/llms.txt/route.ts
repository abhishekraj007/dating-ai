import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export function GET() {
  const siteUrl = getSiteUrl();

  const body = `# FeelAI

> FeelAI is an AI dating app for discovering virtual companions, AI girlfriends, AI boyfriends, and immersive AI chat experiences.

## Primary URLs

- Homepage: ${siteUrl}
- AI girlfriends: ${siteUrl}/women
- AI boyfriends: ${siteUrl}/men
- AI girlfriend guide: ${siteUrl}/ai-girlfriend
- AI boyfriend guide: ${siteUrl}/ai-boyfriend
- AI dating app guide: ${siteUrl}/ai-dating-app
- AI companion guide: ${siteUrl}/ai-companion
- AI roleplay chat guide: ${siteUrl}/ai-roleplay-chat
- Help: ${siteUrl}/help
- Privacy: ${siteUrl}/privacy
- Terms: ${siteUrl}/terms

## Summary

FeelAI helps adults explore AI companion profiles, choose a personality, and start private AI chat sessions for dating-style conversation, companionship, roleplay, and creative dialogue.

## Crawling

Public discovery pages and public AI companion profile pages are intended for indexing. Account, checkout, chat, settings, onboarding, API, and portal paths are private or transactional and should not be indexed.

## More Detail

See ${siteUrl}/llms-full.txt for a fuller agent-facing summary.`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
