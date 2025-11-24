import { View, Text, ActivityIndicator, Image as RNImage } from "react-native";
import { Avatar } from "heroui-native";
import { formatDistanceToNow } from "date-fns";

interface MessageBubbleProps {
  role?: "user" | "ai";
  content: string;
  createdAt?: number;
  timestamp?: number;
  avatarUrl?: string;
  imageUrls?: string[];
  isUser?: boolean;
  isStreaming?: boolean;
  streamingText?: string;
}

export function MessageBubble({
  role,
  content,
  createdAt,
  timestamp,
  avatarUrl,
  imageUrls,
  isUser: isUserProp,
  isStreaming = false,
  streamingText,
}: MessageBubbleProps) {
  const isUser = isUserProp ?? role === "user";
  const time = timestamp || createdAt || Date.now();
  const displayContent = isStreaming && streamingText ? streamingText : content;

  return (
    <View className={`flex-row gap-2 mb-4 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar for AI messages */}
      {!isUser && (
        <Avatar size="md" alt="AI Avatar" className="w-10 h-10">
          {avatarUrl ? (
            <Avatar.Image source={{ uri: avatarUrl }} />
          ) : (
            <Avatar.Fallback>💕</Avatar.Fallback>
          )}
        </Avatar>
      )}

      <View className={`flex-1 ${isUser ? "items-end" : "items-start"}`}>
        {/* Message bubble */}
        <View
          className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
            isUser ? "bg-pink-500 rounded-tr-sm" : "bg-muted rounded-tl-sm"
          }`}
        >
          <View className="flex-row items-start gap-2">
            <Text
              className={`text-base flex-1 ${isUser ? "text-white" : "text-foreground"}`}
            >
              {displayContent}
            </Text>
            {isStreaming && (
              <ActivityIndicator
                size="small"
                color={isUser ? "#FFFFFF" : "#FF3B8E"}
              />
            )}
          </View>

          {/* Images */}
          {imageUrls && imageUrls.length > 0 && (
            <View className="mt-2 gap-2">
              {imageUrls.map((url, index) => (
                <RNImage
                  key={index}
                  source={{ uri: url }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
        </View>

        {/* Timestamp */}
        <Text className="text-xs text-muted-foreground mt-1 px-1">
          {formatDistanceToNow(new Date(time), { addSuffix: true })}
        </Text>
      </View>
    </View>
  );
}
