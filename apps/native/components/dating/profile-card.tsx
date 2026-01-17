import { View, Text, Image, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MoreVertical } from "lucide-react-native";

interface ProfileCardProps {
  name: string;
  age: number;
  zodiacSign?: string;
  avatarUrl?: string;
  onPress?: () => void;
  showMenu?: boolean;
  onMenuPress?: () => void;
}

export function ProfileCard({
  name,
  age,
  zodiacSign,
  avatarUrl,
  onPress,
  showMenu = false,
  onMenuPress,
}: ProfileCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl overflow-hidden aspect-[3/4] bg-muted"
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-full bg-muted items-center justify-center">
          <Text className="text-6xl">{name[0]}</Text>
        </View>
      )}
      
      {/* Gradient overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        className="absolute bottom-0 left-0 right-0 h-24"
      />
      
      {/* Profile info */}
      <View className="absolute bottom-3 left-3 right-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-bold">
              {name}, {age}
            </Text>
            {zodiacSign && (
              <Text className="text-white/80 text-sm">{zodiacSign}</Text>
            )}
          </View>
          
          {showMenu && (
            <Pressable
              onPress={onMenuPress}
              className="w-8 h-8 bg-white/20 rounded-full items-center justify-center"
            >
              <MoreVertical size={18} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

