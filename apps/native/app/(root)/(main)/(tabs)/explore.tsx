import { View, Dimensions, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Button, Skeleton, useThemeColor, ScrollShadow } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import { SlidersHorizontal } from "lucide-react-native";
import { ProfileCard } from "@/components/dating";
import { useExploreProfiles } from "@/hooks/dating";
import { Text } from "@/components/ui/text";
import { Header } from "@/components";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useEffect } from "react";

export default function ExploreScreen() {
  const router = useRouter();
  const foregroundColor = useThemeColor("foreground");
  const { height } = Dimensions.get("window");

  const handleFilterPress = () => {
    router.push("/filter");
  };
  const { profiles, isLoading, status, loadMore } = useExploreProfiles(20);

  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(20);
    }
  }, [status, loadMore]);

  useEffect(() => {
    if (!isLoading && profiles.length === 0 && status === "CanLoadMore") {
      loadMore(20);
    }
  }, [isLoading, profiles.length, status, loadMore]);

  const renderProfile = ({ item, index }: { item: any; index: number }) => {
    // 2 columns
    const isLeft = index % 2 === 0;
    const GAP = 12; // Adjusted gap for better spacing
    return (
      <View
        style={{
          flex: 1,
          paddingLeft: isLeft ? 16 : GAP / 2,
          paddingRight: isLeft ? GAP / 2 : 16,
        }}
      >
        <Link href={`/(root)/(main)/profile/${item._id}`} asChild>
          <Link.Trigger>
            <View>
              <ProfileCard
                name={item.name}
                age={item.age}
                zodiacSign={item.zodiacSign}
                avatarUrl={item.avatarUrl}
                gender={item.gender}
                isPressable={false}
                imageWrapper={(image) => <Link.AppleZoom>{image}</Link.AppleZoom>}
              />
            </View>
          </Link.Trigger>
        </Link>
      </View>
    );
  };

  const renderSkeleton = () => (
    <View className="flex-row flex-wrap">
      {[1, 2, 3, 4, 5, 6].map((i, index) => {
        const isLeft = index % 2 === 0;
        const GAP = 12;
        return (
          <View
            key={i}
            style={{
              width: "50%",
              paddingLeft: isLeft ? 16 : GAP / 2,
              paddingRight: isLeft ? GAP / 2 : 16,
              marginBottom: 16,
            }}
          >
            <View className="bg-surface rounded-2xl overflow-hidden aspect-[3/4]">
              <Skeleton className="w-full h-full" />
              <View className="absolute bottom-0 left-0 right-0 p-3 z-10">
                <Skeleton className="h-6 w-3/4 rounded-lg mb-2" />
                <View className="flex-row gap-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading || status === "LoadingMore" || status === "CanLoadMore") {
      return renderSkeleton();
    }

    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{
          minHeight: height - 200,
        }}
      >
        <Text size="lg" variant="default" weight="semibold">
          No Profiles Found
        </Text>
        <Text size="sm" variant="muted">
          Try adjusting your filters to see more profiles.
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView
        style={{
          flex: 1,
        }}
        edges={["top"]}
      >
        <Header
          title="Explore"
          showSettings={false}
          hidePaywall
          hideCredits
          rightContent={
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              onPress={handleFilterPress}
              className="bg-surface rounded-full"
            >
              <SlidersHorizontal size={20} color={foregroundColor} />
            </Button>
          }
        />

        {/* Profile grid */}
        <ScrollShadow
          size={20}
          LinearGradientComponent={LinearGradient}
          style={{ flex: 1 }}
        >
          <FlashList
            data={profiles}
            renderItem={renderProfile}
            keyExtractor={(item) => item._id}
            numColumns={2}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
            ItemSeparatorComponent={() => <View className="h-4" />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              status === "LoadingMore" ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color={foregroundColor} />
                </View>
              ) : null
            }
          />
        </ScrollShadow>
      </SafeAreaView>
    </View>
  );
}
