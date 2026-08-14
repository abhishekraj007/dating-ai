import { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useOnboardingCharacters } from "@/hooks/use-onboarding-characters";
import { useFinishOnboarding } from "@/hooks/use-finish-onboarding";
import { useTranslation } from "@/hooks/use-translation";
import { CharacterPickerCarousel } from "@/components/onboarding/character-picker-carousel";
import { CharacterPickerDots } from "@/components/onboarding/character-picker-dots";
import type { Id } from "@dating-ai/backend";

export default function PickCharacterScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const foreground = useThemeColor("foreground");
  const muted = useThemeColor("muted");
  const { genderPreference, setSelectedCharacterId } = useOnboardingStore();
  const { characters, isLoading } = useOnboardingCharacters(genderPreference);
  const { isFinishing, finishWithCharacter, browseWithoutChat } =
    useFinishOnboarding();
  const [activeIndex, setActiveIndex] = useState(0);

  const profiles = characters;
  const count = profiles.length;
  const safeIndex = Math.min(activeIndex, Math.max(count - 1, 0));
  const selected = profiles[safeIndex] ?? profiles[0];

  const handleIndexChange = (index: number) => {
    if (index === activeIndex) {
      return;
    }
    const next = profiles[index];
    setActiveIndex(index);
    if (next) {
      setSelectedCharacterId(next._id as Id<"aiProfiles">);
    }
  };

  const handleChat = () => {
    if (!selected || isFinishing) return;
    void finishWithCharacter(selected._id as Id<"aiProfiles">);
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View className="px-10 gap-2 py-4">
          <Text size="3xl" weight="extrabold" style={styles.title}>
            {t("onboarding.character.title")}
          </Text>
          <Text size="sm" variant="muted" style={styles.subtitle}>
            {t("onboarding.character.subtitle")}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <Spinner size="lg" />
          </View>
        ) : (
          <CharacterPickerCarousel
            profiles={profiles}
            activeIndex={safeIndex}
            screenWidth={width}
            onIndexChange={handleIndexChange}
          />
        )}

        <CharacterPickerDots
          count={count}
          activeIndex={safeIndex}
          activeColor={foreground}
          inactiveColor={muted}
        />

        <View style={styles.footer}>
          <Button
            size="lg"
            className="w-full"
            isDisabled={!selected || isFinishing}
            onPress={handleChat}
          >
            {isFinishing ? <Spinner size="sm" /> : null}
            <Button.Label>
              {isFinishing
                ? t("onboarding.settingUp")
                : t("onboarding.character.cta", {
                    name: selected?.name ?? "",
                  })}
            </Button.Label>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full"
            isDisabled={isFinishing}
            onPress={() => void browseWithoutChat()}
          >
            <Button.Label>{t("onboarding.character.browse")}</Button.Label>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    letterSpacing: -0.6,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
  },
});
