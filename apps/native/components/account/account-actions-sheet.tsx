import { BottomSheet, Button, Separator } from "heroui-native";
import { Trash2 } from "lucide-react-native";
import { Text, View } from "react-native";
import { useTranslation } from "@/hooks/use-translation";

type AccountActionsSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isClearingCache: boolean;
  isDeletingUser: boolean;
  onClearCache: () => void;
  onDeleteAccount: () => void;
};

export const AccountActionsSheet = ({
  isOpen,
  onOpenChange,
  isClearingCache,
  isDeletingUser,
  onClearCache,
  onDeleteAccount,
}: AccountActionsSheetProps) => {
  const { t } = useTranslation();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["44%"]}>
          <View className="gap-4">
            <View className="gap-1">
              <Text className="text-2xl font-semibold text-foreground">
                {t("account.actions.title")}
              </Text>
              {/* <Text className="text-xs text-muted">
                {t("account.actions.subtitle")}
              </Text> */}
            </View>

            <Button
              variant="secondary"
              isDisabled={isClearingCache || isDeletingUser}
              onPress={onClearCache}
            >
              <Text className="text-foreground text-lg font-medium">
                {isClearingCache
                  ? t("account.actions.clearingCache")
                  : t("account.actions.clearCache")}
              </Text>
            </Button>

            <Separator />

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
