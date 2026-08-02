import { useRef } from "react";
import type { View } from "react-native";
import type { LegendListRef } from "@legendapp/list/react-native";
import {
  useKeyboardChatComposerInset,
  useKeyboardScrollToEnd,
} from "@legendapp/list/keyboard";

const ESTIMATED_COMPOSER_HEIGHT = 112;

export function useChatKeyboardList() {
  const listRef = useRef<LegendListRef | null>(null);
  const composerRef = useRef<View>(null);
  const { contentInsetEndAdjustment, onComposerLayout } =
    useKeyboardChatComposerInset(
      listRef,
      composerRef,
      ESTIMATED_COMPOSER_HEIGHT,
    );
  const { scrollMessageToEnd } = useKeyboardScrollToEnd({
    listRef,
  });

  return {
    listRef,
    composerRef,
    contentInsetEndAdjustment,
    scrollMessageToEnd,
    onComposerLayout,
  };
}
