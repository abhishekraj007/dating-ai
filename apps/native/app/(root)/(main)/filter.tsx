import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Button, Chip, useThemeColor } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useUserPreferences,
  useSavePreferences,
  type GenderPreference,
} from "@/hooks/dating/useForYou";

// Zodiac signs
const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpius",
  "Sagittarius",
  "Capricornus",
  "Aquarius",
  "Pisces",
];

// Interests with emojis
const INTERESTS = [
  { label: "Travel", emoji: "✈️" },
  { label: "Cooking", emoji: "🍳" },
  { label: "Hiking", emoji: "🥾" },
  { label: "Yoga", emoji: "🧘" },
  { label: "Gaming", emoji: "🎮" },
  { label: "Movies", emoji: "🎬" },
  { label: "Music", emoji: "🎵" },
  { label: "Photography", emoji: "📷" },
  { label: "Pets", emoji: "🐕" },
  { label: "Painting", emoji: "🎨" },
  { label: "Art", emoji: "🎭" },
  { label: "Fitness", emoji: "💪" },
  { label: "Reading", emoji: "📚" },
  { label: "Dancing", emoji: "💃" },
  { label: "Sports", emoji: "🏀" },
  { label: "Board Games", emoji: "🎲" },
  { label: "Technology", emoji: "📱" },
  { label: "Fashion", emoji: "👗" },
  { label: "Motorcycling", emoji: "🏍️" },
  { label: "Science", emoji: "🔬" },
  { label: "History", emoji: "📜" },
  { label: "Nature", emoji: "🌿" },
  { label: "Adventure", emoji: "🗺️" },
  { label: "Gardening", emoji: "🌱" },
  { label: "Foodie", emoji: "🍽️" },
  { label: "Writing", emoji: "✍️" },
  { label: "Poetry", emoji: "📝" },
  { label: "Astronomy", emoji: "🔭" },
  { label: "Sustainable Living", emoji: "🌱" },
  { label: "Film Production", emoji: "🎥" },
  { label: "Meditation", emoji: "🧘" },
  { label: "Comedy", emoji: "😂" },
  { label: "Volunteering", emoji: "💛" },
  { label: "DIY Projects", emoji: "🔧" },
  { label: "Art History", emoji: "🏛️" },
  { label: "Philosophy", emoji: "🤔" },
  { label: "Snowboarding", emoji: "🏂" },
  { label: "Wine Tasting", emoji: "🍷" },
  { label: "Collectibles", emoji: "🎯" },
  { label: "Sailing", emoji: "⛵" },
  { label: "Karaoke", emoji: "🎤" },
  { label: "Surfing", emoji: "🏄" },
  { label: "Scuba Diving", emoji: "🤿" },
  { label: "Skydiving", emoji: "🪂" },
  { label: "Pottery", emoji: "🏺" },
  { label: "Wildlife Conservation", emoji: "🦁" },
  { label: "Ghost Hunting", emoji: "👻" },
  { label: "Geocaching", emoji: "📍" },
  { label: "Stand-up Comedy", emoji: "🎤" },
  { label: "Motor Racing", emoji: "🏎️" },
  { label: "Paranormal Investigation", emoji: "👽" },
];

export default function FilterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accentColor = useThemeColor("accent");
  const foregroundColor = useThemeColor("foreground");
  const borderColor = useThemeColor("border");

  const { preferences, isLoading } = useUserPreferences();
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
        : [...prev, zodiac]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
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
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Button
            variant="tertiary"
            size="sm"
            isIconOnly
            onPress={() => router.back()}
          >
            <X size={24} color={foregroundColor} />
          </Button>
          <Text className="text-foreground text-lg font-semibold">Filter</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Age Range */}
          <View className="px-4 mb-6">
            <View className="flex-row justify-between mb-2">
              <Text className="text-foreground font-semibold">Age Range</Text>
              <Text className="text-foreground">
                {ageRange[0]} - {ageRange[1]}
              </Text>
            </View>
            {/* Simple age buttons for now - can be replaced with slider */}
            <View className="flex-row gap-2 flex-wrap">
              {[
                [18, 25],
                [20, 30],
                [25, 35],
                [30, 40],
                [35, 50],
              ].map(([min, max]) => (
                <Chip
                  key={`${min}-${max}`}
                  size="md"
                  variant={
                    ageRange[0] === min && ageRange[1] === max
                      ? "primary"
                      : "secondary"
                  }
                  color={
                    ageRange[0] === min && ageRange[1] === max
                      ? "accent"
                      : "default"
                  }
                  onPress={() => setAgeRange([min, max])}
                >
                  <Chip.Label>
                    {min} - {max}
                  </Chip.Label>
                </Chip>
              ))}
            </View>
          </View>

          {/* Gender Preference */}
          <View className="px-4 mb-6">
            <Text className="text-foreground font-semibold mb-2">Show me</Text>
            <View className="flex-row gap-4">
              {(["female", "male", "both"] as const).map((gender) => (
                <Pressable
                  key={gender}
                  onPress={() => setGenderPreference(gender)}
                  className="flex-row items-center gap-2"
                >
                  <View
                    className="w-5 h-5 rounded-full border-2 items-center justify-center"
                    style={{
                      borderColor:
                        genderPreference === gender ? accentColor : borderColor,
                    }}
                  >
                    {genderPreference === gender && (
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                  </View>
                  <Text className="text-foreground capitalize">{gender}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Zodiac Signs */}
          <View className="px-4 mb-6">
            <Text className="text-foreground font-semibold mb-3">Zodiac</Text>
            <View className="flex-row flex-wrap gap-2">
              {ZODIAC_SIGNS.map((zodiac) => (
                <Chip
                  key={zodiac}
                  size="md"
                  variant={
                    selectedZodiacs.includes(zodiac) ? "primary" : "secondary"
                  }
                  color={
                    selectedZodiacs.includes(zodiac) ? "accent" : "default"
                  }
                  onPress={() => toggleZodiac(zodiac)}
                >
                  <Chip.Label>{zodiac}</Chip.Label>
                </Chip>
              ))}
            </View>
          </View>

          {/* Interests */}
          <View className="px-4 mb-6">
            <Text className="text-foreground font-semibold mb-3">
              Interests
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <Chip
                  key={interest.label}
                  size="md"
                  variant={
                    selectedInterests.includes(interest.label)
                      ? "primary"
                      : "secondary"
                  }
                  color={
                    selectedInterests.includes(interest.label)
                      ? "accent"
                      : "default"
                  }
                  onPress={() => toggleInterest(interest.label)}
                >
                  <Chip.Label>
                    {interest.label} {interest.emoji}
                  </Chip.Label>
                </Chip>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View
          className="absolute bottom-0 left-0 right-0 flex-row gap-3 px-4 py-4 bg-background border-t border-border"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Button
            variant="secondary"
            className="flex-1"
            onPress={handleReset}
            isDisabled={isSaving}
          >
            <Button.Label>Reset</Button.Label>
          </Button>
          <Button
            className="flex-1"
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
