import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  type AppLanguage,
} from "@/lib/i18n/translations";

const LANGUAGE_STORAGE_KEY = "@app_language";

type TranslationValues = Record<string, string | number>;

type LanguageContextValue = {
  language: AppLanguage;
  isLanguageLoaded: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: string, values?: TranslationValues) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

const interpolate = (template: string, values?: TranslationValues) => {
  if (!values) {
    return template;
  }

  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    const value = values[key];
    return value === undefined ? "" : String(value);
  });
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        const isSupported = SUPPORTED_LANGUAGES.some(
          (item) => item.code === savedLanguage,
        );

        if (savedLanguage && isSupported) {
          setLanguageState(savedLanguage as AppLanguage);
        } else {
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
          setLanguageState(DEFAULT_LANGUAGE);
        }
      } catch (error) {
        console.log("Error loading language preference:", error);
        setLanguageState(DEFAULT_LANGUAGE);
      } finally {
        setIsLanguageLoaded(true);
      }
    };

    void loadLanguage();
  }, []);

  const setLanguage = async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch (error) {
      console.log("Error saving language preference:", error);
    }
  };

  const value = useMemo(() => {
    const t = (key: string, values?: TranslationValues) => {
      const selectedLanguageMap = TRANSLATIONS[language] ?? {};
      const englishMap = TRANSLATIONS[DEFAULT_LANGUAGE];
      const template = selectedLanguageMap[key] ?? englishMap[key] ?? key;
      return interpolate(template, values);
    };

    return {
      language,
      isLanguageLoaded,
      supportedLanguages: SUPPORTED_LANGUAGES,
      setLanguage,
      t,
    };
  }, [isLanguageLoaded, language]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
