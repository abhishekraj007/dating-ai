import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@dating-ai/backend";
import { useState, useRef } from "react";
import { Button, TextField } from "heroui-native";
import {
  ChevronLeft,
  Send,
  Image as ImageIcon,
  Camera,
  Lightbulb,
  MessageSquare,
} from "lucide-react-native";
import {
  MessageBubble,
  CompatibilityIndicator,
  ActionButton,
  SelfieRequestSheet,
  SelfieStyleOptions,
} from "@/components/dating";
import { LevelBadge } from "@/components/dating/level-badge";

export default function ChatPage() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selfieSheetVisible, setSelfieSheetVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Query conversation details
  const conversation = useQuery(
    api.datingAgent.getConversation,
    conversationId ? { conversationId: conversationId as any } : "skip"
  );

  // Query messages with streaming support
  const messagesData = useQuery(
    api.datingAgent.listMessages,
    conversationId
      ? {
          conversationId: conversationId as any,
          paginationOpts: { numItems: 50, cursor: null },
          streamArgs: { kind: "list" },
        }
      : "skip"
  );

  const sendMessageMutation = useMutation(api.datingAgent.sendMessage);

  const messages = messagesData?.page || [];
  const streams = Array.isArray(messagesData?.streams)
    ? messagesData.streams
    : [];

  const handleSend = async () => {
    if (!message.trim() || !conversationId || isSending) return;

    const messageToSend = message.trim();
    setMessage("");
    setIsSending(true);

    try {
      await sendMessageMutation({
        conversationId: conversationId as any,
        prompt: messageToSend,
      });

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert(error.message || "Failed to send message");
      setMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  if (!conversationId) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground">Invalid conversation</Text>
      </View>
    );
  }

  if (conversation === undefined || messagesData === undefined) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FF3B8E" />
      </View>
    );
  }

  if (!conversation) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground">Conversation not found</Text>
      </View>
    );
  }

  const aiProfile = conversation.aiProfile as any;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <SafeAreaView
        edges={["top"]}
        className="border-b border-border bg-background"
      >
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            isIconOnly
            size="sm"
            onPress={() => router.back()}
          >
            <Button.Label>
              <ChevronLeft size={24} color="#FF3B8E" />
            </Button.Label>
          </Button>

          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">
              {aiProfile?.name || "Unknown"}
            </Text>
            <Text className="text-sm text-muted-foreground">Online</Text>
          </View>

          <LevelBadge level={conversation.relationshipLevel} size="md" />
        </View>
      </SafeAreaView>

      {/* Compatibility Heart */}
      <CompatibilityIndicator score={conversation.compatibilityScore} />

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        inverted
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => {
          const isUser = item.role === "user";
          const text = item.text || item.parts?.[0]?.text || "";

          // Check if there's an active stream for this message
          const activeStream: any = streams.find(
            (s: any) => s.messageId === item._id && s.status === "streaming"
          );

          return (
            <MessageBubble
              content={text}
              isUser={isUser}
              timestamp={item._creationTime}
              avatarUrl={isUser ? undefined : aiProfile?.avatarUrl}
              isStreaming={!!activeStream}
              streamingText={activeStream?.currentText}
            />
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-muted-foreground text-center">
              Start your conversation with {aiProfile?.name}!
            </Text>
          </View>
        }
      />

      {/* Action Buttons */}
      <View className="flex-row gap-2 px-4 py-2 border-t border-border">
        <ActionButton
          icon={<Camera size={20} color="#FF3B8E" />}
          label="Selfie"
          onPress={() => setSelfieSheetVisible(true)}
        />
        <ActionButton
          icon={<MessageSquare size={20} color="#FF3B8E" />}
          label="Quiz"
          onPress={() => {
            alert("Quiz feature coming soon!");
          }}
        />
        <ActionButton
          icon={<Lightbulb size={20} color="#FF3B8E" />}
          label="Topic"
          onPress={() => {
            alert("Topic suggestion coming soon!");
          }}
        />
      </View>

      {/* Input */}
      <SafeAreaView
        edges={["bottom"]}
        className="border-t border-border bg-background"
      >
        <View className="flex-row items-center gap-2 px-4 py-3">
          <Button
            variant="ghost"
            isIconOnly
            size="md"
            onPress={() => {
              alert("Image upload coming soon!");
            }}
          >
            <Button.Label>
              <ImageIcon size={24} color="#FF3B8E" />
            </Button.Label>
          </Button>

          <TextField className="flex-1" isDisabled={isSending}>
            <TextField.Input
              className="bg-muted rounded-full"
              placeholderTextColor="#999"
            >
              <TextField.InputStartContent className="pl-4" />
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                placeholderTextColor="#999"
                className="text-foreground text-base flex-1 py-2"
                multiline
                maxLength={500}
                editable={!isSending}
              />
              <TextField.InputEndContent className="pr-2" />
            </TextField.Input>
          </TextField>

          <Button
            onPress={handleSend}
            isDisabled={!message.trim() || isSending}
            variant="primary"
            isIconOnly
            size="md"
            className={!message.trim() || isSending ? "bg-muted" : ""}
          >
            <Button.Label>
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={20} color={message.trim() ? "#FFFFFF" : "#999"} />
              )}
            </Button.Label>
          </Button>
        </View>
      </SafeAreaView>

      {/* Selfie Request Sheet */}
      <SelfieRequestSheet
        visible={selfieSheetVisible}
        onClose={() => setSelfieSheetVisible(false)}
        onRequest={(options: SelfieStyleOptions) => {
          // TODO: Implement selfie request mutation
          console.log("Selfie request with options:", options);
          alert(
            "Selfie generation coming soon! Options: " + JSON.stringify(options)
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}
