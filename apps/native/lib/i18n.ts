import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  type AppLanguage,
} from "./i18n/types";

import en from "./i18n/messages/en.json";
import es from "./i18n/messages/es.json";
import fr from "./i18n/messages/fr.json";
import de from "./i18n/messages/de.json";
import pt from "./i18n/messages/pt.json";
import hi from "./i18n/messages/hi.json";
import ja from "./i18n/messages/ja.json";
import ko from "./i18n/messages/ko.json";
import zh from "./i18n/messages/zh.json";
import ar from "./i18n/messages/ar.json";

const translations = { en, es, fr, de, pt, hi, ja, ko, zh, ar };

const i18n = new I18n(translations);

const deviceLocale = Localization.getLocales()[0]?.languageCode || DEFAULT_LANGUAGE;
const supportedCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
i18n.locale = supportedCodes.includes(deviceLocale as AppLanguage)
  ? deviceLocale
  : DEFAULT_LANGUAGE;

i18n.enableFallback = true;
i18n.defaultLocale = DEFAULT_LANGUAGE;

export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, type AppLanguage };
export default i18n;
