import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_LANGUAGE, type AppLanguage } from "./types";
import { TRANSLATIONS } from "./translations";

const LANGUAGE_STORAGE_KEY = "@app_language";

let currentLanguage: AppLanguage = DEFAULT_LANGUAGE;

const interpolate = (
  template: string,
  values?: Record<string, string | number>,
) => {
  if (!values) {
    return template;
  }
  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
    const value = values[rawKey.trim()];
    return value === undefined ? "" : String(value);
  });
};

export function setI18nLanguage(lang: AppLanguage) {
  currentLanguage = lang;
}

export function getI18nLanguage() {
  return currentLanguage;
}

export function t(key: string, values?: Record<string, string | number>) {
  const map = TRANSLATIONS[currentLanguage] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
  const template = map[key] ?? key;
  return interpolate(template, values);
}

export async function loadSavedLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && saved in TRANSLATIONS) {
      currentLanguage = saved as AppLanguage;
    }
  } catch {
    // keep default
  }
}
