import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import {
  Button,
  Chip,
  Skeleton,
  ScrollShadow,
  useThemeColor,
} from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useUserPreferences,
  useSavePreferences,
  useFilterOptions,
  type GenderPreference,
} from "@/hooks/dating";

export default function FilterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accentColor = useThemeColor("accent");
  const foregroundColor = useThemeColor("foreground");
  const borderColor = useThemeColor("border");

  const { preferences, isLoading: isLoadingPreferences } = useUserPreferences();
  const { options, isLoading: isLoadingOptions } = useFilterOptions();
  const { savePreferences } = useSavePreferences();

  // Local state for filter values
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 35]);
  const [genderPreference, setGenderPreference] =
    useState<GenderPreference>("female");
  const [selectedZodiacs, setSelectedZodiacs] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences when available
  useEffect(() => {
    if (preferences) {
      setAgeRange([preferences.ageMin, preferences.ageMax]);
      setGenderPreference(preferences.genderPreference);
      setSelectedZodiacs(preferences.zodiacPreferences);
      setSelectedInterests(preferences.interestPreferences);
    }
  }, [preferences]);

  const toggleZodiac = (zodiac: string) => {
    setSelectedZodiacs((prev) =>
      prev.includes(zodiac)
        ? prev.filter((z) => z !== zodiac)
        : [...prev, zodiac],
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleReset = () => {
    setAgeRange([18, 35]);
    setGenderPreference("female");
    setSelectedZodiacs([]);
    setSelectedInterests([]);
  };

  const handleApply = async () => {
    setIsSaving(true);
    try {
      await savePreferences({
        genderPreference,
        ageMin: ageRange[0],
        ageMax: ageRange[1],
        zodiacPreferences: selectedZodiacs,
        interestPreferences: selectedInterests,
      });
      router.back();
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Button
            variant="tertiary"
            size="sm"
            isIconOnly
            onPress={() => router.back()}
            className="rounded-full"
          >
            <X size={24} color={foregroundColor} />
          </Button>
          <Text className="text-foreground text-lg font-semibold">Filter</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollShadow
          LinearGradientComponent={LinearGradient}
          size={40}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Gender Preference */}
            <View className="px-4 mb-6">
              <Text className="text-foreground font-semibold mb-2">
                Interested In
              </Text>
              <View className="flex-row gap-2 flex-wrap">
                {isLoadingOptions ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-8 w-20 rounded-full" />
                    ))}
                  </>
                ) : (
                  options.genders.map((gender) => (
                    <Chip
                      key={gender.value}
                      size="md"
                      variant={
                        genderPreference === gender.value
                          ? "primary"
                          : "secondary"
                      }
                      color={
                        genderPreference === gender.value ? "accent" : "default"
                      }
                      onPress={() =>
                        setGenderPreference(gender.value as GenderPreference)
                      }
                    >
                      <Chip.Label>{gender.label}</Chip.Label>
                    </Chip>
                  ))
                )}
              </View>
            </View>
            {/* Age Range */}
            <View className="px-4 mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-foreground font-semibold">Age</Text>
              </View>
              <View className="flex-row gap-2 flex-wrap">
                {isLoadingOptions ? (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-8 w-20 rounded-full" />
                    ))}
                  </>
                ) : (
                  options.ageRanges.map((range) => (
                    <Chip
                      key={range.value}
                      size="md"
                      variant={
                        ageRange[0] === range.min && ageRange[1] === range.max
                          ? "primary"
                          : "secondary"
                      }
                      color={
                        ageRange[0] === range.min && ageRange[1] === range.max
                          ? "accent"
                          : "default"
                      }
                      onPress={() => setAgeRange([range.min, range.max])}
                    >
                      <Chip.Label>{range.label}</Chip.Label>
                    </Chip>
                  ))
                )}
              </View>
            </View>

            {/* Zodiac Signs */}
            <View className="px-4 mb-6">
              <Text className="text-foreground font-semibold mb-3">Zodiac</Text>
              <View className="flex-row flex-wrap gap-2">
                {isLoadingOptions ? (
                  <>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-8 w-20 rounded-full" />
                    ))}
                  </>
                ) : (
                  options.zodiacSigns.map((zodiac) => (
                    <Chip
                      key={zodiac.value}
                      size="md"
                      variant={
                        selectedZodiacs.includes(zodiac.value)
                          ? "primary"
                          : "secondary"
                      }
                      color={
                        selectedZodiacs.includes(zodiac.value)
                          ? "accent"
                          : "default"
                      }
                      onPress={() => toggleZodiac(zodiac.value)}
                    >
                      <Chip.Label>{zodiac.label}</Chip.Label>
                    </Chip>
                  ))
                )}
              </View>
            </View>

            {/* Interests */}
            <View className="px-4 mb-6">
              <Text className="text-foreground font-semibold mb-3">
                Interests
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {isLoadingOptions ? (
                  <>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <Skeleton key={i} className="h-8 w-24 rounded-full" />
                    ))}
                  </>
                ) : (
                  options.interests.map((interest) => (
                    <Chip
                      key={interest.value}
                      size="md"
                      variant={
                        selectedInterests.includes(interest.value)
                          ? "primary"
                          : "secondary"
                      }
                      color={
                        selectedInterests.includes(interest.value)
                          ? "accent"
                          : "default"
                      }
                      onPress={() => toggleInterest(interest.value)}
                    >
                      <Chip.Label>
                        {interest.label} {interest.emoji}
                      </Chip.Label>
                    </Chip>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        </ScrollShadow>

        {/* Bottom Buttons */}
        <View
          className="flex-row gap-3 px-4 py-4 bg-background border-t border-border"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Button
            variant="secondary"
            style={{ flex: 1 }}
            onPress={handleReset}
            isDisabled={isSaving}
          >
            <Button.Label>Reset</Button.Label>
          </Button>
          <Button
            style={{ flex: 1 }}
            onPress={handleApply}
            isDisabled={isSaving}
          >
            <Button.Label>{isSaving ? "Saving..." : "Apply"}</Button.Label>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
