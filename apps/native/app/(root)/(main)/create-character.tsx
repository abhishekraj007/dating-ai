import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@dating-ai/backend";
import { Button, TextField, Card, Chip } from "heroui-native";
import { ArrowLeft, Plus, X } from "lucide-react-native";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SUGGESTED_INTERESTS = [
  "Travel", "Photography", "Music", "Fitness", "Reading", "Coffee",
  "Art", "Coding", "Films", "Fashion", "Gaming", "Technology",
  "Cooking", "Dancing", "Yoga", "Hiking"
];

const PERSONALITY_TRAITS = [
  "Adventurous", "Caring", "Creative", "Funny", "Intelligent",
  "Ambitious", "Romantic", "Mysterious", "Confident", "Kind",
  "Playful", "Thoughtful", "Spontaneous", "Loyal"
];

const LANGUAGES = ["English", "Spanish", "French", "German", "Italian", "Japanese", "Korean", "Chinese"];

export default function CreateCharacterPage() {
  const router = useRouter();
  const createProfile = useMutation(api.features.ai.profiles.createAIProfile);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [zodiacSign, setZodiacSign] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [language, setLanguage] = useState("English");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < 8) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      if (selectedInterests.length < 8) {
        setSelectedInterests([...selectedInterests, customInterest.trim()]);
        setCustomInterest("");
      }
    }
  };

  const toggleTrait = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter(t => t !== trait));
    } else if (selectedTraits.length < 6) {
      setSelectedTraits([...selectedTraits, trait]);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      alert("Please enter a name");
      return;
    }
    if (!age || parseInt(age) < 18 || parseInt(age) > 99) {
      alert("Please enter a valid age (18-99)");
      return;
    }
    if (!bio.trim() || bio.trim().length < 50) {
      alert("Please write a bio (at least 50 characters)");
      return;
    }
    if (selectedInterests.length < 3) {
      alert("Please select at least 3 interests");
      return;
    }
    if (selectedTraits.length < 3) {
      alert("Please select at least 3 personality traits");
      return;
    }

    setIsSubmitting(true);
    try {
      // For now, create without images (user will need to implement image generation)
      const profileId = await createProfile({
        name: name.trim(),
        age: parseInt(age),
        gender,
        zodiacSign: zodiacSign || undefined,
        occupation: occupation.trim() || undefined,
        bio: bio.trim(),
        interests: selectedInterests,
        personalityTraits: selectedTraits,
        profileImageKeys: [], // TODO: Implement image generation
        language,
      });

      router.replace(`/(root)/(main)/profile/${profileId}`);
    } catch (error: any) {
      alert(error.message || "Failed to create character");
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} className="border-b border-border">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Button
            onPress={() => router.back()}
            variant="ghost"
            isIconOnly
          >
            <Button.Label>
              <ArrowLeft size={24} color="#666666" />
            </Button.Label>
          </Button>
          <Text className="text-lg font-semibold text-foreground">Create Character</Text>
          <View className="w-10" />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          <View className="p-4 gap-4">
            {/* Name */}
            <Card className="p-4">
              <Text className="text-sm font-medium text-foreground mb-2">Name *</Text>
              <TextField
                value={name}
                onChangeText={setName}
                placeholder="Enter character name"
                maxLength={30}
              />
            </Card>

            {/* Age */}
            <Card className="p-4">
              <Text className="text-sm font-medium text-foreground mb-2">Age *</Text>
              <TextField
                value={age}
                onChangeText={setAge}
                placeholder="Enter age (18-99)"
                keyboardType="number-pad"
                maxLength={2}
              />
            </Card>

            {/* Gender */}
            <Card className="p-4">
              <Text className="text-sm font-medium text-foreground mb-2">Gender *</Text>
              <View className="flex-row gap-2">
                <Button
                  onPress={() => setGender("female")}
                  variant={gender === "female" ? "primary" : "secondary"}
                  className="flex-1"
                >
                  <Button.Label>Female</Button.Label>
                </Button>
                <Button
                  onPress={() => setGender("male")}
                  variant={gender === "male" ? "primary" : "secondary"}
                  className="flex-1"
                >
                  <Button.Label>Male</Button.Label>
                </Button>
              </View>
            </Card>

            {/* Zodiac Sign */}
            <Card className="p-4">
              <Text className="text-sm font-medium text-foreground mb-2">Zodiac Sign</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {ZODIAC_SIGNS.map((sign) => (
                    <Button
                      key={sign}
                      onPress={() => setZodiacSign(sign)}
                      variant={zodiacSign === sign ? "primary" : "secondary"}
                      size="sm"
                    >
                      <Button.Label>{sign}</Button.Label>
                    </Button>
                  ))}
                </View>
              </ScrollView>
            </Card>

            {/* Occupation */}
            <Card className="p-4">
              <Text className="text-sm font-medium text-foreground mb-2">Occupation</Text>
              <TextField
                value={occupation}
                onChangeText={setOccupation}
                placeholder="e.g. Software Engineer"
                maxLength={50}
              />
            </Card>

            {/* Bio */}
            <Card className="p-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                About me * (min 50 characters)
              </Text>
              <TextField
                value={bio}
                onChangeText={setBio}
                placeholder="Write a compelling bio..."
                multiline
                numberOfLines={6}
                maxLength={500}
              />
              <Text className="text-xs text-muted-foreground mt-2">
                {bio.length}/500
              </Text>
            </Card>

            {/* Interests */}
            <Card className="p-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Interests * (select 3-8)
              </Text>
              
              {/* Selected interests */}
              {selectedInterests.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {selectedInterests.map((interest) => (
                    <Chip
                      key={interest}
                      variant="primary"
                      onPress={() => toggleInterest(interest)}
                    >
                      <Chip.Label>{interest}</Chip.Label>
                      <X size={14} color="#FFFFFF" />
                    </Chip>
                  ))}
                </View>
              )}

              {/* Suggested interests */}
              <View className="flex-row flex-wrap gap-2 mb-3">
                {SUGGESTED_INTERESTS.filter(i => !selectedInterests.includes(i)).map((interest) => (
                  <Chip
                    key={interest}
                    variant="secondary"
                    onPress={() => toggleInterest(interest)}
                  >
                    <Chip.Label>{interest}</Chip.Label>
                  </Chip>
                ))}
              </View>

              {/* Custom interest input */}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <TextField
                    value={customInterest}
                    onChangeText={setCustomInterest}
                    placeholder="Add custom interest"
                    maxLength={20}
                  />
                </View>
                <Button
                  onPress={addCustomInterest}
                  variant="secondary"
                  isIconOnly
                  isDisabled={!customInterest.trim()}
                >
                  <Button.Label>
                    <Plus size={20} color="#666666" />
                  </Button.Label>
                </Button>
              </View>
            </Card>

            {/* Personality Traits */}
            <Card className="p-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Personality * (select 3-6)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {PERSONALITY_TRAITS.map((trait) => (
                  <Chip
                    key={trait}
                    variant={selectedTraits.includes(trait) ? "primary" : "secondary"}
                    onPress={() => toggleTrait(trait)}
                  >
                    <Chip.Label>{trait}</Chip.Label>
                  </Chip>
                ))}
              </View>
            </Card>

            {/* Language */}
            <Card className="p-4">
              <Text className="text-sm font-medium text-foreground mb-2">Language</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {LANGUAGES.map((lang) => (
                    <Button
                      key={lang}
                      onPress={() => setLanguage(lang)}
                      variant={language === lang ? "primary" : "secondary"}
                      size="sm"
                    >
                      <Button.Label>{lang}</Button.Label>
                    </Button>
                  ))}
                </View>
              </ScrollView>
            </Card>

            {/* Note about credits */}
            <Card className="p-4 bg-pink-50 dark:bg-pink-950">
              <Text className="text-sm text-pink-800 dark:text-pink-200">
                💡 Creating an AI character costs 10 credits for profile image generation.
              </Text>
            </Card>

            {/* Submit Button */}
            <Button
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              isDisabled={isSubmitting}
            >
              <Button.Label>
                {isSubmitting ? "Creating..." : "Create Character (10 credits)"}
              </Button.Label>
            </Button>

            {/* Bottom spacing */}
            <View className="h-8" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

