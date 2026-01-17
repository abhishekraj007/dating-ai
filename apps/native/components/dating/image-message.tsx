import { View, Pressable, Modal, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { X } from "lucide-react-native";
import { Button } from "heroui-native";

interface ImageMessageProps {
  imageUrl: string;
  isUser: boolean;
  isSelfie?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const ImageMessage = ({
  imageUrl,
  isUser,
  isSelfie = false,
}: ImageMessageProps) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setIsLightboxOpen(true)}>
        <View
          className={`rounded-xl overflow-hidden ${
            isUser ? "bg-pink-500" : "bg-surface"
          }`}
        >
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 192, height: 192 }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
          {isSelfie && (
            <View className="absolute top-2 left-2 bg-pink-500 px-2 py-1 rounded-full">
              <View className="text-white text-xs">AI Selfie</View>
            </View>
          )}
        </View>
      </Pressable>

      {/* Lightbox Modal */}
      <Modal
        visible={isLightboxOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLightboxOpen(false)}
      >
        <View className="flex-1 bg-black">
          <View className="absolute top-12 right-4 z-10">
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              className="bg-white/20 rounded-full"
              onPress={() => setIsLightboxOpen(false)}
            >
              <X size={24} color="white" />
            </Button>
          </View>
          <View className="flex-1 items-center justify-center">
            <Image
              source={{ uri: imageUrl }}
              style={{ width: screenWidth, height: screenHeight * 0.7 }}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={300}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

