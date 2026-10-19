import { v } from "convex/values";

/**
 * Platforms a chat message can originate from: the native app, the web app,
 * or a chat channel bridged into the shared AI pipeline (Telegram).
 */
export const chatPlatformValidator = v.union(
  v.literal("ios"),
  v.literal("android"),
  v.literal("web"),
  v.literal("telegram"),
);

export type ChatPlatform = "ios" | "android" | "web" | "telegram";
