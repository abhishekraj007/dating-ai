import { useEffect, useRef } from "react";
import { Alert, AppState, type AppStateStatus } from "react-native";
import * as Updates from "expo-updates";
import i18n from "@/lib/i18n";

const LOG_PREFIX = "[ExpoUpdates]";
const UPDATE_CHECK_THROTTLE_MS = 60_000;
const UPDATE_LOG_MAX_AGE_MS = 60 * 60 * 1000;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getRunningUpdateInfo() {
  return {
    isEnabled: Updates.isEnabled,
    channel: Updates.channel,
    runtimeVersion: Updates.runtimeVersion,
    updateId: Updates.updateId,
    createdAt: Updates.createdAt?.toISOString() ?? null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    isEmergencyLaunch: Updates.isEmergencyLaunch,
    emergencyLaunchReason: Updates.emergencyLaunchReason,
    checkAutomatically: Updates.checkAutomatically,
  };
}

async function logRecentUpdateIssues() {
  try {
    const entries = await Updates.readLogEntriesAsync(UPDATE_LOG_MAX_AGE_MS);
    const issueEntries = entries.filter(
      (entry) =>
        entry.level === "warn" ||
        entry.level === "error" ||
        entry.level === "fatal",
    );

    if (issueEntries.length === 0) {
      return;
    }

    console.warn(
      LOG_PREFIX,
      "Recent expo-updates issues",
      issueEntries.slice(-10).map((entry) => ({
        code: entry.code,
        level: entry.level,
        message: entry.message,
        updateId: entry.updateId,
      })),
    );
  } catch (error) {
    console.warn(LOG_PREFIX, "Could not read expo-updates logs", {
      message: getErrorMessage(error),
    });
  }
}

const didShowAlertRef = { current: false };

function showUpdateAlert(source: string) {
  if (didShowAlertRef.current) {
    return;
  }
  didShowAlertRef.current = true;

  console.log(LOG_PREFIX, "Showing update alert", { source });

  Alert.alert(
    i18n.t("updates.title"),
    i18n.t("updates.description"),
    [
      {
        text: i18n.t("updates.dismiss"),
        style: "cancel",
        onPress: () => {
          didShowAlertRef.current = false;
        },
      },
      {
        text: i18n.t("updates.relaunch"),
        onPress: () => {
          void Updates.reloadAsync().catch((error) => {
            didShowAlertRef.current = false;
            console.warn(LOG_PREFIX, "Could not reload after alert confirm", {
              message: getErrorMessage(error),
            });
          });
        },
      },
    ],
    { cancelable: true },
  );
}

export function useExpoUpdatesBootstrap(options?: { test?: boolean }) {
  const testMode = options?.test ?? false;
  const {
    isStartupProcedureRunning,
    isUpdatePending,
    downloadedUpdate,
    checkError,
    downloadError,
  } = Updates.useUpdates();
  const didLogLaunchRef = useRef(false);
  const didStartLaunchCheckRef = useRef(false);
  const didReloadForPendingRef = useRef(false);
  const isCheckingRef = useRef(false);
  const lastCheckAtRef = useRef(0);

  useEffect(() => {
    if (didLogLaunchRef.current) {
      return;
    }

    didLogLaunchRef.current = true;
    console.log(LOG_PREFIX, "Running update", getRunningUpdateInfo());
    void logRecentUpdateIssues();
  }, []);

  useEffect(() => {
    if (!checkError) {
      return;
    }

    console.warn(LOG_PREFIX, "Update check error", {
      message: getErrorMessage(checkError),
    });
  }, [checkError]);

  useEffect(() => {
    if (!downloadError) {
      return;
    }

    console.warn(LOG_PREFIX, "Update download error", {
      message: getErrorMessage(downloadError),
    });
  }, [downloadError]);

  useEffect(() => {
    if (testMode) {
      return;
    }

    if (!isUpdatePending || didReloadForPendingRef.current) {
      return;
    }

    didReloadForPendingRef.current = true;
    console.log(LOG_PREFIX, "Pending update downloaded, showing alert", {
      updateId: downloadedUpdate?.updateId,
      createdAt: downloadedUpdate?.createdAt?.toISOString(),
      current: getRunningUpdateInfo(),
    });

    showUpdateAlert("pending");
  }, [
    downloadedUpdate?.createdAt,
    downloadedUpdate?.updateId,
    isUpdatePending,
  ]);

  useEffect(() => {
    const checkAndApplyUpdate = async (source: string) => {
      if (__DEV__ && !testMode) {
        return;
      }

      if (!Updates.isEnabled) {
        console.warn(LOG_PREFIX, "expo-updates is disabled", {
          source,
          current: getRunningUpdateInfo(),
        });
        return;
      }

      const now = Date.now();

      if (
        isCheckingRef.current ||
        now - lastCheckAtRef.current < UPDATE_CHECK_THROTTLE_MS
      ) {
        return;
      }

      isCheckingRef.current = true;
      lastCheckAtRef.current = now;

      try {
        console.log(LOG_PREFIX, "Checking for update", {
          source,
          current: getRunningUpdateInfo(),
        });

        const checkResult = await Updates.checkForUpdateAsync();

        console.log(LOG_PREFIX, "Update check result", {
          source,
          isAvailable: checkResult.isAvailable,
          isRollBackToEmbedded: checkResult.isRollBackToEmbedded,
          reason: checkResult.reason,
        });

        if (!checkResult.isAvailable && !checkResult.isRollBackToEmbedded) {
          return;
        }

        const fetchResult = await Updates.fetchUpdateAsync();

        console.log(LOG_PREFIX, "Update fetch result", {
          source,
          isNew: fetchResult.isNew,
          isRollBackToEmbedded: fetchResult.isRollBackToEmbedded,
        });

        if (fetchResult.isNew || fetchResult.isRollBackToEmbedded) {
          console.log(LOG_PREFIX, "Update ready, showing alert", { source });
          showUpdateAlert(source);
        }
      } catch (error) {
        console.warn(LOG_PREFIX, "Update check failed", {
          source,
          message: getErrorMessage(error),
        });
      } finally {
        isCheckingRef.current = false;
      }
    };

    if (testMode) {
      if (!didStartLaunchCheckRef.current) {
        didStartLaunchCheckRef.current = true;
        console.log(LOG_PREFIX, "Test mode: simulating update alert");
        showUpdateAlert("test");
      }
      return;
    }

    if (!isStartupProcedureRunning && !didStartLaunchCheckRef.current) {
      didStartLaunchCheckRef.current = true;
      void checkAndApplyUpdate("launch");
    }

    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") {
          void checkAndApplyUpdate("foreground");
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isStartupProcedureRunning]);
}
