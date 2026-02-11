import { Separator, Surface } from "heroui-native";
import { Text, View } from "react-native";

type AccountSectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export const AccountSectionCard = ({
  title,
  description,
  children,
}: AccountSectionCardProps) => {
  return (
    <Surface className="p-4 gap-3">
      <View>
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        {description && (
          <Text className="text-xs text-muted">{description}</Text>
        )}
      </View>
      <Separator />
      <View className="gap-2">{children}</View>
    </Surface>
  );
};
