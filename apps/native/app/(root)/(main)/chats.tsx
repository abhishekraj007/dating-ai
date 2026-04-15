import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components";
import { LevelBadge } from "@/components/dating";
import { useQuery } from "convex/react";
import { api } from "@dating-ai/backend";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Spinner, Button, Avatar, Card } from "heroui-native";
import { formatDistanceToNow } from "date-fns";

export default function ChatsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"chats" | "calls">("chats");

  const conversations = useQuery(api.datingAgent.getUserConversations, {
    status: "active",
  });

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]}>
        <Header />
      </SafeAreaView>

      <View className="flex-1">
        {/* Header Tabs */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-foreground mb-4">Chats</Text>
          
          <View className="flex-row gap-2">
            <Button
              onPress={() => setActiveTab("chats")}
              variant={activeTab === "chats" ? "primary" : "secondary"}
              className="flex-1"
            >
              <Button.Label>Chats</Button.Label>
            </Button>

            <Button
              onPress={() => setActiveTab("calls")}
              variant={activeTab === "calls" ? "primary" : "secondary"}
              className="flex-1"
            >
              <Button.Label>Calls</Button.Label>
            </Button>
          </View>
        </View>

        {/* Content */}
        {activeTab === "chats" ? (
          conversations === undefined ? (
            <View className="flex-1 items-center justify-center">
              <Spinner size="lg" />
            </View>
          ) : conversations.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-lg font-semibold text-foreground mb-2">
                No conversations yet
              </Text>
              <Text className="text-center text-muted-foreground">
                Start chatting with AI profiles from the Explore tab!
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              renderItem={({ item }) => (
                <Button
                  onPress={() => router.push(`/(root)/(main)/chat/${item._id}`)}
                  variant="ghost"
                  className="h-auto p-0"
                >
                  <Card className="flex-row gap-3 p-3 w-full">
                    <Avatar size="lg" alt={item.aiProfile?.name || "AI"}>
                      {item.aiProfile?.avatarUrl ? (
                        <Avatar.Image source={{ uri: item.aiProfile.avatarUrl }} />
                      ) : (
                        <Avatar.Fallback>
                          {item.aiProfile?.name?.[0] || "?"}
                        </Avatar.Fallback>
                      )}
                    </Avatar>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-base font-semibold text-foreground flex-1">
                          {item.aiProfile?.name || "Unknown"}
                        </Text>
                        <LevelBadge level={item.relationshipLevel} size="sm" />
                      </View>

                      <Text
                        className="text-sm text-muted-foreground mb-1"
                        numberOfLines={1}
                      >
                        {item.lastMessage?.content || "Start the conversation..."}
                      </Text>

                      <Text className="text-xs text-muted-foreground">
                        {item.lastMessage?.createdAt
                          ? formatDistanceToNow(new Date(item.lastMessage.createdAt), {
                              addSuffix: true,
                            })
                          : "Just now"}
                      </Text>
                    </View>
                  </Card>
                </Button>
              )}
            />
          )
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-lg font-semibold text-foreground mb-2">
              Calls Coming Soon
            </Text>
            <Text className="text-center text-muted-foreground">
              Voice and video calls will be available in a future update!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

