import { View, ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { Button, Chip, ScrollShadow } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { useSavePreferences } from "@/hooks/dating";
import {
  useOnboardingStore,
  INTEREST_OPTIONS,
} from "@/stores/onboarding-store";

export default function InterestsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const { genderPreference, interests, toggleInterest, reset } =
    useOnboardingStore();
  const { savePreferences } = useSavePreferences();
  const markOnboardingComplete = useMutation(api.user.markOnboardingComplete);

  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    // If user is not logged in, redirect to auth
    if (!isAuthenticated) {
      // Keep preferences in store, redirect to login
      router.replace("/(root)/(auth)");
      return;
    }

    // User is logged in, save preferences and complete onboarding
    setIsSaving(true);
    try {
      // Save preferences to backend
      await savePreferences({
        genderPreference: genderPreference || "female",
        ageMin: 18,
        ageMax: 35,
        zodiacPreferences: [],
        interestPreferences: interests,
      });

      // Mark onboarding as complete
      await markOnboardingComplete();

      // Reset store after successful save
      reset();

      // Navigate to main app
      router.replace("/(root)/(main)");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View className="flex-1 px-6 pt-12">
          {/* Title */}
          <Text size="2xl" className="text-center my-8">
            What are your interests?
          </Text>

          {/* Interests Grid */}
          <ScrollShadow
            LinearGradientComponent={LinearGradient}
            size={40}
            className="flex-1"
          >
            <ScrollView
              contentContainerStyle={{
                paddingBottom: 16,
              }}
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-row flex-wrap gap-2 items-center justify-center">
                {INTEREST_OPTIONS.map((interest) => (
                  <Chip
                    key={interest.value}
                    size="md"
                    variant={
                      interests.includes(interest.value)
                        ? "primary"
                        : "secondary"
                    }
                    color={
                      interests.includes(interest.value) ? "accent" : "default"
                    }
                    onPress={() => toggleInterest(interest.value)}
                  >
                    <Chip.Label>
                      {interest.emoji} {interest.label}
                    </Chip.Label>
                  </Chip>
                ))}
              </View>
            </ScrollView>
          </ScrollShadow>
        </View>

        {/* Bottom Button */}
        <View className="px-6 pb-4">
          {interests.length > 0 && (
            <Text className="text-center text-muted text-sm mb-3">
              {interests.length} selected
            </Text>
          )}
          <Button
            size="lg"
            onPress={handleComplete}
            isDisabled={isSaving}
            className="w-full"
          >
            <Button.Label>
              {isSaving
                ? "Setting up..."
                : interests.length > 0
                  ? "Continue"
                  : "Skip"}
            </Button.Label>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
