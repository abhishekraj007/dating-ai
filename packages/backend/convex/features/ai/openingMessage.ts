import type { Doc } from "../../_generated/dataModel";
import { getLanguageLabel, type AppLanguage } from "../../lib/languages";

export function buildOpeningMessageFallback(
  profile: Doc<"aiProfiles">,
  chatLanguage: AppLanguage,
): string {
  const name = profile.name;
  const job = profile.occupation?.trim();
  const english = job
    ? `Hey... I'm ${name}. ${job} by day. You actually opened the chat — I like that. What's your night looking like?`
    : `Hey, it's ${name}. I was hoping you'd tap. Don't leave me hanging — tell me something true.`;

  if (chatLanguage === "en") {
    return english;
  }

  return english;
}

export function buildOpeningMessagePrompt(
  profile: Doc<"aiProfiles">,
  chatLanguage: AppLanguage,
): string {
  const languageLabel = getLanguageLabel(chatLanguage);
  const job = profile.occupation?.trim();
  const trait = profile.personalityTraits?.[0];

  return `The user just opened a chat with you for the first time. They have not sent a message yet.
Write ONLY your opening text message as ${profile.name}${job ? `, who works as ${job}` : ""}${trait ? `. You come across as ${trait}` : ""}.

Rules:
- 1-2 short sentences, like a real text
- Warm, a little flirty, specific to who you are
- Do not mention the app, AI, matching, onboarding, or that this is a first message
- No quotes, no prefix, no emoji spam
- Write in ${languageLabel}`;
}
