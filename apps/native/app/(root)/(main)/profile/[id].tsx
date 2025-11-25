import { View, ScrollView, Dimensions, Pressable } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Chip, Skeleton, useThemeColor } from "heroui-native";
import { X, Share2, MoreVertical } from "lucide-react-native";
import { useAIProfile } from "@/hooks/dating";
import { useStartConversation, useConversationByProfile } from "@/hooks/dating";
import { InterestChip, CompatibilityIndicator } from "@/components/dating";
import { useState } from "react";
import { Text } from "@/components";

const { width: screenWidth } = Dimensions.get("window");
const photoWidth = (screenWidth - 48) / 2;

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const foregroundColor = useThemeColor("foreground");
  const { profile, isLoading } = useAIProfile(id);
  const { conversation } = useConversationByProfile(id);
  const { startConversation } = useStartConversation();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleChat = async () => {
    if (!id) return;

    setIsStartingChat(true);

    // If conversation exists, navigate to it
    if (conversation) {
      router.push(`/(root)/(main)/chat/${conversation._id}`);
      setIsStartingChat(false);
      return;
    }

    // Start new conversation
    const conversationId = await startConversation({
      aiProfileId: id as any,
    });

    router.push(`/(root)/(main)/chat/${conversationId}`);
    setIsStartingChat(false);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }} className="bg-background">
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View className="flex-row items-center justify-between px-4 py-2">
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              onPress={() => router.back()}
            >
              <X size={24} color={foregroundColor} />
            </Button>
            <Text className="text-foreground text-lg font-semibold">
              Profile
            </Text>
            <View style={{ width: 80 }} />
          </View>
          <View className="px-4">
            <Skeleton className="w-full aspect-[4/5] rounded-2xl mb-4" />
            <Skeleton className="h-8 w-32 rounded-lg mb-2" />
            <Skeleton className="h-4 w-full rounded-lg mb-4" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1 }} className="bg-background">
        <SafeAreaView
          style={{ flex: 1 }}
          className="items-center justify-center"
          edges={["top"]}
        >
          <Text className="text-foreground text-xl font-semibold">
            Profile not found
          </Text>
          <Button className="mt-4" onPress={() => router.back()}>
            <Button.Label>Go Back</Button.Label>
          </Button>
        </SafeAreaView>
      </View>
    );
  }

  const genderSymbol = profile.gender === "female" ? "\u2640" : "\u2642";

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <Button
            variant="tertiary"
            size="sm"
            isIconOnly
            onPress={() => router.back()}
          >
            <X size={24} color={foregroundColor} />
          </Button>
          <Text className="text-foreground text-lg font-semibold">Profile</Text>
          <View className="flex-row gap-2">
            <Button variant="tertiary" size="sm" isIconOnly>
              <Share2 size={20} color={foregroundColor} />
            </Button>
            <Button variant="tertiary" size="sm" isIconOnly>
              <MoreVertical size={20} color={foregroundColor} />
            </Button>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Main photo */}
          <View className="px-4">
            <Image
              source={
                profile.avatarUrl
                  ? { uri: profile.avatarUrl }
                  : require("@/assets/images/login-bg.jpeg")
              }
              style={{
                width: "100%",
                height: 200,
                borderRadius: 16,
              }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={300}
              placeholder={require("@/assets/images/login-bg.jpeg")}
            />
          </View>

          {/* Name and badges */}
          <View className="px-4 mt-4">
            <Text className="text-foreground text-2xl font-bold">
              {profile.name}
            </Text>

            <View className="flex-row flex-wrap gap-2 mt-3">
              {profile.age && (
                <Chip variant="secondary" size="sm">
                  <Chip.Label>
                    {genderSymbol} {profile.age}
                  </Chip.Label>
                </Chip>
              )}
              {profile.zodiacSign && (
                <Chip variant="secondary" size="sm">
                  <Chip.Label>{profile.zodiacSign}</Chip.Label>
                </Chip>
              )}
              {profile.occupation && (
                <Chip variant="secondary" size="sm">
                  <Chip.Label>{profile.occupation}</Chip.Label>
                </Chip>
              )}
            </View>
          </View>

          {/* About me */}
          {profile.bio && (
            <View className="px-4 mt-6">
              <Text className="text-foreground font-semibold mb-2">
                About me
              </Text>
              <Text variant="muted" className="leading-6">
                {profile.bio}
              </Text>
            </View>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <View className="px-4 mt-6">
              <Text className="text-foreground font-semibold mb-2">
                Interests
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <InterestChip key={index} interest={interest} />
                ))}
              </View>
            </View>
          )}

          {/* Photos grid */}
          {profile.profileImageUrls && profile.profileImageUrls.length > 0 && (
            <View className="px-4 mt-6">
              <Text className="text-foreground font-semibold mb-2">Photos</Text>
              <View className="flex-row flex-wrap gap-2">
                {profile.profileImageUrls.map((url, index) => (
                  <Pressable
                    key={index}
                    style={{ width: photoWidth, height: photoWidth }}
                  >
                    <Image
                      source={{ uri: url }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 12,
                      }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={200}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Compatibility indicator if conversation exists */}
          {conversation && (
            <View className="px-4 mt-6 items-center">
              <Text className="text-foreground font-semibold mb-2">
                Compatibility
              </Text>
              <CompatibilityIndicator
                score={conversation.compatibilityScore}
                size="lg"
              />
            </View>
          )}

          <View className="h-24" />
        </ScrollView>

        {/* Chat button */}
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-background">
          <Button onPress={handleChat} isDisabled={isStartingChat}>
            <Button.Label>
              {isStartingChat ? "Starting..." : "Chat"}
            </Button.Label>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
