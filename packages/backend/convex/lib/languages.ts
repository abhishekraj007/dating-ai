import { v } from "convex/values";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "hi", label: "हिन्दी" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "العربية" },
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: AppLanguage = "en";

export const appLanguageValidator = v.union(
  v.literal("en"),
  v.literal("es"),
  v.literal("fr"),
  v.literal("de"),
  v.literal("pt"),
  v.literal("hi"),
  v.literal("ja"),
  v.literal("ko"),
  v.literal("zh"),
  v.literal("ar"),
);

const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  hi: "Hindi",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
};

export function getLanguageLabel(code: AppLanguage): string {
  return LANGUAGE_LABELS[code];
}

export function resolveChatLanguage(
  chatLanguage: AppLanguage | undefined | null,
  appLanguage: AppLanguage | undefined | null,
): AppLanguage {
  if (chatLanguage) {
    return chatLanguage;
  }
  if (appLanguage) {
    return appLanguage;
  }
  return DEFAULT_LANGUAGE;
}
