import { View } from "react-native";
import {
  Heart,
  Compass,
  MessageCircle,
  Sparkles,
  User,
} from "lucide-react-native";

type TabName = "for-you" | "explore" | "chats" | "my-creation" | "account";

interface TabBarIconProps {
  name: TabName;
	color: string;
  focused: boolean;
}

const icons: Record<TabName, typeof Heart> = {
  "for-you": Heart,
  explore: Compass,
  chats: MessageCircle,
  "my-creation": Sparkles,
  account: User,
};

export const TabBarIcon = ({ name, color, focused }: TabBarIconProps) => {
  const IconComponent = icons[name];
  const size = 24;

  return (
    <View className="items-center justify-center">
      <IconComponent
        size={size}
        color={color}
        fill={focused && name === "for-you" ? color : "transparent"}
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );
};
