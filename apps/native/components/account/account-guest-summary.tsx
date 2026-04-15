import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";
import { useTranslation } from "@/hooks/use-translation";

type AccountGuestSummaryProps = {
  onLogin: () => void;
};

export const AccountGuestSummary = ({
  onLogin,
}: AccountGuestSummaryProps) => {
  const { t } = useTranslation();

  return (
    <Surface className="p-4 gap-3">
      <View className="gap-2">
        <Button variant="primary" onPress={onLogin}>
          {t("account.guest.login")}
        </Button>
      </View>
    </Surface>
  );
};
