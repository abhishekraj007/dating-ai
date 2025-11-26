import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Camera, X } from "lucide-react-native";
import { Button, useThemeColor } from "heroui-native";

interface PhotoUploadSlotProps {
  imageUrl?: string | null;
  onPress?: () => void;
  onRemove?: () => void;
  isLoading?: boolean;
  isMain?: boolean;
  placeholder?: string;
}

export const PhotoUploadSlot = ({
  imageUrl,
  onPress,
  onRemove,
  isLoading = false,
  isMain = false,
  placeholder = "Upload photos",
}: PhotoUploadSlotProps) => {
  const mutedColor = useThemeColor("muted");

  if (isLoading) {
    return (
      <View className="flex-1 aspect-square bg-surface rounded-xl items-center justify-center border border-dashed border-border">
        <ActivityIndicator color={mutedColor} />
      </View>
    );
  }

  if (imageUrl) {
    return (
      <View className="flex-1 aspect-square rounded-xl overflow-hidden">
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
        {onRemove && (
          <View className="absolute top-1 right-1">
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              className="bg-black/50 rounded-full w-6 h-6"
              onPress={onRemove}
            >
              <X size={14} color="white" />
            </Button>
          </View>
        )}
        {isMain && (
          <View className="absolute bottom-1 left-1 bg-pink-500 px-2 py-0.5 rounded-full">
            <Text className="text-white text-xs">Main</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 aspect-square bg-surface rounded-xl items-center justify-center border border-dashed border-border"
    >
      <Camera size={24} color={mutedColor} />
      <Text className="text-muted text-xs mt-1 text-center px-2">
        {placeholder}
      </Text>
    </Pressable>
  );
};
