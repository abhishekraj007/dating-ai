import { View, Text, FlatList, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Avatar, ScrollShadow, Skeleton } from "heroui-native";
import { Image } from "lucide-react-native";
import { Image as ExpoImage } from "expo-image";
import { Header } from "@/components";
import { GenderTabs, LevelBadge } from "@/components/dating";
import { useConversations, useStartConversation } from "@/hooks/dating";
import { useLikedProfiles } from "@/hooks/dating/useForYou";
import { formatDistanceToNow } from "date-fns";
import { useThemeColor } from "heroui-native";
import type { Id } from "@dating-ai/backend";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "@/hooks/use-translation";

type TabValue = "chats" | "calls";

export default function ChatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabValue>("chats");
  const { conversations, isLoading } = useConversations();
  const { profiles: likedProfiles, isLoading: isLoadingLikes } =
    useLikedProfiles();
  const { startConversation } = useStartConversation();
  const mutedColor = useThemeColor("muted");

  // Filter liked profiles that don't have conversations yet (new matches)
  const conversationProfileIds = new Set(
    conversations.map((c: any) => c.aiProfileId),
  );
  const newMatches = (likedProfiles ?? []).filter(
    (profile: any) => !conversationProfileIds.has(profile._id),
  );

  const handleConversationPress = (conversationId: string) => {
    router.push(`/(root)/(main)/chat/${conversationId}`);
  };

  const handleMatchPress = async (profileId: string) => {
    try {
      const conversationId = await startConversation({
        aiProfileId: profileId as Id<"aiProfiles">,
      });
      router.push(`/(root)/(main)/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const formatLastMessage = (content: string | null | undefined) => {
    if (!content) {
      return { text: t("chats.startConversation"), isImage: false };
    }

    try {
      const parsed = JSON.parse(content);

      if (parsed.type === "image_response") {
        return { text: t("chats.sentPhoto"), isImage: true };
      }
      if (parsed.type === "image_request") {
        return { text: t("chats.requestedPhoto"), isImage: true };
      }
      if (parsed.type === "quiz_question" || parsed.type === "quiz_start") {
        return { text: t("chats.startedQuiz"), isImage: false };
      }
      if (parsed.type === "quiz_end") {
        return { text: t("chats.quizCompleted"), isImage: false };
      }
      if (parsed.type === "quiz_answer_result") {
        return { text: t("chats.quizAnswer"), isImage: false };
      }

      return { text: content, isImage: false };
    } catch {
      return { text: content, isImage: false };
    }
  };

  const renderNewMatches = () => {
    if (newMatches.length === 0) return null;

    return (
      <View className="mb-4">
        <Text className="text-foreground opacity-80 text-lg font-bold px-4 mb-3">
          {t("chats.newMatches")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {newMatches.map((profile: any) => (
            <Pressable
              key={profile._id}
              onPress={() => handleMatchPress(profile._id)}
              style={{ width: 100 }}
            >
              <View
                style={{
                  width: 100,
                  height: 140,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {profile.avatarUrl ? (
                  <ExpoImage
                    source={{ uri: profile.avatarUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(128,128,128,0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 28,
                        fontWeight: "700",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      {profile.name?.[0] ?? "?"}
                    </Text>
                  </View>
                )}
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 56,
                    justifyContent: "flex-end",
                    paddingHorizontal: 8,
                    paddingBottom: 8,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {profile.name?.split(" ")[0]}
                  </Text>
                </LinearGradient>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return t("common.yesterday");
    } else if (diffDays < 7) {
      return formatDistanceToNow(date, { addSuffix: false });
    } else {
      return date.toLocaleDateString([], {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
      });
    }
  };

  const renderConversation = ({ item }: { item: any }) => {
    const lastMessage = formatLastMessage(item.lastMessage?.content);

    return (
      <Pressable
        className="flex-row items-center px-4 py-3 border-b border-border"
        onPress={() => handleConversationPress(item._id)}
      >
        <Avatar alt="" size="md">
          {item.profile?.avatarUrl ? (
            <Avatar.Image source={{ uri: item.profile.avatarUrl }} />
          ) : (
            <Avatar.Fallback>{item.profile?.name?.[0] ?? "AI"}</Avatar.Fallback>
          )}
        </Avatar>

        <View className="flex-1 ml-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground font-semibold">
              {item.profile?.name ?? t("chats.aiProfile")}
            </Text>
            {/* Hide level badge */}
            {/* <LevelBadge level={item.relationshipLevel} size="sm" /> */}
          </View>
          <View className="flex-row items-center gap-1 mt-0.5">
            {lastMessage.isImage && <Image size={14} color={mutedColor} />}
            <Text className="text-muted text-sm flex-1" numberOfLines={1}>
              {lastMessage.text}
            </Text>
          </View>
        </View>

        <Text className="text-muted text-xs">
          {formatTime(item.lastMessageAt)}
        </Text>
      </Pressable>
    );
  };

  const renderSkeleton = () => (
    <View>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          className="flex-row items-center px-4 py-3 border-b border-border"
        >
          <Skeleton className="w-12 h-12 rounded-full" />
          <View className="flex-1 ml-3">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-48 rounded mt-2" />
          </View>
          <Skeleton className="h-3 w-16 rounded" />
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView
        style={{
          flex: 1,
        }}
        edges={["top"]}
      >
        <Header title={t("tabs.chats")} showSettings={false} />
        <ScrollShadow
          size={20}
          LinearGradientComponent={LinearGradient}
          style={{ flex: 1 }}
        >
          {isLoading ? (
            renderSkeleton()
          ) : conversations.length === 0 && newMatches.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-foreground text-xl font-semibold mb-2">
                {t("chats.emptyTitle")}
              </Text>
              <Text className="text-muted text-center">
                {t("chats.emptyDescription")}
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item?._id ?? ""}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={renderNewMatches}
            />
          )}
        </ScrollShadow>
      </SafeAreaView>
    </View>
  );
}
