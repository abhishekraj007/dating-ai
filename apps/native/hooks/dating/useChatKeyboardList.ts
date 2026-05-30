import { useCallback, useLayoutEffect, useRef } from "react";
import type { LayoutChangeEvent, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { LegendListRef } from "@legendapp/list/react-native";

const COMPOSER_MESSAGE_GAP = 40;
const ESTIMATED_COMPOSER_HEIGHT = 112;
const INITIAL_COMPOSER_INSET = ESTIMATED_COMPOSER_HEIGHT + COMPOSER_MESSAGE_GAP;

export function useChatKeyboardList() {
  const listRef = useRef<LegendListRef | null>(null);
  const composerRef = useRef<View>(null);
  const contentInsetEndAdjustment = useSharedValue(INITIAL_COMPOSER_INSET);
  const lastComposerHeightRef = useRef<number | undefined>(undefined);

  const reportComposerHeight = useCallback(
    (height: number) => {
      if (!Number.isFinite(height) || height === lastComposerHeightRef.current) {
        return;
      }

      lastComposerHeightRef.current = height;
      const inset = height + COMPOSER_MESSAGE_GAP;
      contentInsetEndAdjustment.value = inset;
      listRef.current?.reportContentInset({ bottom: inset });
    },
    [contentInsetEndAdjustment],
  );

  useLayoutEffect(() => {
    composerRef.current?.measure((_x, _y, _width, height) => {
      reportComposerHeight(height);
    });
  }, [reportComposerHeight]);

  const onComposerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      reportComposerHeight(event.nativeEvent.layout.height);
    },
    [reportComposerHeight],
  );

  return {
    listRef,
    composerRef,
    contentInsetEndAdjustment,
    onComposerLayout,
  };
}
