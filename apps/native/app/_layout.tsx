import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "../global.css";
import { HeroUINativeProvider } from "heroui-native";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { LanguageProvider } from "@/contexts/language-context";
import { PurchasesProvider } from "@/contexts/purchases-context";
import ConvexProvider from "@/providers/ConvexProvider";
import SplashScreenProvider from "@/providers/SplashScreenProvider";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { featureFlags } from "react-native-screens";

featureFlags.experiment.ios26AllowInteractionsDuringTransition = true;

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const heroUIConfig = {
  // colorScheme: "dark",
  // theme: currentTheme,
  textProps: {
    allowFontScaling: false,
  },
};
/* ------------------------------- root layout ------------------------------ */
export default function Layout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <KeyboardProvider>
        <ConvexProvider>
          <LanguageProvider>
            <AppThemeProvider>
              <SplashScreenProvider>
                <PurchasesProvider>
                  <HeroUINativeProvider config={heroUIConfig}>
                    <Slot />
                  </HeroUINativeProvider>
                </PurchasesProvider>
              </SplashScreenProvider>
            </AppThemeProvider>
          </LanguageProvider>
        </ConvexProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
