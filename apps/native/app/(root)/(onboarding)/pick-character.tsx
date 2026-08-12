import { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useOnboardingCharacters } from "@/hooks/use-onboarding-characters";
import { useFinishOnboarding } from "@/hooks/use-finish-onboarding";
import { useTranslation } from "@/hooks/use-translation";
import { CharacterPickCard } from "@/components/onboarding/character-pick-card";
import type { Id } from "@dating-ai/backend";

export default function PickCharacterScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const foreground = useThemeColor("foreground");
  const muted = useThemeColor("muted");
  const { genderPreference, selectedCharacterId, setSelectedCharacterId } =
    useOnboardingStore();
  const { characters, isLoading } = useOnboardingCharacters(
    genderPreference ?? "both",
    6,
  );
  const { isFinishing, finishWithCharacter, browseWithoutChat } =
    useFinishOnboarding();
  const [activeIndex, setActiveIndex] = useState(0);

  const selected =
    characters.find((character) => character._id === selectedCharacterId) ??
    characters[activeIndex] ??
    characters[0];

  const handleChat = () => {
    if (!selected || isFinishing) return;
    void finishWithCharacter(selected._id as Id<"aiProfiles">);
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: foreground }]}>
            {t("onboarding.character.title")}
          </Text>
          <Text style={[styles.subtitle, { color: muted }]}>
            {t("onboarding.character.subtitle")}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <Spinner size="lg" />
          </View>
        ) : (
          <FlatList
            data={characters}
            keyExtractor={(item) => item._id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width}
            decelerationRate="fast"
            contentContainerStyle={styles.list}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width,
              );
              const next = characters[index];
              setActiveIndex(index);
              if (next) {
                setSelectedCharacterId(next._id as Id<"aiProfiles">);
              }
            }}
            renderItem={({ item }) => (
              <View style={{ width, alignItems: "center" }}>
                <CharacterPickCard
                  name={item.name}
                  tagline={item.tagline}
                  occupation={item.occupation}
                  avatarUrl={item.avatarUrl}
                  isTrending={item.isTrending}
                  selected={selected?._id === item._id}
                  onPress={() => {
                    setSelectedCharacterId(item._id as Id<"aiProfiles">);
                  }}
                />
              </View>
            )}
          />
        )}

        {characters.length > 1 ? (
          <View style={styles.dots}>
            {characters.map((character, index) => (
              <View
                key={character._id}
                style={[
                  styles.dot,
                  { backgroundColor: muted },
                  index === activeIndex
                    ? [styles.dotActive, { backgroundColor: foreground }]
                    : null,
                ]}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.footer}>
          <Button
            size="lg"
            className="w-full"
            isDisabled={!selected || isFinishing}
            onPress={handleChat}
          >
            {isFinishing ? <Spinner size="sm" /> : null}
            <Button.Label>
              {isFinishing
                ? t("onboarding.settingUp")
                : t("onboarding.character.cta", {
                    name: selected?.name ?? "",
                  })}
            </Button.Label>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full"
            isDisabled={isFinishing}
            onPress={() => void browseWithoutChat()}
          >
            <Button.Label>{t("onboarding.character.browse")}</Button.Label>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    alignItems: "center",
    paddingBottom: 12,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 16,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    width: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
  },
});
