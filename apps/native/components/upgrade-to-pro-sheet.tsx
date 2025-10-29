import { Button, Popover, Spinner, Surface, useTheme } from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Crown, Check, X } from "lucide-react-native";
import { usePurchases } from "@/contexts/purchases-context";

interface UpgradeToProSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeToProSheet({ isOpen, onClose }: UpgradeToProSheetProps) {
  const { colors } = useTheme();
  const { packages, purchasePackage, isLoading } = usePurchases();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const premiumPackage = packages.find((pkg) =>
    pkg.product.identifier.includes("premium")
  );

  const handlePurchase = async () => {
    if (!premiumPackage) return;

    setIsPurchasing(true);
    const success = await purchasePackage(premiumPackage);
    setIsPurchasing(false);

    if (success) {
      onClose();
    }
  };

  const features = [
    "1000 bonus credits on upgrade",
    "Priority support",
    "Exclusive features",
    "Ad-free experience",
    "Early access to new features",
  ];

  return (
    <Popover isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Popover.Content className="w-full max-w-md">
        <Surface className="p-6 gap-4">
          <View className="items-center gap-2">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.accentSoft }}
            >
              <Crown size={32} color={colors.accent} />
            </View>
            <Text className="text-2xl font-bold text-foreground">
              Upgrade to Pro
            </Text>
            <Text className="text-center text-muted-foreground">
              Unlock premium features and get 1000 bonus credits
            </Text>
          </View>

          <ScrollView className="max-h-64">
            <View className="gap-3">
              {features.map((feature, index) => (
                <View key={index} className="flex-row items-center gap-3">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.accentSoft }}
                  >
                    <Check size={14} color={colors.accent} />
                  </View>
                  <Text className="text-base text-foreground flex-1">
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {isLoading ? (
            <View className="py-4 items-center">
              <Spinner />
            </View>
          ) : premiumPackage ? (
            <View className="gap-3">
              <View className="p-4 rounded-xl" style={{ backgroundColor: colors.surface }}>
                <Text className="text-center text-2xl font-bold text-foreground">
                  {premiumPackage.product.priceString}
                </Text>
                <Text className="text-center text-sm text-muted-foreground">
                  {premiumPackage.product.subscriptionPeriod || "per month"}
                </Text>
              </View>

              <Button
                variant="primary"
                size="lg"
                onPress={handlePurchase}
                isDisabled={isPurchasing}
                className="w-full"
              >
                {isPurchasing ? (
                  <View className="flex-row items-center gap-2">
                    <Spinner size="sm" color={colors.accentForeground} />
                    <Text className="text-accent-foreground font-semibold">
                      Processing...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-accent-foreground font-semibold">
                    Upgrade Now
                  </Text>
                )}
              </Button>
            </View>
          ) : (
            <Text className="text-center text-muted-foreground">
              No premium packages available
            </Text>
          )}

          <Button variant="ghost" size="sm" onPress={onClose} className="w-full">
            <Text className="text-muted-foreground">Maybe Later</Text>
          </Button>
        </Surface>
      </Popover.Content>
    </Popover>
  );
}
