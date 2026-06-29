import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, useThemeColor } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ChevronRight, Globe, MessageCircle } from "lucide-react-native";
import { useTranslation } from "@/hooks/use-translation";
import { useChatLanguage } from "@/hooks/use-chat-language";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { LanguageSheet } from "@/components/language/language-sheet";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/i18n";

function getLanguageLabel(code: AppLanguage) {
  return SUPPORTED_LANGUAGES?.find((l) => l.code === code)?.label ?? code;
}

type SelectorRowProps = {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description: string;
  value: string;
  onPress: () => void;
};

function SelectorRow({
  icon: Icon,
  title,
  description,
  value,
  onPress,
}: SelectorRowProps) {
  const foreground = useThemeColor("foreground");
  const muted = useThemeColor("muted");
  const accent = useThemeColor("accent");
  const surface = useThemeColor("surface");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: surface, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent + "22" }]}>
        <Icon size={20} color={accent} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: foreground }]}>{title}</Text>
        <Text style={[styles.rowDesc, { color: muted }]}>{description}</Text>
      </View>
      <View style={styles.rowValue}>
        <Text style={[styles.rowValueText, { color: accent }]}>{value}</Text>
        <ChevronRight size={16} color={muted} />
      </View>
    </Pressable>
  );
}

export default function LanguagesScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { chatLanguage } = useChatLanguage();
  const { setAppLanguage, setChatLanguage: setStoreChatLanguage } =
    useOnboardingStore();
  const [isAppLanguageOpen, setIsAppLanguageOpen] = useState(false);
  const [isChatLanguageOpen, setIsChatLanguageOpen] = useState(false);

  const foreground = useThemeColor("foreground");
  const muted = useThemeColor("muted");

  const handleContinue = () => {
    setAppLanguage(language);
    setStoreChatLanguage(chatLanguage);
    router.push("/(root)/(onboarding)/gender");
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: foreground }]}>
              {t("onboarding.languages.title")}
            </Text>
            <Text style={[styles.subtitle, { color: muted }]}>
              {t("onboarding.languages.subtitle")}
            </Text>
          </View>

          <View style={styles.rows}>
            <SelectorRow
              icon={Globe}
              title={t("onboarding.languages.appTitle")}
              description={t("onboarding.languages.appDescription")}
              value={getLanguageLabel(language)}
              onPress={() => setIsAppLanguageOpen(true)}
            />
            <SelectorRow
              icon={MessageCircle}
              title={t("onboarding.languages.chatTitle")}
              description={t("onboarding.languages.chatDescription")}
              value={getLanguageLabel(chatLanguage)}
              onPress={() => setIsChatLanguageOpen(true)}
            />
          </View>

          <View style={styles.spacer} />

          <Button size="lg" onPress={handleContinue} className="w-full">
            <Button.Label className="font-semibold">
              {t("onboarding.continue")}
            </Button.Label>
          </Button>
        </View>
      </SafeAreaView>

      <LanguageSheet
        variant="app"
        isOpen={isAppLanguageOpen}
        onOpenChange={setIsAppLanguageOpen}
      />
      <LanguageSheet
        variant="chat"
        isOpen={isChatLanguageOpen}
        onOpenChange={setIsChatLanguageOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 32,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  rows: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: 13,
  },
  rowValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowValueText: {
    fontSize: 14,
    fontWeight: "500",
  },
  spacer: {
    flex: 1,
  },
});
