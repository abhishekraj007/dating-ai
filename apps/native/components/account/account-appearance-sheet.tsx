import { useAppTheme } from "@/contexts/app-theme-context";
import { BottomSheet, Button, Separator, useThemeColor } from "heroui-native";
import { Moon, Sun } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type ThemeOption = {
  id: string;
  name: string;
  lightVariant: string;
  darkVariant: string;
  colors: { primary: string; secondary: string; tertiary: string };
};

const availableThemes: ThemeOption[] = [
  {
    id: "default",
    name: "Default",
    lightVariant: "light",
    darkVariant: "dark",
    colors: {
      primary: "#006FEE",
      secondary: "#17C964",
      tertiary: "#F5A524",
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    lightVariant: "lavender-light",
    darkVariant: "lavender-dark",
    colors: {
      primary: "hsl(270 50% 75%)",
      secondary: "hsl(160 40% 70%)",
      tertiary: "hsl(45 55% 75%)",
    },
  },
  {
    id: "mint",
    name: "Mint",
    lightVariant: "mint-light",
    darkVariant: "mint-dark",
    colors: {
      primary: "hsl(165 45% 70%)",
      secondary: "hsl(145 50% 68%)",
      tertiary: "hsl(55 60% 75%)",
    },
  },
  {
    id: "sky",
    name: "Sky",
    lightVariant: "sky-light",
    darkVariant: "sky-dark",
    colors: {
      primary: "hsl(200 50% 72%)",
      secondary: "hsl(175 45% 70%)",
      tertiary: "hsl(48 58% 75%)",
    },
  },
];

type AccountAppearanceSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AccountAppearanceSheet = ({
  isOpen,
  onOpenChange,
}: AccountAppearanceSheetProps) => {
  const { currentTheme, toggleTheme, isLight, setTheme } = useAppTheme();

  const getCurrentThemeId = () => {
    if (currentTheme === "light" || currentTheme === "dark") return "default";
    if (currentTheme.startsWith("lavender")) return "lavender";
    if (currentTheme.startsWith("mint")) return "mint";
    if (currentTheme.startsWith("sky")) return "sky";
    return "default";
  };

  const handleThemeSelect = async (theme: ThemeOption) => {
    const variant = isLight ? theme.lightVariant : theme.darkVariant;
    await setTheme(variant as Parameters<typeof setTheme>[0]);
  };

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["72%"]}>
          <View className="gap-4 py-4">
            <View className="gap-2">
              <Text className="text-sm font-medium text-muted">Theme</Text>
              <Button
                variant="primary"
                onPress={() => {
                  void toggleTheme();
                }}
              >
                {isLight ? (
                  <Sun size={18} color="white" />
                ) : (
                  <Moon size={18} color="white" />
                )}
                <Text className="text-white font-medium">
                  {isLight ? "Light" : "Dark"}
                </Text>
              </Button>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-muted">Color</Text>
              <View className="px-12 py-4 bg-overlay flex-row justify-between gap-3">
                {availableThemes.map((theme) => (
                  <ThemeOptionButton
                    key={theme.id}
                    theme={theme}
                    isActive={getCurrentThemeId() === theme.id}
                    onPress={() => {
                      void handleThemeSelect(theme);
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
};

const ThemeOptionButton = ({
  theme,
  isActive,
  onPress,
}: {
  theme: ThemeOption;
  isActive: boolean;
  onPress: () => void;
}) => {
  const accent = useThemeColor("accent");

  return (
    <Pressable onPress={onPress} className="items-center">
      <View className="items-center gap-2">
        <View style={{ position: "relative", padding: 5 }}>
          {isActive ? (
            <View
              style={{
                position: "absolute",
                width: 60,
                height: 60,
                borderRadius: 30,
                borderWidth: 3,
                borderColor: accent,
                top: 0,
                left: 0,
              }}
            />
          ) : null}

          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <View
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundColor: theme.colors.primary,
              }}
            />
            <View
              style={{
                position: "absolute",
                width: "100%",
                height: "50%",
                backgroundColor: theme.colors.secondary,
                bottom: 0,
              }}
            />
            <View
              style={{
                position: "absolute",
                width: "50%",
                height: "50%",
                backgroundColor: theme.colors.tertiary,
                bottom: 0,
                right: 0,
              }}
            />
          </View>
        </View>
        <Text className="text-xs text-foreground">{theme.name}</Text>
      </View>
    </Pressable>
  );
};
