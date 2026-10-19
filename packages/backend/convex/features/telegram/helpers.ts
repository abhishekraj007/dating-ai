/**
 * Pure helpers for the Telegram integration: link tokens, command parsing
 * and shared bot copy.
 */

const LINK_TOKEN_BYTES = 16;

export function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

/** 32 hex chars, well under Telegram's 64-char deep-link payload limit. */
export function generateLinkToken(): string {
  const bytes = new Uint8Array(LINK_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashLinkToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return bytesToHex(new Uint8Array(digest));
}

export type ParsedTelegramCommand = {
  command: string;
  args: string;
};

/** Parses "/start payload" and "/help@bot" style commands. */
export function parseTelegramCommand(
  text: string,
): ParsedTelegramCommand | null {
  const match = /^\/([A-Za-z0-9_]+)(?:@[A-Za-z0-9_]+)?(?:\s+([\s\S]*))?$/.exec(
    text.trim(),
  );
  if (!match) {
    return null;
  }
  return {
    command: match[1].toLowerCase(),
    args: (match[2] ?? "").trim(),
  };
}

/**
 * Private-chat topics are opt-in per deployment: enable them once the bot
 * has topics turned on in BotFather. Off by default (single-DM fallback).
 */
export function isTelegramTopicsEnabled(): boolean {
  return process.env.TELEGRAM_TOPICS_ENABLED === "true";
}

export function truncatePreview(text: string, maxLength = 200): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}…`
    : normalized;
}

export const TELEGRAM_HELP_TEXT = [
  "I'm the FeelChat bot. I connect you to your AI characters from the app.",
  "",
  "How it works:",
  "1. Open FeelChat and go to a character's profile.",
  '2. Tap "Continue on Telegram".',
  "3. Come back here and press Start — that chat is connected.",
  "",
  "Commands:",
  "/help - show this message",
  "/switch - choose which character you're talking to",
  "/unlink - disconnect this chat from your account",
  "/privacy - privacy policy",
].join("\n");

export const TELEGRAM_NOT_LINKED_TEXT = [
  "This chat isn't connected to a FeelChat account yet.",
  "",
  'Open the FeelChat app, go to a character profile and tap "Continue on Telegram".',
  "Then come back here and press the link you get — it only takes a few seconds.",
].join("\n");

export const TELEGRAM_LINK_EXPIRED_TEXT =
  "That link has expired or was already used. Open the app and tap \"Continue on Telegram\" again to get a fresh one.";

export const TELEGRAM_UNLINKED_TEXT =
  "Done — this chat is disconnected from your FeelChat account. You can link it again any time from the app.";

export const TELEGRAM_TEXT_ONLY_TEXT =
  "I can only read text messages for now. Send me a message and I'll pass it on.";

export function buildTelegramConnectedText(profileName: string): string {
  return `Connected! You're now chatting with ${profileName}. Say hi.`;
}

export function buildTelegramCreditsText(
  requiredCredits: number | undefined,
  topUpUrl: string | undefined,
): string {
  const requirement = requiredCredits
    ? `You need at least ${requiredCredits} credits for that.`
    : "You're out of credits.";
  const topUp = topUpUrl
    ? `Top up in the app: ${topUpUrl}`
    : "Open the FeelChat app to top up your credits.";
  return `${requirement} ${topUp}`;
}

export const TELEGRAM_RETRYABLE_ERROR_TEXT =
  "I had trouble responding just now. Please try again in a moment.";

export const TELEGRAM_GENERIC_ERROR_TEXT =
  "Something went wrong on my side. Please try again in a moment.";

export const TELEGRAM_MEDIA_FAILED_TEXT =
  "My camera glitched on that one — ask me again in a moment.";

/**
 * Minimal structural shape of an agent message used for delivery.
 * The Agent component strips `parentMessageId` from query results, so
 * response messages are matched by `order` instead.
 */
export type DeliverableMessage = {
  status: string;
  order: number;
  stepOrder: number;
  message?: {
    role?: string;
    content?: unknown;
  } | null;
};

export type DeliverableContent =
  | { kind: "text"; text: string }
  | { kind: "credits_required"; requiredCredits?: number }
  | { kind: "retryable_error" };

const SKIPPED_CONTENT_TYPES = new Set([
  "image_processing",
  "video_processing",
  "image_response",
  "video_response",
  "image_failed",
  "video_failed",
]);

function tryParseJsonObject(
  value: string,
): Record<string, unknown> | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Converts an agent message into something deliverable to a chat channel.
 * Media placeholders/responses are skipped (media is delivered separately),
 * credits_required and chat_error payloads become human-readable messages.
 */
export function extractDeliverableContent(
  doc: DeliverableMessage,
): DeliverableContent | null {
  const content = doc.message?.content;

  if (typeof content === "string") {
    const parsed = tryParseJsonObject(content);
    if (parsed && typeof parsed.type === "string") {
      if (parsed.type === "credits_required") {
        return {
          kind: "credits_required",
          requiredCredits:
            typeof parsed.requiredCredits === "number"
              ? parsed.requiredCredits
              : undefined,
        };
      }
      if (parsed.type === "chat_error") {
        return { kind: "retryable_error" };
      }
      if (SKIPPED_CONTENT_TYPES.has(parsed.type)) {
        return null;
      }
    }

    const text = content.trim();
    return text.length > 0 ? { kind: "text", text } : null;
  }

  if (Array.isArray(content)) {
    const texts: string[] = [];
    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        (part as { type?: unknown }).type === "text" &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        texts.push((part as { text: string }).text);
      }
    }
    const text = texts.join("\n\n").trim();
    return text.length > 0 ? { kind: "text", text } : null;
  }

  return null;
}

/** Assistant response messages for one prompt share the prompt's `order`. */
export function collectResponseMessages<T extends DeliverableMessage>(
  messages: T[],
  promptOrder: number,
): T[] {
  return messages
    .filter(
      (message) =>
        message.order === promptOrder &&
        message.status === "success" &&
        message.message?.role === "assistant",
    )
    .sort((left, right) => left.stepOrder - right.stepOrder);
}
