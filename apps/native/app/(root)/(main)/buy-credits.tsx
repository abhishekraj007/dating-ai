import { Button, Spinner, useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { Coins, Check, Sparkles, Zap } from "lucide-react-native";
import { usePurchases } from "@/contexts/purchases-context";
import { useRouter } from "expo-router";
import { PurchasesStoreProduct } from "react-native-purchases";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BuyCreditsScreen() {
  const accentColor = useThemeColor("accent");
  const surfaceColor = useThemeColor("surface");
  const foregroundColor = useThemeColor("foreground");
  const accentForeground = useThemeColor("accent-foreground");

  const router = useRouter();
  const { creditPackages, isLoading, purchaseStoreProduct } = usePurchases();
  const [selectedProduct, setSelectedProduct] =
    useState<PurchasesStoreProduct>();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const sortedPackages = [...creditPackages].sort((a, b) => a.price - b.price);
  const popularIndex =
    sortedPackages.length === 0 ? -1 : Math.floor(sortedPackages.length / 2);

  useEffect(() => {
    if (sortedPackages.length === 0) {
      return;
    }

    const hasSelectedProduct = selectedProduct
      ? sortedPackages.some(
          (product) => product.identifier === selectedProduct.identifier,
        )
      : false;

    if (hasSelectedProduct) {
      return;
    }

    const defaultProduct = sortedPackages[popularIndex];

    if (defaultProduct) {
      setSelectedProduct(defaultProduct);
    }
  }, [popularIndex, selectedProduct, sortedPackages]);

  const getPopularIndex = () => {
    return popularIndex;
  };

  const handlePurchase = async () => {
    if (!selectedProduct) return;

    try {
      setIsPurchasing(true);
      const didPurchase = await purchaseStoreProduct(selectedProduct);

      if (didPurchase) {
        router.back();
      }
    } catch (error) {
      console.log("Purchase error:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <View className="flex-1 bg-background ">
      {/* Fixed Header */}
      <Animated.View
        entering={FadeInUp.duration(600).springify()}
        className="items-center gap-4 pt-8 pb-6 px-5"
      >
        <View className="relative">
          <View
            className="absolute w-24 h-24 rounded-full opacity-20"
            style={{ backgroundColor: accentColor, top: -2, left: -2 }}
          />
          <View
            className="w-18 h-18 rounded-full items-center justify-center shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            <Coins size={40} color={accentForeground} strokeWidth={2.5} />
          </View>
          <Animated.View
            entering={ZoomIn.delay(400).springify()}
            className="absolute -top-1 -right-1"
          >
            <Sparkles size={20} color={accentColor} fill={accentColor} />
          </Animated.View>
        </View>

        <Text className="text-3xl font-bold text-foreground">Buy Credits</Text>
      </Animated.View>

      {/* Scrollable Packages */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
        }}
      >
        {isLoading ? (
          <View className="py-8 items-center">
            <Spinner size="lg" />
          </View>
        ) : (
          <View className="gap-4">
            {sortedPackages.map((option, index) => {
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
                      <View
                        className="px-6 py-4 border-2"
                        style={{
                          backgroundColor: isSelected
                            ? accentColor
                            : surfaceColor,
                          borderColor: isSelected ? accentColor : "transparent",
                        }}
                      >
                        <PackageContent
                          option={option}
                          isSelected={isSelected}
                          foregroundColor={foregroundColor}
                          accentForeground={accentForeground}
                        />
                      </View>
                    </View>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Fixed Footer */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(600).springify()}
        className="px-5 pt-4 pb-8"
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
                <Coins size={20} color={accentForeground} strokeWidth={2.5} />
              )}
              <Text className="text-accent-foreground font-semibold text-base">
                {selectedProduct
                  ? `Buy ${selectedProduct.title}`
                  : "Select a Package"}
              </Text>
            </>
          )}
        </Button>
      </Animated.View>
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
