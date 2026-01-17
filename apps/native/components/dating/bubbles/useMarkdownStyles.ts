import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useThemeColor } from "heroui-native";

/**
 * Hook for consistent markdown styles across bubble components.
 */
export function useMarkdownStyles() {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");

  return useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: foreground,
          fontSize: 15,
          lineHeight: 22,
        },
        paragraph: {
          marginTop: 0,
          marginBottom: 8,
        },
        strong: {
          fontWeight: "700",
        },
        em: {
          fontStyle: "italic",
        },
        bullet_list: {
          marginVertical: 4,
        },
        ordered_list: {
          marginVertical: 4,
        },
        list_item: {
          marginVertical: 2,
        },
        code_inline: {
          backgroundColor: background,
          paddingHorizontal: 4,
          paddingVertical: 2,
          borderRadius: 4,
          fontFamily: "monospace",
        },
        fence: {
          backgroundColor: background,
          padding: 8,
          borderRadius: 8,
          marginVertical: 8,
        },
        blockquote: {
          borderLeftWidth: 3,
          borderLeftColor: "#ec4899",
          paddingLeft: 12,
          opacity: 0.8,
        },
      }),
    [foreground, background]
  );
}
