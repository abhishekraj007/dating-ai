import { useRouter } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";
import { Crown, Coins, Settings, Search } from "lucide-react-native";
import { useConvexAuth, useQuery } from "convex/react";
import { usePurchases } from "@/contexts/purchases-context";
import { api } from "@dating-ai/backend";
import { AppLogo } from "./app-logo";

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showSettings?: boolean;
  rightContent?: React.ReactNode;
}

export const Header = ({
  title,
  showSearch = false,
  showSettings = true,
  rightContent,
}: HeaderProps) => {
  const foregroundColor = useThemeColor("foreground");
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const { presentPaywall } = usePurchases();
  const userData = useQuery(api.user.fetchUserAndProfile);

  return (
    <View className="flex-row items-center justify-between px-4 py-2">
      <View className="flex-row items-center gap-2">
        <AppLogo size={28} />
        {title && (
          <Text className="text-foreground text-xl font-bold">{title}</Text>
        )}
      </View>

      <View className="flex-row items-center justify-between gap-2">
        {rightContent}
        {showSearch && (
          <Button
            variant="tertiary"
            size="sm"
            isIconOnly
            className="rounded-full"
            onPress={() => {
              // TODO: Implement search
            }}
          >
            <Search size={20} color={foregroundColor} />
          </Button>
        )}
        {isAuthenticated ? (
          <>
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              className="rounded-full bg-pink-500"
              onPress={presentPaywall}
            >
              <Crown size={16} color={foregroundColor} />
            </Button>

            <Button
              variant="primary"
              size="sm"
              onPress={() => {
                router.push("/buy-credits");
              }}
            >
              <Coins size={16} color={foregroundColor} />
              <Text className="text-foreground font-medium">
                {userData?.profile?.credits ?? 0}
              </Text>
            </Button>

            {showSettings && (
              <Button
                variant="tertiary"
                size="sm"
                isIconOnly
                className="rounded-full"
                onPress={() => {
                  router.navigate("/settings");
                }}
              >
                <Settings size={16} color={foregroundColor} />
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="tertiary"
            size="sm"
            onPress={() => {
              router.push("/(root)/(auth)");
            }}
          >
            <Text className="text-foreground font-medium">Sign In</Text>
          </Button>
        )}
      </View>
    </View>
  );
};
