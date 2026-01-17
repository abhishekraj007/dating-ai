import {
  View,
  Text,
  ScrollView,
  Image as RNImage,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@dating-ai/backend";
import { Button, Spinner, Card, Chip, Avatar } from "heroui-native";
import { ArrowLeft, MessageCircle, Heart } from "lucide-react-native";
import { InterestChip, CompatibilityIndicator } from "@/components/dating";
import { useState } from "react";

const { width } = Dimensions.get("window");

export default function ProfileDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const profile = useQuery(
    api.features.ai.profiles.getAIProfile,
    id ? { profileId: id } : "skip"
  );

  const startConversation = useMutation(api.datingAgent.startConversation);

  const handleStartChat = async () => {
    if (!id) return;

    try {
      const conversationId = await startConversation({ aiProfileId: id });
      router.push(`/(root)/(main)/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  if (profile === undefined) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Spinner size="lg" />
      </View>
    );
  }

  if (profile === null) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-lg font-semibold text-foreground mb-2">
          Profile Not Found
        </Text>
        <Text className="text-center text-muted-foreground mb-6">
          This profile may have been removed or doesn't exist.
        </Text>
        <Button onPress={() => router.back()} variant="primary">
          <Button.Label>Go Back</Button.Label>
        </Button>
      </View>
    );
  }

  const images = profile.profileImageUrls || [];
  const displayImages =
    images.length > 0 ? images : profile.avatarUrl ? [profile.avatarUrl] : [];

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} className="absolute top-0 left-0 right-0 z-10">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Button
            onPress={() => router.back()}
            variant="ghost"
            isIconOnly
            className="bg-black/30"
          >
            <Button.Label>
              <ArrowLeft size={24} color="#FFFFFF" />
            </Button.Label>
          </Button>

          {profile.conversation && (
            <CompatibilityIndicator
              score={profile.conversation.compatibilityScore}
            />
          )}
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1">
        {/* Hero Image Carousel */}
        {displayImages.length > 0 && (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / width);
                setActiveImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {displayImages.map((url, index) => (
                <RNImage
                  key={index}
                  source={{ uri: url }}
                  style={{ width, height: width * 1.2 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Pagination Dots */}
            {displayImages.length > 1 && (
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                {displayImages.map((_, index) => (
                  <View
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === activeImageIndex ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Profile Info */}
        <View className="p-4 gap-4">
          {/* Name and Age */}
          <View className="flex-row items-center gap-3">
            <Avatar size="md" alt={profile.name}>
              {profile.avatarUrl ? (
                <Avatar.Image source={{ uri: profile.avatarUrl }} />
              ) : (
                <Avatar.Fallback>{profile.name[0]}</Avatar.Fallback>
              )}
            </Avatar>

            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-foreground">
                  {profile.name}
                </Text>
                <Text className="text-xl text-muted-foreground">
                  {profile.age}
                </Text>
              </View>

              <View className="flex-row items-center gap-2 mt-1">
                <Chip size="sm" variant="secondary">
                  <Chip.Label>{profile.zodiacSign}</Chip.Label>
                </Chip>
                {profile.mbtiType && (
                  <Chip size="sm" variant="secondary">
                    <Chip.Label>{profile.mbtiType}</Chip.Label>
                  </Chip>
                )}
              </View>
            </View>
          </View>

          {/* About Me */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-foreground mb-2">
              About me
            </Text>
            <Text className="text-base text-muted-foreground leading-6">
              {profile.bio}
            </Text>
          </Card>

          {/* Occupation */}
          {profile.occupation && (
            <Card className="p-4">
              <Text className="text-sm text-muted-foreground mb-1">
                Occupation
              </Text>
              <Text className="text-base font-medium text-foreground">
                {profile.occupation}
              </Text>
            </Card>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <Card className="p-4">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Interests
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <InterestChip key={index} interest={interest} />
                ))}
              </View>
            </Card>
          )}

          {/* Personality Traits */}
          {profile.personalityTraits && profile.personalityTraits.length > 0 && (
            <Card className="p-4">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Personality
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {profile.personalityTraits.map((trait, index) => (
                  <Chip key={index} variant="secondary">
                    <Chip.Label>{trait}</Chip.Label>
                  </Chip>
                ))}
              </View>
            </Card>
          )}

          {/* Relationship Goal */}
          {profile.relationshipGoal && (
            <Card className="p-4">
              <Text className="text-sm text-muted-foreground mb-1">
                Looking for
              </Text>
              <Text className="text-base font-medium text-foreground">
                {profile.relationshipGoal}
              </Text>
            </Card>
          )}

          {/* Language */}
          {profile.language && (
            <Card className="p-4">
              <Text className="text-sm text-muted-foreground mb-1">
                Language
              </Text>
              <Text className="text-base font-medium text-foreground">
                {profile.language}
              </Text>
            </Card>
          )}

          {/* Bottom spacing for button */}
          <View className="h-20" />
        </View>
      </ScrollView>

      {/* Chat Button */}
      <SafeAreaView
        edges={["bottom"]}
        className="absolute bottom-0 left-0 right-0 bg-background border-t border-border"
      >
        <View className="px-4 py-3">
          <Button
            onPress={handleStartChat}
            variant="primary"
            size="lg"
            className="flex-row items-center justify-center gap-2"
          >
            <Button.Label>
              <MessageCircle size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold text-base ml-2">
                {profile.conversation ? "Continue Chat" : "Start Chat"}
              </Text>
            </Button.Label>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
