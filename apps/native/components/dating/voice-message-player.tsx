import { View, Text, Pressable } from "react-native";
import { Play, Pause } from "lucide-react-native";
import { useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface VoiceMessagePlayerProps {
  duration: number; // in seconds
  isUser: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

export const VoiceMessagePlayer = ({
  duration,
  isUser,
  onPlay,
  onPause,
}: VoiceMessagePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const progress = useSharedValue(0);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      onPause?.();
    } else {
      setIsPlaying(true);
      progress.value = withTiming(1, { duration: duration * 1000 });
      onPlay?.();
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const bgColor = isUser ? "bg-pink-500" : "bg-surface";
  const iconColor = isUser ? "white" : "#EC4899";
  const textColor = isUser ? "text-white" : "text-foreground";

  return (
    <View className={`${bgColor} rounded-full px-3 py-2 flex-row items-center`}>
      <Pressable
        onPress={handleToggle}
        className={`w-8 h-8 rounded-full items-center justify-center ${
          isUser ? "bg-white/20" : "bg-pink-500"
        }`}
      >
        {isPlaying ? (
          <Pause size={16} color={isUser ? "white" : "white"} fill={isUser ? "white" : "white"} />
        ) : (
          <Play size={16} color={isUser ? "white" : "white"} fill={isUser ? "white" : "white"} />
        )}
      </Pressable>

      {/* Waveform placeholder */}
      <View className="flex-1 h-1 mx-3 bg-white/20 rounded-full overflow-hidden">
        <Animated.View
          style={progressStyle}
          className={`h-full ${isUser ? "bg-white" : "bg-pink-500"} rounded-full`}
        />
      </View>

      <Text className={`${textColor} text-xs`}>{formatDuration(duration)}</Text>
    </View>
  );
};

