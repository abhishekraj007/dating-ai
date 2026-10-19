/**
 * Minimal Telegram Bot API client.
 *
 * We intentionally keep this in-house instead of using a third-party Convex
 * component: the surface we need is small (messages, media, topics, webhook
 * setup) and we want full control over webhook timing and scheduling.
 *
 * All functions require TELEGRAM_BOT_TOKEN to be configured on the deployment.
 */

export const TELEGRAM_API_BASE = "https://api.telegram.org";
export const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;
export const TELEGRAM_MAX_CAPTION_LENGTH = 1024;

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
  parameters?: { retry_after?: number };
};

export class TelegramApiError extends Error {
  readonly method: string;
  readonly errorCode: number | undefined;
  readonly retryAfter: number | undefined;

  constructor(
    method: string,
    description: string,
    errorCode: number | undefined,
    retryAfter: number | undefined,
  ) {
    super(`Telegram ${method} failed: ${description}`);
    this.name = "TelegramApiError";
    this.method = method;
    this.errorCode = errorCode;
    this.retryAfter = retryAfter;
  }
}

export function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  return token;
}

export function getTelegramBotUsername(): string | null {
  const username = process.env.TELEGRAM_BOT_USERNAME;
  return username ? username.replace(/^@/, "") : null;
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME);
}

export async function callTelegram<T>(
  method: string,
  payload?: Record<string, unknown>,
): Promise<T> {
  const token = getTelegramBotToken();
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });

  let data: TelegramApiResponse<T>;
  try {
    data = (await response.json()) as TelegramApiResponse<T>;
  } catch {
    throw new TelegramApiError(
      method,
      `unexpected response (status ${response.status})`,
      undefined,
      undefined,
    );
  }

  if (!data.ok) {
    throw new TelegramApiError(
      method,
      data.description ?? `request failed (status ${response.status})`,
      data.error_code,
      data.parameters?.retry_after,
    );
  }

  return data.result as T;
}

type TelegramTarget = {
  chatId: string;
  topicId?: number;
};

/** Sends one message. Text must already be split to fit the 4096 limit. */
export async function sendTelegramMessage(
  target: TelegramTarget,
  text: string,
  options?: { disableNotification?: boolean },
): Promise<void> {
  await callTelegram("sendMessage", {
    chat_id: target.chatId,
    text,
    message_thread_id: target.topicId,
    disable_notification: options?.disableNotification,
  });
}

/** Splits a long text into Telegram-sized chunks on paragraph boundaries. */
export function splitTelegramText(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= TELEGRAM_MAX_MESSAGE_LENGTH) {
    return [trimmed];
  }

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of trimmed.split("\n\n")) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= TELEGRAM_MAX_MESSAGE_LENGTH) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (paragraph.length <= TELEGRAM_MAX_MESSAGE_LENGTH) {
      current = paragraph;
      continue;
    }

    // Hard-split paragraphs that are still too long.
    for (let i = 0; i < paragraph.length; i += TELEGRAM_MAX_MESSAGE_LENGTH) {
      chunks.push(paragraph.slice(i, i + TELEGRAM_MAX_MESSAGE_LENGTH));
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function truncateCaption(caption: string | undefined): string | undefined {
  if (!caption) {
    return undefined;
  }
  return caption.length > TELEGRAM_MAX_CAPTION_LENGTH
    ? `${caption.slice(0, TELEGRAM_MAX_CAPTION_LENGTH - 1)}…`
    : caption;
}

export async function sendTelegramPhoto(
  target: TelegramTarget,
  photoUrl: string,
  caption?: string,
): Promise<void> {
  await callTelegram("sendPhoto", {
    chat_id: target.chatId,
    photo: photoUrl,
    caption: truncateCaption(caption),
    message_thread_id: target.topicId,
  });
}

export async function sendTelegramVideo(
  target: TelegramTarget,
  videoUrl: string,
  caption?: string,
): Promise<void> {
  await callTelegram("sendVideo", {
    chat_id: target.chatId,
    video: videoUrl,
    caption: truncateCaption(caption),
    message_thread_id: target.topicId,
  });
}

export async function sendTelegramChatAction(
  target: TelegramTarget,
  action: "typing" = "typing",
): Promise<void> {
  await callTelegram("sendChatAction", {
    chat_id: target.chatId,
    action,
    message_thread_id: target.topicId,
  });
}

/** Creates a forum topic in the private chat and returns its thread id. */
export async function createTelegramForumTopic(
  chatId: string,
  name: string,
): Promise<number> {
  const result = await callTelegram<{ message_thread_id: number }>(
    "createForumTopic",
    {
      chat_id: chatId,
      name: name.slice(0, 128),
    },
  );
  return result.message_thread_id;
}

export async function deleteTelegramForumTopic(
  chatId: string,
  topicId: number,
): Promise<void> {
  await callTelegram("deleteForumTopic", {
    chat_id: chatId,
    message_thread_id: topicId,
  });
}

export type TelegramBotCommand = {
  command: string;
  description: string;
};

export async function setTelegramCommands(
  commands: Array<TelegramBotCommand>,
): Promise<void> {
  await callTelegram("setMyCommands", { commands });
}

export async function setTelegramWebhook(args: {
  url: string;
  secretToken: string;
}): Promise<void> {
  await callTelegram("setWebhook", {
    url: args.url,
    secret_token: args.secretToken,
    allowed_updates: ["message"],
  });
}

export async function deleteTelegramWebhook(): Promise<void> {
  await callTelegram("deleteWebhook", {});
}

/** Deep link users tap to open the bot with a one-time payload. */
export function buildTelegramDeepLink(
  botUsername: string,
  payload: string,
): string {
  return `https://t.me/${botUsername}?start=${encodeURIComponent(payload)}`;
}
