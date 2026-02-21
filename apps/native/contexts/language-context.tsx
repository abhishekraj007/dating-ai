import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, useConvexAuth, useMutation, useQuery } from "@dating-ai/backend";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from "@/lib/i18n/types";
import { TRANSLATIONS } from "@/lib/i18n/translations";

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

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isAuthenticated } = useConvexAuth();
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);
  const hasSyncedSessionRef = useRef(false);
  const remoteLanguage = useQuery(
    (api as any).features.preferences.queries.getUserAppLanguage,
    isAuthenticated ? {} : "skip",
  ) as AppLanguage | null | undefined;
  const setRemoteLanguage = useMutation(
    (api as any).features.preferences.queries.setUserAppLanguage,
  );

  const isSupportedLanguage = (
    candidate: string | null,
  ): candidate is AppLanguage =>
    !!candidate && SUPPORTED_LANGUAGES.some((item) => item.code === candidate);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (isSupportedLanguage(savedLanguage)) {
          setLanguageState(savedLanguage);
          return;
        }

        // Locale fallback for first run (before any manual selection)
        const detected = Intl.DateTimeFormat()
          .resolvedOptions()
          .locale.split("-")[0]
          .toLowerCase();
        const localeLanguage = isSupportedLanguage(detected)
          ? detected
          : DEFAULT_LANGUAGE;

        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, localeLanguage);
        setLanguageState(localeLanguage);
      } catch (error) {
        console.log("Error loading language preference:", error);
        setLanguageState(DEFAULT_LANGUAGE);
      } finally {
        setIsLanguageLoaded(true);
      }
    };

    void loadLanguage();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      hasSyncedSessionRef.current = false;
      return;
    }

    if (
      !isLanguageLoaded ||
      remoteLanguage === undefined ||
      hasSyncedSessionRef.current
    ) {
      return;
    }

    const syncLanguage = async () => {
      // If user has a saved language in DB, that takes priority
      if (remoteLanguage && remoteLanguage !== language) {
        setLanguageState(remoteLanguage);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, remoteLanguage);
        hasSyncedSessionRef.current = true;
        return;
      }

      // If DB does not have language yet, persist current app language
      if (!remoteLanguage) {
        await setRemoteLanguage({ appLanguage: language });
      }

      hasSyncedSessionRef.current = true;
    };

    void syncLanguage();
  }, [
    isAuthenticated,
    isLanguageLoaded,
    language,
    remoteLanguage,
    setRemoteLanguage,
  ]);

  const setLanguage = async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      if (isAuthenticated) {
        await setRemoteLanguage({ appLanguage: nextLanguage });
      }
    } catch (error) {
      console.log("Error saving language preference:", error);
    }
  };

  const value = useMemo(() => {
    const t = (key: string, values?: TranslationValues) => {
      const selectedLanguageMap = TRANSLATIONS[language] ?? {};
      const template = selectedLanguageMap[key] ?? key;
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
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
