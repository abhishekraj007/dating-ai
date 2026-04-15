import {
  View,
  ScrollView,
  Dimensions,
  Pressable,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { ZoomableImage } from "@/components/zoomable-image";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Button, Chip, Skeleton, useThemeColor } from "heroui-native";
import { X, Share2, MoreVertical } from "lucide-react-native";
import { useAIProfile, useCredits } from "@/hooks/dating";
import { useStartConversation, useConversationByProfile } from "@/hooks/dating";
import {
  InterestChip,
  CompatibilityIndicator,
  BlurredPremiumImage,
} from "@/components/dating";
import { useState, useCallback } from "react";
import { Text } from "@/components";
import { LinearGradient } from "expo-linear-gradient";
import { useConvexAuth } from "convex/react";
import { getChipTone, isAndroid } from "@/utils";
import { useTranslation } from "@/hooks/use-translation";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const photoWidth = (screenWidth - 48) / 2;
const heroImageHeight = screenHeight * 0.45;

export default function ProfileDetailScreen() {
  const { t } = useTranslation();
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
  const { isPremium } = useCredits();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setHasImageError(true);
    setIsImageLoaded(true);
  }, []);

  const handleChat = async () => {
    if (!id) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.back();
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

        {/* Back button */}
        <View
          style={{
            position: "absolute",
            top: insets.top + 16,
            left: 16,
            zIndex: 10,
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            isIconOnly
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onPress={() => router.back()}
            className="rounded-full"
          >
            <X size={20} color="#fff" />
          </Button>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Hero image skeleton */}
          <View style={{ width: screenWidth, height: heroImageHeight }}>
            <Skeleton
              style={{ width: "100%", height: "100%" }}
              className="rounded-none"
            />
            {/* Name & age overlay */}
            <View
              style={{
                position: "absolute",
                left: 16,
                bottom: 16,
                gap: 6,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Skeleton className="h-7 w-32 rounded-lg" />
                <Skeleton className="h-6 w-14 rounded-lg" />
              </View>
              <Skeleton className="h-4 w-44 rounded-lg" />
            </View>
          </View>

          {/* About me */}
          <View className="px-4 mt-6">
            <Skeleton className="h-4 w-24 rounded-lg mb-2" />
            <Skeleton className="h-4 w-full rounded-lg mb-1.5" />
            <Skeleton className="h-4 w-full rounded-lg mb-1.5" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </View>

          {/* Looking for */}
          <View className="px-4 mt-6">
            <Skeleton className="h-4 w-28 rounded-lg mb-2" />
            <Skeleton className="h-4 w-full rounded-lg mb-1.5" />
            <Skeleton className="h-4 w-2/3 rounded-lg" />
          </View>

          {/* Personality chips */}
          <View className="px-4 mt-6">
            <Skeleton className="h-4 w-28 rounded-lg mb-2" />
            <View className="flex-row flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </View>
          </View>

          {/* Interest chips */}
          <View className="px-4 mt-6">
            <Skeleton className="h-4 w-24 rounded-lg mb-2" />
            <View className="flex-row flex-wrap gap-2">
              <Skeleton className="h-7 w-36 rounded-full" />
              <Skeleton className="h-7 w-40 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </View>
          </View>

          <View className="h-24" />
        </ScrollView>

        {/* Chat button skeleton */}
        <View
          className="absolute left-0 right-0 px-4 pb-4 pt-2"
          style={{ bottom: insets.bottom }}
        >
          <Skeleton className="h-12 w-full rounded-xl" />
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
            {t("profile.notFound")}
          </Text>
          <Button className="mt-4" onPress={() => router.back()}>
            <Button.Label>{t("common.goBack")}</Button.Label>
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
          top: insets.top + 16,
          paddingHorizontal: 16,
          left: 0,
          right: 0,
          zIndex: 10,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => router.back()}
          className="rounded-full"
        >
          <X size={20} color="#fff" />
        </Button>
        {/* Hide for now */}
        {/* <View style={{ flexDirection: "row", gap: 8 }}>
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
        </View> */}
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
          <Link.AppleZoomTarget>
            <ZoomableImage
              source={
                profile.avatarUrl && !hasImageError
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
              onError={handleImageError}
            />
          </Link.AppleZoomTarget>

          <LinearGradient
            pointerEvents="none"
            colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,1)"]}
            locations={[0.4, 0.6, 1]}
            // locations={[0, 0.72, 1]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "50%",
            }}
          />

          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 16,
              paddingBottom: 16,
              gap: 6,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text
                size="lg"
                weight="bold"
                // className="text-white text-3xl font-bold"
              >
                {profile.name}
              </Text>
              {profile.age ? (
                <Text className="text-white/90 text-xl font-semibold">
                  {genderSymbol} {profile.age}
                </Text>
              ) : null}
            </View>

            {(profile.zodiacSign || profile.occupation) && (
              <Text className="text-white/90 text-base">
                {profile.zodiacSign ?? ""}
                {profile.zodiacSign && profile.occupation ? " • " : ""}
                {profile.occupation ?? ""}
              </Text>
            )}
          </View>
        </View>

        {/* About me */}
        {profile.bio && (
          <View className="px-4 mt-6">
            <Text variant="semi-muted" className="font-semibold mb-2">
              {t("profile.aboutMe")}
            </Text>
            <Text variant="muted" className="leading-6">
              {profile.bio}
            </Text>
          </View>
        )}

        {/* Relationship Goal */}
        {profile.relationshipGoal && (
          <View className="px-4 mt-6">
            <Text variant="semi-muted" className="font-semibold mb-2">
              {t("profile.lookingFor")}
            </Text>
            <Text variant="muted" className="leading-6">
              {profile.relationshipGoal}
            </Text>
          </View>
        )}

        {/* Personality Traits */}
        {profile.personalityTraits && profile.personalityTraits.length > 0 && (
          <View className="px-4 mt-6">
            <Text variant="semi-muted" className="font-semibold mb-2">
              {t("profile.personality")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.personalityTraits.map((trait, index) => {
                const tone = getChipTone(
                  `${profile._id}-trait-${trait}-${index}`,
                );
                return (
                  <Chip
                    key={index}
                    variant="secondary"
                    size="sm"
                    style={{
                      backgroundColor: tone.backgroundColor,
                      borderColor: tone.borderColor,
                      borderWidth: 0.5,
                    }}
                  >
                    <Chip.Label style={{ color: tone.textColor }}>
                      {trait}
                    </Chip.Label>
                  </Chip>
                );
              })}
            </View>
          </View>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View className="px-4 mt-6">
            <Text variant="semi-muted" className="font-semibold mb-2">
              {t("profile.interests")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <InterestChip
                  key={index}
                  interest={interest}
                  colorSeed={`${profile._id}-interest-${interest}-${index}`}
                />
              ))}
            </View>
          </View>
        )}

        {/* Photos grid */}
        {profile.profileImageUrls && profile.profileImageUrls.length > 0 && (
          <View className="px-4 mt-6">
            <Text variant="semi-muted" className="font-semibold mb-2">
              {t("profile.photos")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.profileImageUrls.map((url, index) =>
                isPremium ? (
                  <ZoomableImage
                    key={index}
                    source={{ uri: url }}
                    style={{
                      width: photoWidth,
                      height: photoWidth,
                      borderRadius: 12,
                    }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                ) : (
                  <BlurredPremiumImage
                    key={index}
                    imageUrl={url}
                    width={photoWidth}
                    height={photoWidth}
                    profileName={profile.name}
                    profileAvatar={profile.avatarUrl}
                    borderRadius={12}
                  />
                ),
              )}
            </View>
          </View>
        )}

        {/* Compatibility indicator if conversation exists */}
        {conversation && (
          <View className="px-4 mt-6 items-center">
            <Text className="text-foreground font-semibold mb-2">
              {t("profile.compatibility")}
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
          <Button.Label>
            {isStartingChat ? t("common.starting") : t("common.chat")}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
