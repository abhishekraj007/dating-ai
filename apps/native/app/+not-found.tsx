import { Container } from "@/components/container";
import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";
import { useTranslation } from "@/hooks/use-translation";

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title") }} />
      <Container>
        <View className="flex-1 justify-center items-center p-6">
          <View className="items-center">
            <Text className="text-6xl mb-4">🤔</Text>
            <Text className="text-2xl font-bold text-foreground mb-2 text-center">
              {t("notFound.heading")}
            </Text>
            <Text className="text-muted text-center mb-8 max-w-sm">
              {t("notFound.description")}
            </Text>
            <Link href="/" asChild>
              <Text className="text-primary font-medium bg-primary/10 px-6 py-3 rounded-lg">
                {t("notFound.goHome")}
              </Text>
            </Link>
          </View>
        </View>
      </Container>
    </>
  );
}
