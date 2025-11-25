import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Avatar, Skeleton } from "heroui-native";
import { Header } from "@/components";
import { GenderTabs, LevelBadge } from "@/components/dating";
import { useConversations } from "@/hooks/dating";
import { formatDistanceToNow } from "date-fns";

type TabValue = "chats" | "calls";

export default function ChatsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("chats");
  const { conversations, isLoading } = useConversations();

  const handleConversationPress = (conversationId: string) => {
    router.push(`/(root)/(main)/chat/${conversationId}`);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return formatDistanceToNow(date, { addSuffix: false });
    } else {
      return date.toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "2-digit" });
    }
  };

  const renderConversation = ({ item }: { item: any }) => (
    <Pressable
      className="flex-row items-center px-4 py-3 border-b border-border"
      onPress={() => handleConversationPress(item._id)}
    >
      <Avatar size="md">
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
          <LevelBadge level={item.relationshipLevel} size="sm" />
        </View>
        <Text
          className="text-muted-foreground text-sm mt-0.5"
          numberOfLines={1}
        >
          {item.lastMessage?.content ?? "Start a conversation"}
        </Text>
      </View>

      <Text className="text-muted-foreground text-xs">
        {formatTime(item.lastMessageAt)}
      </Text>
    </Pressable>
  );

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
      <SafeAreaView className="flex-1" edges={["top"]}>
        <Header title="Chats" showSearch />

        {/* Tabs */}
        <View className="px-4 py-3">
          <View className="flex-row bg-surface rounded-full p-1">
            <Pressable
              onPress={() => setActiveTab("chats")}
              className={`flex-1 py-3 items-center rounded-full ${
                activeTab === "chats" ? "bg-pink-500" : ""
              }`}
            >
              <Text
                className={`font-semibold ${
                  activeTab === "chats" ? "text-white" : "text-foreground"
                }`}
              >
                Chats
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("calls")}
              className={`flex-1 py-3 items-center rounded-full ${
                activeTab === "calls" ? "bg-pink-500" : ""
              }`}
            >
              <Text
                className={`font-semibold ${
                  activeTab === "calls" ? "text-white" : "text-foreground"
                }`}
              >
                Calls
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Content */}
        {activeTab === "chats" ? (
          isLoading ? (
            renderSkeleton()
          ) : conversations.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-foreground text-xl font-semibold mb-2">
                No Conversations Yet
              </Text>
              <Text className="text-muted-foreground text-center">
                Start chatting with AI profiles from the Explore tab!
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
            />
          )
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-foreground text-xl font-semibold mb-2">
              Calls Coming Soon
            </Text>
            <Text className="text-muted-foreground text-center">
              Voice and video calls will be available in a future update.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

