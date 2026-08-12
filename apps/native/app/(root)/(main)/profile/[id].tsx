import {
  View,
  Dimensions,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { ZoomableImage } from "@/components/zoomable-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Button, Skeleton, colorKit, useThemeColor } from "heroui-native";
import { X } from "lucide-react-native";
import {
  useAIProfile,
  useCredits,
  useStartConversation,
  useConversationByProfile,
  useChatPremiumGate,
} from "@/hooks/dating";
import {
  InterestChip,
  CompatibilityIndicator,
  BlurredPremiumImage,
  DetailParallaxScroll,
  getDetailParallaxHeaderHeight,
  ProfileChatButton,
} from "@/components/dating";
import { useState, useCallback } from "react";
import { Text } from "@/components";
import { LinearGradient } from "expo-linear-gradient";
import { useConvexAuth } from "convex/react";
import { useTranslation } from "@/hooks/use-translation";

const { width: screenWidth } = Dimensions.get("window");
const photoWidth = (screenWidth - 48) / 2;

export default function ProfileDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const backgroundColor = useThemeColor("background");
  const surfaceColor = useThemeColor("surface");
  const transparentBackground = colorKit.setAlpha(backgroundColor, 0).hex();
  const { profile, isLoading } = useAIProfile(id);
  const { conversation } = useConversationByProfile(id);
  const { startConversation } = useStartConversation();
  const { requirePremiumToChat } = useChatPremiumGate();
  const { isAuthenticated } = useConvexAuth();
  const { isPremium } = useCredits();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  const headerHeight = getDetailParallaxHeaderHeight(windowHeight);
  const bottomBarPadding = Math.max(insets.bottom, 8);
  const listBottomInset = 56 + 12 + bottomBarPadding;

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setHasImageError(true);
    setIsImageLoaded(true);
  }, []);

  const handleChat = async () => {
    if (!id) return;

    if (!isAuthenticated) {
      router.back();
      router.push("/(root)/(auth)");
      return;
    }

    if (conversation) {
      router.push(`/(root)/(main)/chat/${conversation._id}`);
      return;
    }

    const canChat = await requirePremiumToChat();
    if (!canChat) {
      return;
    }

    setIsStartingChat(true);
    try {
      const conversationId = await startConversation({
        aiProfileId: id as never,
      });
      router.push(`/(root)/(main)/chat/${conversationId}`);
    } finally {
      setIsStartingChat(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar barStyle="light-content" />
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

        <View style={{ height: headerHeight }}>
          <Skeleton
            style={{ width: "100%", height: "100%" }}
            className="rounded-none"
          />
        </View>

        <View className="z-50 -mt-24 gap-6 overflow-hidden px-4">
          <View className="gap-2">
            <Skeleton className="h-7 w-40 rounded-lg" />
            <Skeleton className="h-4 w-48 rounded-lg" />
          </View>
          <View>
            <Skeleton className="mb-2 h-4 w-24 rounded-lg" />
            <Skeleton className="mb-1.5 h-4 w-full rounded-lg" />
            <Skeleton className="mb-1.5 h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </View>
          <View>
            <Skeleton className="mb-2 h-4 w-28 rounded-lg" />
            <View className="flex-row flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar barStyle="light-content" />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: insets.top,
          }}
        >
          <Text className="text-xl font-semibold text-foreground">
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
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

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
      </View>

      <DetailParallaxScroll
        headerImage={
          <View className="flex-1">
            {!isImageLoaded ? (
              <LinearGradient
                colors={[surfaceColor, backgroundColor, surfaceColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            ) : null}
            <Link.AppleZoomTarget key={profile._id}>
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
          </View>
        }
        contentContainerStyle={{ paddingBottom: listBottomInset }}
      >
        <View className="gap-6">
          <View className="gap-1.5">
            <View className="flex-row items-center gap-2">
              <Text size="3xl" weight="bold">
                {profile.name}
              </Text>
              {profile.age ? (
                <Text className="text-2xl font-semibold text-foreground/80">
                  {genderSymbol} {profile.age}
                </Text>
              ) : null}
            </View>

            {profile.zodiacSign || profile.occupation ? (
              <Text className="text-base text-muted">
                {profile.zodiacSign ?? ""}
                {profile.zodiacSign && profile.occupation ? " • " : ""}
                {profile.occupation ?? ""}
              </Text>
            ) : null}
          </View>

          {profile.bio ? (
            <View>
              <Text variant="semi-muted" className="mb-2 font-semibold">
                {t("profile.aboutMe")}
              </Text>
              <Text variant="muted" className="leading-6">
                {profile.bio}
              </Text>
            </View>
          ) : null}

          {profile.personalityTraits && profile.personalityTraits.length > 0 ? (
            <View>
              <Text variant="semi-muted" className="mb-2 font-semibold">
                {t("profile.personality")}
              </Text>
              <View className="flex-row flex-wrap gap-2.5">
                {profile.personalityTraits.map((trait, index) => (
                  <InterestChip
                    key={index}
                    interest={trait}
                    capitalize
                    colorSeed={`${profile._id}-trait-${trait}-${index}`}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {profile.interests && profile.interests.length > 0 ? (
            <View>
              <Text variant="semi-muted" className="mb-2 font-semibold">
                {t("profile.interests")}
              </Text>
              <View className="flex-row flex-wrap gap-2.5">
                {profile.interests.map((interest, index) => (
                  <InterestChip
                    key={index}
                    interest={interest}
                    colorSeed={`${profile._id}-interest-${interest}-${index}`}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {profile.profileImageUrls && profile.profileImageUrls.length > 0 ? (
            <View>
              <Text variant="semi-muted" className="mb-2 font-semibold">
                {t("profile.photos")}
              </Text>
              <View className="flex-row flex-wrap gap-1">
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
          ) : null}

          {conversation ? (
            <View className="items-center">
              <Text className="font-semibold text-foreground">
                {t("profile.compatibility")}
              </Text>
              <CompatibilityIndicator
                score={conversation.compatibilityScore}
                size="lg"
              />
            </View>
          ) : null}
        </View>
      </DetailParallaxScroll>

      <LinearGradient
        colors={[backgroundColor, transparentBackground]}
        style={styles.topGradient}
        pointerEvents="none"
      />

      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-3"
        style={{ paddingBottom: bottomBarPadding }}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={[transparentBackground, backgroundColor]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
        <ProfileChatButton
          profileName={profile.name}
          isLoading={isStartingChat}
          onPress={handleChat}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  bottomFade: {
    ...StyleSheet.absoluteFillObject,
    top: -24,
  },
});
