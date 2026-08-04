import { Fragment } from "react";
import { Text, View } from "react-native";
import { ListGroup, Separator, useThemeColor } from "heroui-native";
import type { LucideIcon } from "lucide-react-native";

export type AccountActionItem = {
  id: string;
  title: string;
  icon: LucideIcon;
  onPress: () => void | Promise<void>;
};

type AccountSectionCardProps = {
  title: string;
  description?: string;
  items: AccountActionItem[];
};

export function AccountSectionCard({
  title,
  description,
  items,
}: AccountSectionCardProps) {
  const foreground = useThemeColor("foreground");
  const muted = useThemeColor("muted");

  return (
    <View className="gap-2">
      <View className="px-1">
        <Text className="text-sm text-muted">{title}</Text>
        {description ? (
          <Text className="mt-0.5 text-xs text-muted">{description}</Text>
        ) : null}
      </View>

      <ListGroup>
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <Fragment key={item.id}>
              {index > 0 ? <Separator className="ml-14 mr-4" /> : null}
              <ListGroup.Item onPress={item.onPress}>
                <ListGroup.ItemPrefix>
                  <Icon size={22} color={foreground} />
                </ListGroup.ItemPrefix>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{item.title}</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix
                  iconProps={{ size: 16, color: muted }}
                />
              </ListGroup.Item>
            </Fragment>
          );
        })}
      </ListGroup>
    </View>
  );
}
