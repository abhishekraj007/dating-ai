import { View, Pressable, StyleSheet, Dimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { useSavePreferences } from "@/hooks/dating";
import {
  useOnboardingStore,
  GENDER_OPTIONS,
  type GenderPreference,
} from "@/stores/onboarding-store";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = height / 6;

export default function GenderScreen() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const { genderPreference, setGenderPreference, reset } = useOnboardingStore();
  const { savePreferences } = useSavePreferences();
  const markOnboardingComplete = useMutation(api.user.markOnboardingComplete);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (!genderPreference) return;

    // If user is not logged in, redirect to auth
    if (!isAuthenticated) {
      router.replace("/(root)/(auth)");
      return;
    }

    // User is logged in, save preferences and complete onboarding
    setIsSaving(true);
    try {
      await savePreferences({
        genderPreference,
        ageMin: 18,
        ageMax: 60,
        zodiacPreferences: [],
        interestPreferences: [],
      });

      await markOnboardingComplete();
      reset();

      // Navigate to main app - root layout will handle routing
      router.replace("/(root)/(main)");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      router.replace("/(root)/(main)");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View className="flex-1 px-6 pt-8">
          {/* Title */}
          <Text size="2xl" className="text-center my-8">
            Who are you interested in?
          </Text>

          {/* Vertical list of cards */}
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
                {/* Gradient overlay for text readability */}
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.gradient}
                />
                {/* Label */}
                <Text style={styles.label}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bottom Button */}
        <View className="px-6 pb-4">
          <Button
            size="lg"
            onPress={handleContinue}
            isDisabled={!genderPreference || isSaving}
            className="w-full"
          >
            <Button.Label>
              {isSaving ? "Setting up..." : "Continue"}
            </Button.Label>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: "#9ACD32", // accent color
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
    fontSize: 20,
    fontWeight: "600",
  },
});
