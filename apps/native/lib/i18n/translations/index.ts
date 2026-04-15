import {
  SUPPORTED_LANGUAGES,
  type AppLanguage,
  type TranslationMap,
} from "../types";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { de } from "./de";
import { pt } from "./pt";
import { hi } from "./hi";
import { ja } from "./ja";
import { ko } from "./ko";
import { zh } from "./zh";
import { ar } from "./ar";

export const TRANSLATIONS: Record<AppLanguage, TranslationMap> = {
  en,
  es,
  fr,
  de,
  pt,
  hi,
  ja,
  ko,
  zh,
  ar,
};

const englishKeys = Object.keys(TRANSLATIONS.en);

for (const locale of SUPPORTED_LANGUAGES) {
  if (locale.code === "en") {
    continue;
  }

  for (const key of englishKeys) {
    if (!(key in TRANSLATIONS[locale.code])) {
      TRANSLATIONS[locale.code][key] = TRANSLATIONS.en[key];
    }
  }
}
