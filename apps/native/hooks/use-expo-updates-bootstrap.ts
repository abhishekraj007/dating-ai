import { useEffect, useRef } from "react";
import { Alert, AppState, type AppStateStatus } from "react-native";
import * as Updates from "expo-updates";
import i18n from "@/lib/i18n";

interface UseExpoUpdatesBootstrapOptions {
  testMode?: boolean;
}

const RATE_LIMIT_MS = 5 * 60 * 1000;
const LOG_PREFIX = "[FeelChat][ExpoUpdates]";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function useExpoUpdatesBootstrap({
  testMode = false,
}: UseExpoUpdatesBootstrapOptions = {}) {
  const updates = Updates.useUpdates();
  const didLogLaunchRef = useRef(false);
  const isReloadingRef = useRef(false);
  const isUpdateAlertVisibleRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const isCheckingRef = useRef(false);

  const canUseExpoUpdates = !__DEV__ && Updates.isEnabled;

  const reloadUpdate = () => {
    if (testMode) {
      console.log(LOG_PREFIX, "test update reload passed");
      return;
    }

    if (isReloadingRef.current) {
      return;
    }

    isReloadingRef.current = true;
    console.log(LOG_PREFIX, "update reload started");

    void Updates.reloadAsync().catch((error: unknown) => {
      isReloadingRef.current = false;
      isUpdateAlertVisibleRef.current = false;
      console.warn(LOG_PREFIX, "update reload failed", {
        message: getErrorMessage(error),
      });
    });
  };

  const showUpdateReadyAlert = () => {
    if (isUpdateAlertVisibleRef.current) {
      return;
    }

    isUpdateAlertVisibleRef.current = true;

    if (testMode) {
      console.log(LOG_PREFIX, "test update alert shown");
    }

    Alert.alert(
      i18n.t("updates.title"),
      i18n.t("updates.description"),
      [
        {
          text: i18n.t("updates.refresh"),
          onPress: reloadUpdate,
        },
      ],
      { cancelable: false },
    );
  };

  const downloadUpdate = () => {
    if (testMode) {
      console.log(LOG_PREFIX, "test update fetch passed");
      showUpdateReadyAlert();
      return;
    }

    if (!Updates.isEnabled || updates.isDownloading) {
      return;
    }

    void Updates.fetchUpdateAsync()
      .then((result) => {
        if (result.isNew || result.isRollBackToEmbedded) {
          console.log(LOG_PREFIX, "update fetch passed");
          showUpdateReadyAlert();
          return;
        }

        console.log(LOG_PREFIX, "update fetch passed: no new update");
      })
      .catch((error: unknown) => {
        console.warn(LOG_PREFIX, "update fetch failed", {
          message: getErrorMessage(error),
        });
      });
  };

  const checkForUpdates = () => {
    if (testMode) {
      console.log(LOG_PREFIX, "test update check passed");
      showUpdateReadyAlert();
      return;
    }

    if (
      !canUseExpoUpdates ||
      isCheckingRef.current ||
      isUpdateAlertVisibleRef.current
    ) {
      if (!__DEV__ && !Updates.isEnabled) {
        console.warn(LOG_PREFIX, "update check failed: expo-updates disabled");
      }

      return;
    }

    const now = Date.now();

    if (now - lastCheckTimeRef.current < RATE_LIMIT_MS) {
      return;
    }

    lastCheckTimeRef.current = now;
    isCheckingRef.current = true;

    void Updates.checkForUpdateAsync()
      .then((result) => {
        if (result.isAvailable || result.isRollBackToEmbedded) {
          console.log(LOG_PREFIX, "update available");
          downloadUpdate();
          return;
        }

        console.log(LOG_PREFIX, "update check passed: no update available");
      })
      .catch((error: unknown) => {
        console.warn(LOG_PREFIX, "update check failed", {
          message: getErrorMessage(error),
        });
      })
      .finally(() => {
        isCheckingRef.current = false;
      });
  };

  useEffect(() => {
    if (didLogLaunchRef.current) {
      return;
    }

    didLogLaunchRef.current = true;
    console.log(LOG_PREFIX, "running update", {
      isEnabled: Updates.isEnabled,
      channel: Updates.channel,
      runtimeVersion: Updates.runtimeVersion,
      updateId: Updates.updateId,
    });
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, [testMode]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkForUpdates();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [testMode]);

  useEffect(() => {
    if (updates.checkError) {
      console.warn(LOG_PREFIX, "update check failed", {
        message: getErrorMessage(updates.checkError),
      });
    }
  }, [updates.checkError]);

  useEffect(() => {
    if (updates.downloadError) {
      console.warn(LOG_PREFIX, "update download failed", {
        message: getErrorMessage(updates.downloadError),
      });
    }
  }, [updates.downloadError]);

  useEffect(() => {
    if (updates.isUpdatePending) {
      console.log(LOG_PREFIX, "pending update ready");
      showUpdateReadyAlert();
    }
  }, [updates.isUpdatePending]);
}
