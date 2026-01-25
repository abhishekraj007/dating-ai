import { View, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button, Skeleton, useThemeColor, ScrollShadow } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import { SlidersHorizontal } from "lucide-react-native";
import { ProfileCard } from "@/components/dating";
import { useExploreProfiles } from "@/hooks/dating";
import { Text } from "@/components/ui/text";
import { Header } from "@/components";
import { FlashList } from "@shopify/flash-list";

export default function ExploreScreen() {
  const router = useRouter();
  const foregroundColor = useThemeColor("foreground");

  const handleFilterPress = () => {
    router.push("/filter");
  };
  const { profiles, isLoading } = useExploreProfiles(50);

  const handleProfilePress = (profileId: string) => {
    router.push(`/(root)/(main)/profile/${profileId}`);
  };

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
        <ProfileCard
          name={item.name}
          age={item.age}
          zodiacSign={item.zodiacSign}
          avatarUrl={item.avatarUrl}
          gender={item.gender}
          onPress={() => handleProfilePress(item._id)}
        />
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
    if (isLoading) {
      return renderSkeleton();
    }

    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-foreground text-xl font-semibold mb-2">
          No Profiles Found
        </Text>
        <Text className="text-muted text-center">
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
          />
        </ScrollShadow>
      </SafeAreaView>
    </View>
  );
}
