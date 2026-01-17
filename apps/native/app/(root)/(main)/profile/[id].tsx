import {
  View,
  ScrollView,
  Dimensions,
  Pressable,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Chip, Skeleton, useThemeColor } from "heroui-native";
import { X, Share2, MoreVertical } from "lucide-react-native";
import { useAIProfile } from "@/hooks/dating";
import { useStartConversation, useConversationByProfile } from "@/hooks/dating";
import { InterestChip, CompatibilityIndicator } from "@/components/dating";
import { useState, useCallback } from "react";
import { Text } from "@/components";
import { LinearGradient } from "expo-linear-gradient";
import { useConvexAuth } from "convex/react";
import { isAndroid } from "@/utils";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const photoWidth = (screenWidth - 48) / 2;
const heroImageHeight = screenHeight * 0.45;

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const foregroundColor = useThemeColor("foreground");
  const surfaceColor = useThemeColor("surface");
  const backgroundColor = useThemeColor("background");
  const { profile, isLoading } = useAIProfile(id);
  const { conversation } = useConversationByProfile(id);
  const { startConversation } = useStartConversation();
  const { isAuthenticated } = useConvexAuth();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  const handleChat = async () => {
    if (!id) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push("/(root)/(auth)");
      return;
    }

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
        <StatusBar barStyle="light-content" />
        {/* Header buttons - absolute positioned */}
        <View
          style={{
            position: "absolute",
            top: 16,
            left: 0,
            right: 0,
            zIndex: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 16,
          }}
        >
          <Button
            variant="tertiary"
            size="sm"
            isIconOnly
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            onPress={() => router.back()}
          >
            <X size={24} color="#fff" />
          </Button>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <Share2 size={20} color="#fff" />
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            >
              <MoreVertical size={20} color="#fff" />
            </Button>
          </View>
        </View>
        <View className="px-4" style={{ paddingTop: insets.top }}>
          <Skeleton
            style={{ width: "100%", height: heroImageHeight }}
            className="rounded-none mb-4"
          />
          <Skeleton className="h-8 w-32 rounded-lg mb-2" />
          <Skeleton className="h-4 w-full rounded-lg mb-4" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1 }} className="bg-background">
        <StatusBar barStyle="light-content" />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: insets.top,
          }}
        >
          <Text className="text-foreground text-xl font-semibold">
            Profile not found
          </Text>
          <Button className="mt-4" onPress={() => router.back()}>
            <Button.Label>Go Back</Button.Label>
          </Button>
        </View>
      </View>
    );
  }

  const genderSymbol = profile.gender === "female" ? "\u2640" : "\u2642";

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <StatusBar barStyle="light-content" />

      {/* Header buttons - absolute positioned over image */}
      <View
        style={{
          position: "absolute",
          top: isAndroid ? insets.top + 16 : 16,
          paddingHorizontal: 16,
          left: 0,
          right: 0,
          zIndex: 10,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Button
          variant="tertiary"
          size="sm"
          isIconOnly
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          onPress={() => router.back()}
        >
          <X size={24} color="#fff" />
        </Button>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            variant="tertiary"
            size="sm"
            isIconOnly
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          >
            <Share2 size={20} color="#fff" />
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            isIconOnly
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          >
            <MoreVertical size={20} color="#fff" />
          </Button>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Hero image - edge to edge */}
        <View style={{ width: screenWidth, height: heroImageHeight }}>
          {/* Gradient skeleton background using theme colors */}
          {!isImageLoaded && (
            <LinearGradient
              colors={[surfaceColor, backgroundColor, surfaceColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
              }}
            />
          )}
          <Image
            source={
              profile.avatarUrl
                ? { uri: profile.avatarUrl }
                : require("@/assets/images/login-bg.jpeg")
            }
            style={{
              width: "100%",
              height: "100%",
              opacity: isImageLoaded ? 1 : 0,
            }}
            contentFit="cover"
            contentPosition="top"
            cachePolicy="memory-disk"
            transition={300}
            onLoad={handleImageLoad}
          />
        </View>

        {/* Name and badges */}
        <View className="px-4 mt-4">
          <Text className="text-foreground text-2xl font-bold">
            {profile.name}
          </Text>
          {profile.username && (
            <Text variant="muted" className="text-sm mt-1">
              @{profile.username}
            </Text>
          )}

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
            {profile.mbtiType && (
              <Chip variant="secondary" size="sm">
                <Chip.Label>{profile.mbtiType}</Chip.Label>
              </Chip>
            )}
          </View>
        </View>

        {/* About me */}
        {profile.bio && (
          <View className="px-4 mt-6">
            <Text className="text-foreground font-semibold mb-2">About me</Text>
            <Text variant="muted" className="leading-6">
              {profile.bio}
            </Text>
          </View>
        )}

        {/* Relationship Goal */}
        {profile.relationshipGoal && (
          <View className="px-4 mt-6">
            <Text className="text-foreground font-semibold mb-2">
              Looking for
            </Text>
            <Text variant="muted" className="leading-6">
              {profile.relationshipGoal}
            </Text>
          </View>
        )}

        {/* Personality Traits */}
        {profile.personalityTraits && profile.personalityTraits.length > 0 && (
          <View className="px-4 mt-6">
            <Text className="text-foreground font-semibold mb-2">
              Personality
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.personalityTraits.map((trait, index) => (
                <Chip key={index} variant="secondary" size="sm">
                  <Chip.Label>{trait}</Chip.Label>
                </Chip>
              ))}
            </View>
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
      <View
        className="absolute left-0 right-0 px-4 pb-4 pt-2"
        style={{ bottom: insets.bottom }}
      >
        <Button onPress={handleChat} isDisabled={isStartingChat}>
          <Button.Label>{isStartingChat ? "Starting..." : "Chat"}</Button.Label>
        </Button>
      </View>
    </View>
  );
}
