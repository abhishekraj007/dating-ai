import { View, StyleSheet } from "react-native";
import { useState } from "react";
import { Text } from "@/components/ui/text";
import { Button } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useOnboardingStore, GENDER_OPTIONS } from "@/stores/onboarding-store";
import { useTranslation } from "@/hooks/use-translation";
import { useChatLanguage } from "@/hooks/use-chat-language";
import { LanguageSheet } from "@/components/language/language-sheet";
import { OnboardingLanguageRow } from "@/components/onboarding/onboarding-language-row";
import { GenderOptionCard } from "@/components/onboarding/gender-option-card";
import { useOnboardingCharacters } from "@/hooks/use-onboarding-characters";

export default function GenderScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { chatLanguage } = useChatLanguage();
  const { genderPreference, setGenderPreference, setAppLanguage, setChatLanguage } =
    useOnboardingStore();
  const [isAppLanguageOpen, setIsAppLanguageOpen] = useState(false);
  const [isChatLanguageOpen, setIsChatLanguageOpen] = useState(false);
  useOnboardingCharacters(genderPreference);

  const handleContinue = () => {
    if (!genderPreference) return;
    setAppLanguage(language);
    setChatLanguage(chatLanguage);
    router.push("/(root)/(onboarding)/pick-character");
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View className="flex-1 px-6 pt-6">
          <OnboardingLanguageRow
            onPressApp={() => setIsAppLanguageOpen(true)}
            onPressChat={() => setIsChatLanguageOpen(true)}
          />

          <Text size="3xl" weight="extrabold" style={styles.title}>
            {t("onboarding.gender.title")}
          </Text>
          <Text size="sm" variant="muted" style={styles.subtitle}>
            {t("onboarding.gender.subtitle")}
          </Text>

          <View style={styles.list}>
            {GENDER_OPTIONS.map((option) => (
              <GenderOptionCard
                key={option.value}
                option={option}
                selected={genderPreference === option.value}
                label={t(`onboarding.gender.${option.value}`)}
                onPress={setGenderPreference}
              />
            ))}
          </View>
        </View>

        <View className="px-6 pb-4">
          <Button
            size="lg"
            onPress={handleContinue}
            isDisabled={!genderPreference}
            className="w-full"
          >
            <Button.Label>{t("onboarding.continue")}</Button.Label>
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
  title: {
    textAlign: "center",
    marginTop: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  list: {
    gap: 12,
  },
});
