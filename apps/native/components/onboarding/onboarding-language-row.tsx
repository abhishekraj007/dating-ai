import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useThemeColor } from "heroui-native";
import { ChevronRight, Globe, MessageCircle } from "lucide-react-native";
import { useTranslation } from "@/hooks/use-translation";
import { useChatLanguage } from "@/hooks/use-chat-language";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/i18n";

function getLanguageLabel(code: AppLanguage) {
  return SUPPORTED_LANGUAGES?.find((item) => item.code === code)?.label ?? code;
}

type OnboardingLanguageRowProps = {
  onPressApp: () => void;
  onPressChat: () => void;
};

export function OnboardingLanguageRow({
  onPressApp,
  onPressChat,
}: OnboardingLanguageRowProps) {
  const { t, language } = useTranslation();
  const { chatLanguage } = useChatLanguage();
  const muted = useThemeColor("muted");
  const foreground = useThemeColor("foreground");
  const surface = useThemeColor("surface");

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPressApp}
        style={[styles.chip, { backgroundColor: surface }]}
      >
        <Globe size={14} color={foreground} />
        <Text style={[styles.label, { color: foreground }]}>
          {t("onboarding.languages.appShort", {
            language: getLanguageLabel(language),
          })}
        </Text>
        <ChevronRight size={14} color={muted} />
      </Pressable>
      <Pressable
        onPress={onPressChat}
        style={[styles.chip, { backgroundColor: surface }]}
      >
        <MessageCircle size={14} color={foreground} />
        <Text style={[styles.label, { color: foreground }]}>
          {t("onboarding.languages.chatShort", {
            language: getLanguageLabel(chatLanguage),
          })}
        </Text>
        <ChevronRight size={14} color={muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
});
