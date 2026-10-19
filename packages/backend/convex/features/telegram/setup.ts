import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import {
  deleteTelegramWebhook,
  getTelegramBotUsername,
  isTelegramConfigured,
  setTelegramCommands,
  setTelegramWebhook,
} from "./client";

const TELEGRAM_COMMANDS = [
  {
    command: "help",
    description: "How linking works and what I can do",
  },
  {
    command: "switch",
    description: "Choose which character you're chatting with",
  },
  {
    command: "unlink",
    description: "Disconnect this chat from your FeelChat account",
  },
  {
    command: "privacy",
    description: "Show the privacy policy link",
  },
];

function resolveWebhookUrl(): string {
  const siteUrl = process.env.CONVEX_SITE_URL;
  if (!siteUrl) {
    throw new Error("CONVEX_SITE_URL is not configured");
  }
  return `${siteUrl.replace(/\/+$/, "")}/telegram/webhook`;
}

/**
 * Registers the Telegram webhook and bot commands.
 * Run once per deployment after setting TELEGRAM_BOT_TOKEN,
 * TELEGRAM_BOT_USERNAME and TELEGRAM_WEBHOOK_SECRET:
 *   npx convex run features/telegram/setup:setupWebhook
 */
export const setupWebhook = internalAction({
  args: { webhookUrl: v.optional(v.string()) },
  returns: v.object({ webhookUrl: v.string(), botUsername: v.string() }),
  handler: async (_ctx, { webhookUrl }) => {
    if (!isTelegramConfigured()) {
      throw new Error(
        "Telegram is not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_BOT_USERNAME)",
      );
    }

    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secretToken) {
      throw new Error("TELEGRAM_WEBHOOK_SECRET is not configured");
    }

    const url = webhookUrl ?? resolveWebhookUrl();
    await setTelegramWebhook({ url, secretToken });
    await setTelegramCommands(TELEGRAM_COMMANDS);

    return {
      webhookUrl: url,
      botUsername: getTelegramBotUsername() ?? "",
    };
  },
});

export const removeWebhook = internalAction({
  args: {},
  returns: v.null(),
  handler: async () => {
    await deleteTelegramWebhook();
    return null;
  },
});
