import { View } from "react-native";
import { Heart } from "lucide-react-native";

interface AppLogoProps {
  size?: number;
}

export const AppLogo = ({ size = 32 }: AppLogoProps) => {
  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Heart size={size * 0.8} color="#EC4899" fill="#EC4899" />
    </View>
  );
};

