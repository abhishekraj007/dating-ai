import { Button, Popover, Spinner, Surface, useTheme } from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { Coins } from "lucide-react-native";
import { usePurchases } from "@/contexts/purchases-context";

interface BuyCreditsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const CREDIT_OPTIONS = [
  { amount: 1000, popular: false },
  { amount: 2000, popular: true },
  { amount: 3000, popular: false },
];

export function BuyCreditsSheet({ isOpen, onClose }: BuyCreditsSheetProps) {
  const { colors } = useTheme();
  const { packages, purchasePackage, isLoading } = usePurchases();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!selectedAmount) return;

    const creditPackage = packages.find((pkg) =>
      pkg.product.identifier.includes(`credits_${selectedAmount}`)
    );

    if (!creditPackage) return;

    setIsPurchasing(true);
    const success = await purchasePackage(creditPackage);
    setIsPurchasing(false);

    if (success) {
      onClose();
    }
  };

  const getPackageForAmount = (amount: number) => {
    return packages.find((pkg) =>
      pkg.product.identifier.includes(`credits_${amount}`)
    );
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Popover.Content className="w-full max-w-md">
        <Surface className="p-6 gap-4">
          <View className="items-center gap-2">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.accentSoft }}
            >
              <Coins size={32} color={colors.accent} />
            </View>
            <Text className="text-2xl font-bold text-foreground">
              Buy Credits
            </Text>
            <Text className="text-center text-muted-foreground">
              Choose a credit package to continue
            </Text>
          </View>

          {isLoading ? (
            <View className="py-8 items-center">
              <Spinner />
            </View>
          ) : (
            <ScrollView className="max-h-96">
              <View className="gap-3">
                {CREDIT_OPTIONS.map((option) => {
                  const pkg = getPackageForAmount(option.amount);
                  const isSelected = selectedAmount === option.amount;

                  return (
                    <Pressable
                      key={option.amount}
                      onPress={() => setSelectedAmount(option.amount)}
                      disabled={!pkg}
                    >
                      <View
                        className="p-4 rounded-xl border-2"
                        style={{
                          backgroundColor: isSelected
                            ? colors.accentSoft
                            : colors.surface,
                          borderColor: isSelected
                            ? colors.accent
                            : colors.border,
                        }}
                      >
                        {option.popular && (
                          <View
                            className="absolute -top-2 right-4 px-3 py-1 rounded-full"
                            style={{ backgroundColor: colors.accent }}
                          >
                            <Text className="text-xs font-semibold text-accent-foreground">
                              Popular
                            </Text>
                          </View>
                        )}

                        <View className="flex-row items-center justify-between">
                          <View className="gap-1">
                            <Text
                              className="text-xl font-bold"
                              style={{
                                color: isSelected
                                  ? colors.accentForeground
                                  : colors.foreground,
                              }}
                            >
                              {option.amount.toLocaleString()} Credits
                            </Text>
                            {pkg && (
                              <Text
                                className="text-sm"
                                style={{
                                  color: isSelected
                                    ? colors.accentForeground
                                    : colors.mutedForeground,
                                }}
                              >
                                {pkg.product.priceString}
                              </Text>
                            )}
                          </View>

                          <View
                            className="w-6 h-6 rounded-full border-2 items-center justify-center"
                            style={{
                              borderColor: isSelected
                                ? colors.accent
                                : colors.border,
                              backgroundColor: isSelected
                                ? colors.accent
                                : "transparent",
                            }}
                          >
                            {isSelected && (
                              <View
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: colors.accentForeground }}
                              />
                            )}
                          </View>
                        </View>

                        {!pkg && (
                          <Text className="text-xs text-muted-foreground mt-2">
                            Not available
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <View className="gap-3">
            <Button
              variant="primary"
              size="lg"
              onPress={handlePurchase}
              isDisabled={!selectedAmount || isPurchasing}
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
                  {selectedAmount
                    ? `Buy ${selectedAmount.toLocaleString()} Credits`
                    : "Select a Package"}
                </Text>
              )}
            </Button>

            <Button variant="ghost" size="sm" onPress={onClose} className="w-full">
              <Text className="text-muted-foreground">Cancel</Text>
            </Button>
          </View>
        </Surface>
      </Popover.Content>
    </Popover>
  );
}
