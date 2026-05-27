"use client";

import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  api,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
} from "@dating-ai/backend";

const APP_LANGUAGE_STORAGE_KEY = "feelai.appLanguage";
const CHAT_LANGUAGE_STORAGE_KEY = "feelai.chatLanguage";

function isSupportedLanguage(value: string | null): value is AppLanguage {
  return (
    !!value && SUPPORTED_LANGUAGES.some((language) => language.code === value)
  );
}

function detectDeviceLanguage(): AppLanguage {
  if (typeof navigator === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const detected = navigator.language?.split("-")[0]?.toLowerCase() ?? "en";
  return isSupportedLanguage(detected) ? detected : DEFAULT_LANGUAGE;
}

function applyDocumentLanguage(language: AppLanguage) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
}

function getLanguageLabel(code: AppLanguage) {
  return (
    SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ??
    code
  );
}

export function useLanguagePreferences() {
  const { isAuthenticated } = useConvexAuth();
  const remoteAppLanguage = useQuery(
    api.features.preferences.queries.getUserAppLanguage,
    isAuthenticated ? {} : "skip",
  );
  const remoteChatLanguage = useQuery(
    api.features.preferences.queries.getUserChatLanguage,
    isAuthenticated ? {} : "skip",
  );
  const setUserLanguages = useMutation(
    api.features.preferences.queries.setUserLanguages,
  );

  const [appLanguage, setAppLanguageState] = useState<AppLanguage>(
    DEFAULT_LANGUAGE,
  );
  const [chatLanguage, setChatLanguageState] = useState<AppLanguage>(
    DEFAULT_LANGUAGE,
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const hasSyncedSessionRef = useRef(false);

  useEffect(() => {
    const storedApp = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    const storedChat = window.localStorage.getItem(CHAT_LANGUAGE_STORAGE_KEY);

    const nextApp = isSupportedLanguage(storedApp)
      ? storedApp
      : detectDeviceLanguage();
    const nextChat = isSupportedLanguage(storedChat)
      ? storedChat
      : nextApp;

    setAppLanguageState(nextApp);
    setChatLanguageState(nextChat);
    applyDocumentLanguage(nextApp);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      hasSyncedSessionRef.current = false;
      return;
    }

    if (
      !isLoaded ||
      remoteAppLanguage === undefined ||
      remoteChatLanguage === undefined ||
      hasSyncedSessionRef.current
    ) {
      return;
    }

    const syncLanguages = async () => {
      if (remoteAppLanguage && remoteAppLanguage !== appLanguage) {
        setAppLanguageState(remoteAppLanguage);
        window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, remoteAppLanguage);
        applyDocumentLanguage(remoteAppLanguage);
      }

      if (remoteChatLanguage && remoteChatLanguage !== chatLanguage) {
        setChatLanguageState(remoteChatLanguage);
        window.localStorage.setItem(
          CHAT_LANGUAGE_STORAGE_KEY,
          remoteChatLanguage,
        );
      }

      if (!remoteAppLanguage || !remoteChatLanguage) {
        await setUserLanguages({
          appLanguage: remoteAppLanguage ?? appLanguage,
          chatLanguage: remoteChatLanguage ?? chatLanguage,
        });
      }

      hasSyncedSessionRef.current = true;
    };

    void syncLanguages();
  }, [
    isAuthenticated,
    isLoaded,
    appLanguage,
    chatLanguage,
    remoteAppLanguage,
    remoteChatLanguage,
    setUserLanguages,
  ]);

  const setAppLanguage = async (nextLanguage: AppLanguage) => {
    setAppLanguageState(nextLanguage);
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage);
    applyDocumentLanguage(nextLanguage);

    if (isAuthenticated) {
      await setUserLanguages({ appLanguage: nextLanguage });
    }
  };

  const setChatLanguage = async (nextLanguage: AppLanguage) => {
    setChatLanguageState(nextLanguage);
    window.localStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, nextLanguage);

    if (isAuthenticated) {
      await setUserLanguages({ chatLanguage: nextLanguage });
    }
  };

  const setLanguages = async (next: {
    appLanguage: AppLanguage;
    chatLanguage: AppLanguage;
  }) => {
    setAppLanguageState(next.appLanguage);
    setChatLanguageState(next.chatLanguage);
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, next.appLanguage);
    window.localStorage.setItem(CHAT_LANGUAGE_STORAGE_KEY, next.chatLanguage);
    applyDocumentLanguage(next.appLanguage);

    if (isAuthenticated) {
      await setUserLanguages(next);
    }
  };

  return {
    appLanguage,
    chatLanguage,
    appLanguageLabel: getLanguageLabel(appLanguage),
    chatLanguageLabel: getLanguageLabel(chatLanguage),
    isLoaded,
    setAppLanguage,
    setChatLanguage,
    setLanguages,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
