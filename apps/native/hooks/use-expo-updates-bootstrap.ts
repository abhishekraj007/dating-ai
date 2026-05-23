import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Updates from "expo-updates";

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

export function useExpoUpdatesBootstrap() {
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
    if (!isUpdatePending || didReloadForPendingRef.current) {
      return;
    }

    didReloadForPendingRef.current = true;
    console.log(LOG_PREFIX, "Pending update downloaded, reloading", {
      updateId: downloadedUpdate?.updateId,
      createdAt: downloadedUpdate?.createdAt?.toISOString(),
      current: getRunningUpdateInfo(),
    });

    void Updates.reloadAsync().catch((error) => {
      didReloadForPendingRef.current = false;
      console.warn(LOG_PREFIX, "Could not reload pending update", {
        message: getErrorMessage(error),
      });
    });
  }, [
    downloadedUpdate?.createdAt,
    downloadedUpdate?.updateId,
    isUpdatePending,
  ]);

  useEffect(() => {
    const checkAndApplyUpdate = async (source: string) => {
      if (__DEV__) {
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
          console.log(LOG_PREFIX, "Reloading to apply update", { source });
          await Updates.reloadAsync();
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
