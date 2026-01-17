import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback, Chip, Button } from "heroui-native";
import { MoreVertical } from "lucide-react-native";

interface ProfileCardProps {
  name: string;
  age?: number;
  zodiacSign?: string;
  avatarUrl: string | null;
  gender: "female" | "male";
  onPress?: () => void;
  onMenuPress?: () => void;
  showChatButton?: boolean;
  onChatPress?: () => void;
}

export const ProfileCard = ({
  name,
  age,
  zodiacSign,
  avatarUrl,
  gender,
  onPress,
  onMenuPress,
  showChatButton = false,
  onChatPress,
}: ProfileCardProps) => {
  const genderSymbol = gender === "female" ? "\u2640" : "\u2642";

  return (
    <PressableFeedback onPress={onPress}>
      <View className="rounded-2xl overflow-hidden bg-surface aspect-[3/4]">
        <Image
          source={
            avatarUrl
              ? { uri: avatarUrl }
              : require("@/assets/images/login-bg.jpeg")
          }
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Menu button */}
        {onMenuPress && (
          <View className="absolute top-2 right-2">
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              className="bg-black/30 rounded-full"
              onPress={onMenuPress}
            >
              <MoreVertical size={18} color="white" />
            </Button>
          </View>
        )}

        {/* Content at bottom */}
        <View className="absolute bottom-0 left-0 right-0 p-3">
          <Text className="text-white text-lg font-bold mb-2">{name}</Text>

          <View className="flex-row gap-2">
            {age && (
              <Chip size="sm" variant="tertiary">
                <Chip.Label className="text-white text-xs">
                  {genderSymbol} {age}
                </Chip.Label>
              </Chip>
            )}
            {zodiacSign && (
              <Chip size="sm" variant="tertiary">
                <Chip.Label className="text-white text-xs">
                  {zodiacSign}
                </Chip.Label>
              </Chip>
            )}
          </View>

          {showChatButton && (
            <Button
              size="sm"
              className="mt-3"
              onPress={onChatPress}
            >
              <Button.Label>Chat</Button.Label>
            </Button>
          )}
        </View>
      </View>
    </PressableFeedback>
  );
};

