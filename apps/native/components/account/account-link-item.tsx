import { Button, useThemeColor } from "heroui-native";
import type { LucideIcon } from "lucide-react-native";
import { ChevronRight } from "lucide-react-native";
import { Text, View } from "react-native";

type AccountLinkItemProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  onPress: () => void | Promise<void>;
};

export const AccountLinkItem = ({
  title,
  description,
  icon: Icon,
  onPress,
}: AccountLinkItemProps) => {
  const muted = useThemeColor("muted");

  return (
    <Button variant="tertiary" className="justify-start" onPress={onPress}>
      <View className="w-full flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <Icon size={18} color={muted} />
          <View className="flex-1">
            <Text className="text-md font-medium text-foreground">{title}</Text>
            {description && (
              <Text className="text-xs text-muted">{description}</Text>
            )}
          </View>
        </View>
        <ChevronRight size={16} color={muted} />
      </View>
    </Button>
  );
};
