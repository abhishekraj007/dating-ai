import { View, Pressable, StyleSheet, Dimensions } from "react-native";
import { useState } from "react";
import { Text } from "@/components/ui/text";
import { Button } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  useOnboardingStore,
  GENDER_OPTIONS,
  type GenderPreference,
} from "@/stores/onboarding-store";
import { useTranslation } from "@/hooks/use-translation";
import { useChatLanguage } from "@/hooks/use-chat-language";
import { LanguageSheet } from "@/components/language/language-sheet";
import { OnboardingLanguageRow } from "@/components/onboarding/onboarding-language-row";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = height / 6.4;

export default function GenderScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { chatLanguage } = useChatLanguage();
  const { genderPreference, setGenderPreference, setAppLanguage, setChatLanguage } =
    useOnboardingStore();
  const [isAppLanguageOpen, setIsAppLanguageOpen] = useState(false);
  const [isChatLanguageOpen, setIsChatLanguageOpen] = useState(false);

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

          <Text className="text-foreground" style={styles.title}>
            {t("onboarding.gender.title")}
          </Text>
          <Text className="text-muted" style={styles.subtitle}>
            {t("onboarding.gender.subtitle")}
          </Text>

          <View style={styles.list}>
            {GENDER_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() =>
                  setGenderPreference(option.value as GenderPreference)
                }
                style={[
                  styles.card,
                  genderPreference === option.value && styles.cardSelected,
                ]}
              >
                <Image
                  source={option.image}
                  style={styles.cardImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.72)"]}
                  style={styles.gradient}
                />
                <Text style={styles.label}>
                  {t(`onboarding.gender.${option.value}`)}
                </Text>
              </Pressable>
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
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 28,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 24,
  },
  list: {
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: "#fff",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },
  label: {
    position: "absolute",
    bottom: 16,
    left: 16,
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
});
