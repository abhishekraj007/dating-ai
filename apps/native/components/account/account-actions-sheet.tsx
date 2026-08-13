import { BottomSheet, Button } from "heroui-native";
import { Trash2 } from "lucide-react-native";
import { Text, View } from "react-native";
import { useTranslation } from "@/hooks/use-translation";

type AccountActionsSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isDeletingUser: boolean;
  onDeleteAccount: () => void;
};

export const AccountActionsSheet = ({
  isOpen,
  onOpenChange,
  isDeletingUser,
  onDeleteAccount,
}: AccountActionsSheetProps) => {
  const { t } = useTranslation();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["36%"]}>
          <View className="gap-4">
            <View className="gap-1">
              <Text className="text-2xl font-semibold text-foreground">
                {t("account.actions.title")}
              </Text>
            </View>

            <View className="mt-2 gap-2">
              <Text className="text-xl font-semibold text-danger">
                {t("account.actions.dangerTitle")}
              </Text>
              <Text className="text-sm text-muted">
                {t("account.actions.dangerDescription")}
              </Text>
              <Button
                className="mt-1"
                variant="danger"
                isDisabled={isDeletingUser}
                onPress={onDeleteAccount}
              >
                <Trash2 size={18} color="white" />
                <Text className="text-white text-lg font-medium">
                  {isDeletingUser
                    ? t("account.actions.deleting")
                    : t("account.actions.delete")}
                </Text>
              </Button>
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};
