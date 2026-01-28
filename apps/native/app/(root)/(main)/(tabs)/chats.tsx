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

type TabValue = "chats" | "calls";

/**
 * Format the last message content for display in the chat list.
 * Handles special message types like image_response, quiz, etc.
 */
function formatLastMessage(content: string | null | undefined): {
  text: string;
  isImage: boolean;
} {
  if (!content) {
    return { text: "Start a conversation", isImage: false };
  }

  // Try to parse as JSON to detect special message types
  try {
    const parsed = JSON.parse(content);

    if (parsed.type === "image_response") {
      return { text: "Sent a photo", isImage: true };
    }
    if (parsed.type === "image_request") {
      return { text: "Requested a photo", isImage: true };
    }
    if (parsed.type === "quiz_question" || parsed.type === "quiz_start") {
      return { text: "Started a quiz", isImage: false };
    }
    if (parsed.type === "quiz_end") {
      return { text: "Quiz completed", isImage: false };
    }
    if (parsed.type === "quiz_answer_result") {
      return { text: "Quiz answer", isImage: false };
    }

    // Unknown structured type, show generic message
    return { text: content, isImage: false };
  } catch {
    // Not JSON, return as plain text
    return { text: content, isImage: false };
  }
}

export default function ChatsScreen() {
  const router = useRouter();
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

  const renderNewMatches = () => {
    if (newMatches.length === 0) return null;

    return (
      <View className="mb-4">
        <Text className="text-foreground text-lg font-bold px-4 mb-3">
          New Matches
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          {newMatches.map((profile: any) => (
            <Pressable
              key={profile._id}
              onPress={() => handleMatchPress(profile._id)}
              className="items-center"
            >
              <View className="w-24 h-32 rounded-xl overflow-hidden mb-2">
                <ExpoImage
                  source={{ uri: profile.avatarUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
              </View>
              <Text
                className="text-foreground text-sm font-medium"
                numberOfLines={1}
              >
                {profile.name}
              </Text>
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
      return "Yesterday";
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
              {item.profile?.name ?? "AI Profile"}
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
        <Header title="Chats" showSettings={false} />
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
                No Conversations Yet
              </Text>
              <Text className="text-muted text-center">
                Start chatting with AI profiles from the Explore tab!
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
