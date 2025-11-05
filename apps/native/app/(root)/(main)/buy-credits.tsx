import { Button, Spinner, useThemeColor } from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { Coins, Check, Sparkles, Zap } from "lucide-react-native";
import { usePurchases } from "@/contexts/purchases-context";
import { useRouter } from "expo-router";
import Purchases, { PurchasesStoreProduct } from "react-native-purchases";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BuyCreditsScreen() {
  const accentColor = useThemeColor("accent");
  const surfaceColor = useThemeColor("surface");
  const foregroundColor = useThemeColor("foreground");
  const accentForeground = useThemeColor("accent-foreground");

  const router = useRouter();
  const { creditPackages, purchasePackage, isLoading } = usePurchases();
  const [selectedProduct, setSelectedProduct] =
    useState<PurchasesStoreProduct>();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!selectedProduct) return;

    try {
      setIsPurchasing(true);

      const { customerInfo } =
        await Purchases.purchaseStoreProduct(selectedProduct);
      router.back();
    } catch (error) {
      console.log("Purchase error:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  //   const getPackageForAmount = (amount: number) => {
  //     return creditPackages.find((pkg) =>
  //       pkg.product.identifier.includes(`credits_${amount}`)
  //     );
  //   };

  const getPopularIndex = () => {
    if (creditPackages.length === 0) return -1;
    // Middle package is popular, or second if only 3 packages
    return Math.floor(creditPackages.length / 2);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 32 }}
      >
        <View className="gap-8">
          {/* Header Section with Animation */}
          <Animated.View
            entering={FadeInUp.duration(600).springify()}
            className="items-center gap-4"
          >
            <View className="relative">
              {/* Glowing background circle */}
              <View
                className="absolute w-24 h-24 rounded-full opacity-20"
                style={{ backgroundColor: accentColor, top: -2, left: -2 }}
              />
              <View
                className="w-20 h-20 rounded-full items-center justify-center shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                <Coins size={40} color={accentForeground} strokeWidth={2.5} />
              </View>
              {/* Sparkle decoration */}
              <Animated.View
                entering={ZoomIn.delay(400).springify()}
                className="absolute -top-1 -right-1"
              >
                <Sparkles size={20} color={accentColor} fill={accentColor} />
              </Animated.View>
            </View>

            <View className="items-center gap-2">
              <Text className="text-3xl font-bold text-foreground">
                Buy Credits
              </Text>
              <Text className="text-center text-muted text-base px-4">
                Choose a credit package to continue
              </Text>
            </View>
          </Animated.View>

          {/* Credit Packages */}
          {isLoading ? (
            <View className="py-8 items-center">
              <Spinner size="lg" />
            </View>
          ) : (
            <View className="gap-4">
              {creditPackages.map((option, index) => {
                const isSelected =
                  selectedProduct?.identifier === option.identifier;
                const isPopular = index === getPopularIndex();
                const delay = index * 100;

                return (
                  <AnimatedPressable
                    key={option.identifier}
                    entering={FadeInDown.delay(delay).duration(500).springify()}
                    onPress={() => setSelectedProduct(option)}
                  >
                    <View className="relative">
                      {/* Popular Badge */}
                      {isPopular && (
                        <Animated.View
                          entering={ZoomIn.delay(delay + 200).springify()}
                          className="absolute -top-3 right-4 px-4 py-1.5 rounded-full z-10 flex-row items-center gap-1 shadow-md"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Zap
                            size={12}
                            color={accentForeground}
                            fill={accentForeground}
                          />
                          <Text className="text-xs font-bold text-accent-foreground">
                            POPULAR
                          </Text>
                        </Animated.View>
                      )}

                      {/* Card Container */}
                      <View
                        className="rounded-3xl overflow-hidden"
                        style={{
                          shadowColor: isSelected ? accentColor : "#000",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: isSelected ? 0.3 : 0.1,
                          shadowRadius: isSelected ? 12 : 8,
                          elevation: isSelected ? 8 : 4,
                        }}
                      >
                        {isSelected ? (
                          <View
                            className="p-6"
                            style={{ backgroundColor: accentColor }}
                          >
                            <PackageContent
                              option={option}
                              isSelected={isSelected}
                              foregroundColor={foregroundColor}
                              accentForeground={accentForeground}
                            />
                          </View>
                        ) : (
                          <View
                            className="p-6 border-2 border-border"
                            style={{ backgroundColor: surfaceColor }}
                          >
                            <PackageContent
                              option={option}
                              isSelected={isSelected}
                              foregroundColor={foregroundColor}
                              accentForeground={accentForeground}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          )}

          {/* Purchase Button */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(600).springify()}
            className="gap-3 mt-2"
          >
            <Button
              variant="primary"
              size="lg"
              onPress={handlePurchase}
              isDisabled={!selectedProduct || isPurchasing}
              className="w-full shadow-lg"
            >
              {isPurchasing ? (
                <View className="flex-row items-center gap-2">
                  <Spinner size="sm" color={accentForeground} />
                  <Text className="text-accent-foreground font-semibold text-base">
                    Processing...
                  </Text>
                </View>
              ) : (
                <>
                  {selectedProduct && (
                    <Coins
                      size={20}
                      color={accentForeground}
                      strokeWidth={2.5}
                    />
                  )}
                  <Text className="text-accent-foreground font-semibold text-base">
                    {selectedProduct
                      ? `Buy ${selectedProduct.title}`
                      : "Select a Package"}
                  </Text>
                </>
              )}
            </Button>

            {selectedProduct && (
              <Animated.Text
                entering={FadeInUp.duration(400)}
                className="text-center text-muted text-sm"
              >
                Secure payment • Instant delivery
              </Animated.Text>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

// Separate component for package content
const PackageContent: React.FC<{
  option: PurchasesStoreProduct;
  isSelected: boolean;
  foregroundColor: string;
  accentForeground: string;
}> = ({ option, isSelected, foregroundColor, accentForeground }) => {
  return (
    <View className="flex-row items-center justify-between">
      <View className="gap-2 flex-1">
        <Text
          className="text-2xl font-bold"
          style={{
            color: isSelected ? accentForeground : foregroundColor,
          }}
        >
          {option.title}
        </Text>
        <Text
          className="text-lg font-semibold"
          style={{
            color: isSelected ? accentForeground : foregroundColor,
            opacity: isSelected ? 0.9 : 0.7,
          }}
        >
          {option.priceString}
        </Text>
      </View>

      {/* Checkbox */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{
          backgroundColor: isSelected ? accentForeground : "transparent",
          borderWidth: 2,
          borderColor: isSelected ? accentForeground : foregroundColor + "40",
        }}
      >
        {isSelected && (
          <Animated.View entering={ZoomIn.duration(200).springify()}>
            <Check
              size={20}
              color={isSelected ? "#000" : foregroundColor}
              strokeWidth={3}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
};
