import { View, Text, Pressable } from "react-native";
import { CustomBottomSheet } from "../bottom-sheet";
import { Trash2, Copy, Reply } from "lucide-react-native";
import { useThemeColor } from "heroui-native";

interface MessageAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface MessageActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function MessageActionsSheet({
  isOpen,
  onClose,
  onDelete,
}: MessageActionsSheetProps) {
  const foreground = useThemeColor("foreground");

  const actions: MessageAction[] = [
    {
      id: "delete",
      label: "Delete Message",
      icon: <Trash2 size={20} color="#ef4444" />,
      onPress: () => {
        onClose();
        onDelete();
      },
      destructive: true,
    },
  ];

  return (
    <CustomBottomSheet isOpen={isOpen} onClose={onClose} snapPoints={["25%"]}>
      <View className="px-4 pb-6">
        <Text className="text-foreground text-lg font-semibold mb-4">
          Message Options
        </Text>
        <View className="gap-2">
          {actions.map((action) => (
            <Pressable
              key={action.id}
              onPress={action.onPress}
              className="flex-row items-center py-3 px-4 rounded-xl bg-surface active:opacity-70"
            >
              {action.icon}
              <Text
                className={`ml-3 text-base ${
                  action.destructive ? "text-red-500" : "text-foreground"
                }`}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </CustomBottomSheet>
  );
}
