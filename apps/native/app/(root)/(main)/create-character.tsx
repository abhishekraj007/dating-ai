import { View, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button, TextField, Chip } from "heroui-native";
import {
  X,
  Camera,
  ChevronRight,
  ChevronDown,
  Plus,
} from "lucide-react-native";
import { useState } from "react";
import { useCreateAIProfile } from "@/hooks/dating";
import { PhotoUploadSlot } from "@/components/dating";
import { useThemeColor } from "heroui-native";
import { Text } from "@/components";

const AGES = Array.from({ length: 43 }, (_, i) => i + 18); // 18-60
const GENDERS = ["female", "male"] as const;
const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export default function CreateCharacterScreen() {
  const router = useRouter();
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const { createProfile } = useCreateAIProfile();

  const [name, setName] = useState("");
  const [age, setAge] = useState<number | undefined>();
  const [gender, setGender] = useState<"female" | "male" | undefined>();
  const [zodiacSign, setZodiacSign] = useState<string | undefined>();
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<Array<string>>([]);
  const [newInterest, setNewInterest] = useState("");
  const [avatarImageKey, setAvatarImageKey] = useState<string | undefined>();
  const [profileImageKeys, setProfileImageKeys] = useState<Array<string>>([]);

  const [showAgePicker, setShowAgePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showZodiacPicker, setShowZodiacPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name for your character");
      return;
    }
    if (!gender) {
      Alert.alert("Error", "Please select a gender");
      return;
    }
    if (!avatarImageKey) {
      Alert.alert("Error", "Please upload a main photo");
      return;
    }

    setIsSaving(true);

    const profileId = await createProfile({
      name: name.trim(),
      gender,
      avatarImageKey,
      age,
      zodiacSign,
      occupation: occupation.trim() || undefined,
      bio: bio.trim() || undefined,
      interests: interests.length > 0 ? interests : undefined,
      profileImageKeys:
        profileImageKeys.length > 0 ? profileImageKeys : undefined,
    });

    setIsSaving(false);

    if (profileId) {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView
        style={{
          flex: 1,
        }}
        edges={["top"]}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-2 border-b border-border">
          <Button
            variant="tertiary"
            size="sm"
            isIconOnly
            onPress={() => router.back()}
          >
            <X size={24} color={foregroundColor} />
          </Button>
          <Text className="text-foreground text-lg font-semibold">
            Create New AI Character
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Main photo upload */}
          <View className="items-center mb-6">
            <Pressable
              className="w-full aspect-[4/3] bg-surface rounded-xl items-center justify-center border border-dashed border-border"
              onPress={() => {
                // TODO: Implement image picker
                Alert.alert(
                  "Coming Soon",
                  "Image upload will be implemented with R2 integration"
                );
              }}
            >
              <Camera size={48} color={mutedColor} />
              <Text className="text-foreground font-medium mt-2">
                Upload a photo
              </Text>
              <Text className="text-muted-foreground text-xs text-center mt-1 px-8">
                This will be the main photo of your AI character. Give your best
                photo!
              </Text>
              <Text className="text-muted-foreground text-xs mt-1">
                (Supported format: jpg, png, & gif)
              </Text>
            </Pressable>
          </View>

          {/* Form fields */}
          <View className="gap-4">
            <TextField>
              <TextField.Label>Name</TextField.Label>
              <TextField.Input
                placeholder="Enter Name"
                value={name}
                onChangeText={setName}
              />
            </TextField>

            {/* Age Picker */}
            <View>
              <Text className="text-foreground font-medium mb-2">Age</Text>
              <Pressable
                className="flex-row items-center justify-between bg-surface rounded-lg px-4 py-3 border border-border"
                onPress={() => setShowAgePicker(!showAgePicker)}
              >
                <Text
                  className={age ? "text-foreground" : "text-muted-foreground"}
                >
                  {age ? `${age} years old` : "Select Age"}
                </Text>
                <ChevronDown size={20} color={mutedColor} />
              </Pressable>
              {showAgePicker && (
                <ScrollView
                  className="max-h-40 bg-surface rounded-lg mt-1 border border-border"
                  showsVerticalScrollIndicator
                >
                  {AGES.map((a) => (
                    <Pressable
                      key={a}
                      className={`px-4 py-2 ${age === a ? "bg-pink-500/20" : ""}`}
                      onPress={() => {
                        setAge(a);
                        setShowAgePicker(false);
                      }}
                    >
                      <Text className="text-foreground">{a}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Gender Picker */}
            <View>
              <Text className="text-foreground font-medium mb-2">Gender</Text>
              <Pressable
                className="flex-row items-center justify-between bg-surface rounded-lg px-4 py-3 border border-border"
                onPress={() => setShowGenderPicker(!showGenderPicker)}
              >
                <Text
                  className={
                    gender
                      ? "text-foreground capitalize"
                      : "text-muted-foreground"
                  }
                >
                  {gender ? gender : "Select Gender"}
                </Text>
                <ChevronDown size={20} color={mutedColor} />
              </Pressable>
              {showGenderPicker && (
                <View className="bg-surface rounded-lg mt-1 border border-border">
                  {GENDERS.map((g) => (
                    <Pressable
                      key={g}
                      className={`px-4 py-3 ${gender === g ? "bg-pink-500/20" : ""}`}
                      onPress={() => {
                        setGender(g);
                        setShowGenderPicker(false);
                      }}
                    >
                      <Text className="text-foreground capitalize">{g}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Zodiac Picker */}
            <View>
              <Text className="text-foreground font-medium mb-2">Zodiac</Text>
              <Pressable
                className="flex-row items-center justify-between bg-surface rounded-lg px-4 py-3 border border-border"
                onPress={() => setShowZodiacPicker(!showZodiacPicker)}
              >
                <Text
                  className={
                    zodiacSign ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {zodiacSign || "Select Zodiac"}
                </Text>
                <ChevronDown size={20} color={mutedColor} />
              </Pressable>
              {showZodiacPicker && (
                <ScrollView
                  className="max-h-40 bg-surface rounded-lg mt-1 border border-border"
                  showsVerticalScrollIndicator
                >
                  {ZODIAC_SIGNS.map((z) => (
                    <Pressable
                      key={z}
                      className={`px-4 py-2 ${zodiacSign === z ? "bg-pink-500/20" : ""}`}
                      onPress={() => {
                        setZodiacSign(z);
                        setShowZodiacPicker(false);
                      }}
                    >
                      <Text className="text-foreground">{z}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            <TextField>
              <TextField.Label>Occupation</TextField.Label>
              <TextField.Input
                placeholder="e.g. Designer, Model, Traveler, etc."
                value={occupation}
                onChangeText={setOccupation}
              />
            </TextField>

            <TextField>
              <TextField.Label>About me</TextField.Label>
              <TextField.Input
                placeholder="Add important information about your AI character, such as introduction, background, interests, lifestyle, etc."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: "top" }}
              />
            </TextField>

            {/* Interests */}
            <View>
              <Text className="text-foreground font-medium mb-2">
                Interests
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-2">
                {interests.map((interest) => (
                  <Chip key={interest} variant="secondary" size="sm">
                    <Chip.Label>{interest}</Chip.Label>
                  </Chip>
                ))}
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <TextField>
                    <TextField.Input
                      placeholder="Add interest"
                      value={newInterest}
                      onChangeText={setNewInterest}
                      onSubmitEditing={handleAddInterest}
                    />
                  </TextField>
                </View>
                <Button
                  variant="secondary"
                  size="md"
                  isIconOnly
                  onPress={handleAddInterest}
                >
                  <Plus size={20} color={foregroundColor} />
                </Button>
              </View>
            </View>

            {/* Additional Photos */}
            <View>
              <Text className="text-foreground font-medium mb-2">Photos</Text>
              <View className="flex-row flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} className="w-[48%]">
                    <PhotoUploadSlot
                      imageUrl={profileImageKeys[i]}
                      onPress={() => {
                        Alert.alert(
                          "Coming Soon",
                          "Image upload will be implemented"
                        );
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Language and Voice */}
            <Pressable className="flex-row items-center justify-between py-3 border-b border-border">
              <Text className="text-foreground font-medium">Language</Text>
              <View className="flex-row items-center">
                <Text className="text-muted-foreground mr-2">English</Text>
                <ChevronRight size={20} color={mutedColor} />
              </View>
            </Pressable>

            <Pressable className="flex-row items-center justify-between py-3 border-b border-border">
              <Text className="text-foreground font-medium">Voice</Text>
              <View className="flex-row items-center">
                <Text className="text-muted-foreground mr-2">Default</Text>
                <ChevronRight size={20} color={mutedColor} />
              </View>
            </Pressable>
          </View>

          <View className="h-32" />
        </ScrollView>

        {/* Footer buttons */}
        <View className="flex-row px-4 py-4 gap-3 border-t border-border">
          <Button
            variant="secondary"
            className="flex-1"
            onPress={() => router.back()}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
          <Button
            className="flex-1"
            onPress={handleSave}
            isDisabled={isSaving || !name.trim() || !gender}
          >
            <Button.Label>{isSaving ? "Saving..." : "Save"}</Button.Label>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
