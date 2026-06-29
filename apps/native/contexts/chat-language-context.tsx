import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, useConvexAuth, useMutation, useQuery } from "@dating-ai/backend";
import {
  useCallback,
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
} from "@/lib/i18n";

const CHAT_LANGUAGE_STORAGE_KEY = "@chat_language";

type ChatLanguageContextValue = {
  chatLanguage: AppLanguage;
  isChatLanguageLoaded: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  setChatLanguage: (language: AppLanguage) => Promise<void>;
};

const ChatLanguageContext = createContext<ChatLanguageContextValue | undefined>(
  undefined,
);

export const ChatLanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isAuthenticated } = useConvexAuth();
  const [chatLanguage, setChatLanguageState] =
    useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [isChatLanguageLoaded, setIsChatLanguageLoaded] = useState(false);
  const hasSyncedSessionRef = useRef(false);
  const remoteChatLanguage = useQuery(
    api.features.preferences.queries.getUserChatLanguage,
    isAuthenticated ? {} : "skip",
  ) as AppLanguage | null | undefined;
  const setRemoteLanguages = useMutation(
    api.features.preferences.queries.setUserLanguages,
  );

  const isSupportedLanguage = (
    candidate: string | null,
  ): candidate is AppLanguage =>
    !!candidate && SUPPORTED_LANGUAGES.some((item) => item.code === candidate);

  useEffect(() => {
    const loadChatLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(
          CHAT_LANGUAGE_STORAGE_KEY,
        );
        if (isSupportedLanguage(savedLanguage)) {
          setChatLanguageState(savedLanguage);
          return;
        }

        const detected = Intl.DateTimeFormat()
          .resolvedOptions()
          .locale.split("-")[0]
          .toLowerCase();
        const localeLanguage = isSupportedLanguage(detected)
          ? detected
          : DEFAULT_LANGUAGE;

        await AsyncStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, localeLanguage);
        setChatLanguageState(localeLanguage);
      } catch (error) {
        console.log("Error loading chat language preference:", error);
        setChatLanguageState(DEFAULT_LANGUAGE);
      } finally {
        setIsChatLanguageLoaded(true);
      }
    };

    void loadChatLanguage();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      hasSyncedSessionRef.current = false;
      return;
    }

    if (
      !isChatLanguageLoaded ||
      remoteChatLanguage === undefined ||
      hasSyncedSessionRef.current
    ) {
      return;
    }

    const syncChatLanguage = async () => {
      if (remoteChatLanguage && remoteChatLanguage !== chatLanguage) {
        setChatLanguageState(remoteChatLanguage);
        await AsyncStorage.setItem(
          CHAT_LANGUAGE_STORAGE_KEY,
          remoteChatLanguage,
        );
        hasSyncedSessionRef.current = true;
        return;
      }

      if (!remoteChatLanguage) {
        await setRemoteLanguages({ chatLanguage });
      }

      hasSyncedSessionRef.current = true;
    };

    void syncChatLanguage();
  }, [
    isAuthenticated,
    isChatLanguageLoaded,
    chatLanguage,
    remoteChatLanguage,
    setRemoteLanguages,
  ]);

  const setChatLanguage = useCallback(
    async (nextLanguage: AppLanguage) => {
      setChatLanguageState(nextLanguage);
      try {
        await AsyncStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, nextLanguage);
        if (isAuthenticated) {
          await setRemoteLanguages({ chatLanguage: nextLanguage });
        }
      } catch (error) {
        console.log("Error saving chat language preference:", error);
      }
    },
    [isAuthenticated, setRemoteLanguages],
  );

  const value = useMemo(
    () => ({
      chatLanguage,
      isChatLanguageLoaded,
      supportedLanguages: SUPPORTED_LANGUAGES,
      setChatLanguage,
    }),
    [chatLanguage, isChatLanguageLoaded, setChatLanguage],
  );

  return (
    <ChatLanguageContext.Provider value={value}>
      {children}
    </ChatLanguageContext.Provider>
  );
};

export const useChatLanguage = () => {
  const context = useContext(ChatLanguageContext);
  if (!context) {
    throw new Error("useChatLanguage must be used within ChatLanguageProvider");
  }
  return context;
};
