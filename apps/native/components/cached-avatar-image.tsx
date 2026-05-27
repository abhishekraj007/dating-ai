import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Avatar } from "heroui-native";

interface CachedAvatarImageProps {
  uri: string;
  cacheKey?: string;
}

export function CachedAvatarImage({ uri, cacheKey }: CachedAvatarImageProps) {
  const source = cacheKey ? { uri, cacheKey } : { uri };

  return (
    <Avatar.Image asChild source={source}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
      />
    </Avatar.Image>
  );
}
