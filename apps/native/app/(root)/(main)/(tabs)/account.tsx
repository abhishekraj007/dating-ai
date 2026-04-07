import { Fragment } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";
import { api, useQuery } from "@dating-ai/backend";
import { useRouter } from "expo-router";
import { useConvexAuth } from "convex/react";
import { LogOut } from "lucide-react-native";
import {
  AccountActionsSheet,
  AccountAppearanceSheet,
  AccountGuestSummary,
  AccountLinkItem,
  AccountNotificationSheet,
  AccountProfileSummary,
  AccountSectionCard,
} from "@/components/account";
import { LanguageSheet } from "@/components/language/language-sheet";
import { authClient } from "@/lib/betterAuth/client";
import { usePurchases } from "@/contexts/purchases-context";
import { useAccountSections } from "@/hooks/use-account-sections";
import { useClearAppCache } from "@/hooks/use-clear-app-cache";
import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const mutedColor = useThemeColor("muted");
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { presentPaywall } = usePurchases();
  const { clearAppCache, isClearingCache } = useClearAppCache();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAccountActionsOpen, setIsAccountActionsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const { sections } = useAccountSections({
    onOpenAppearance: () => setIsAppearanceOpen(true),
    onOpenNotifications: () => setIsNotificationSheetOpen(true),
    onOpenLanguage: () => setIsLanguageOpen(true),
    onOpenAccountActions: () => setIsAccountActionsOpen(true),
    isAuthenticated,
  });
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );

  const handleSignOut = async () => {
    await authClient.signOut(
      {},
      {
        onRequest: () => {
          setIsSigningOut(true);
        },
        onSuccess: () => {
          setIsSigningOut(false);
        },
        onError: (ctx) => {
          setIsSigningOut(false);
          Alert.alert(
            t("alerts.error"),
            ctx.error.message || "Failed to sign out",
          );
        },
      },
    );
  };

  const handleClearCache = async () => {
    setIsAccountActionsOpen(false);

    try {
      await clearAppCache();
      Alert.alert(t("alerts.success"), t("alerts.clearCacheSuccess"));
    } catch (error) {
      console.error("Failed to clear app cache", error);
      Alert.alert(t("alerts.error"), t("alerts.clearCacheFailed"));
    }
  };

  const handleDeleteUser = async () => {
    await authClient.deleteUser(
      {},
      {
        onRequest: () => {
          setIsDeletingUser(true);
        },
        onSuccess: () => {
          setIsDeletingUser(false);
        },
        onError: (ctx) => {
          setIsDeletingUser(false);
          Alert.alert(
            t("alerts.error"),
            ctx.error.message || "Failed to delete user",
          );
        },
      },
    );
  };

  if (isAuthLoading || (isAuthenticated && userData === undefined)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView
        style={{
          flex: 1,
        }}
        edges={["top"]}
      >
        {/* <Header title="Account" showSettings={false} /> */}
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-4 py-4 gap-4"
          showsVerticalScrollIndicator={false}
        >
          {isAuthenticated && userData?.userMetadata ? (
            <AccountProfileSummary
              name={userData.profile?.name || t("account.profile.noName")}
              email={userData.userMetadata.email}
              credits={userData.profile?.credits ?? 0}
              isPremium={Boolean(userData.profile?.isPremium)}
              onBuyCredits={() => router.push("/(root)/(main)/buy-credits")}
              onShowSubscription={() => {
                void presentPaywall();
              }}
            />
          ) : (
            <AccountGuestSummary
              onLogin={() => router.push("/(root)/(auth)")}
            />
          )}

          {sections.map((section) => (
            <AccountSectionCard
              key={section.id}
              title={section.title}
              description={section.description || ""}
            >
              {section.items.map((item) => (
                <Fragment key={item.id}>
                  <AccountLinkItem
                    title={item.title}
                    description={item.description || ""}
                    icon={item.icon}
                    onPress={item.onPress}
                  />
                  {/* {index < section.items.length - 1 ? <Separator /> : null} */}
                </Fragment>
              ))}
            </AccountSectionCard>
          ))}

          {isAuthenticated ? (
            <Button
              variant="tertiary"
              isDisabled={isSigningOut}
              onPress={() => {
                Alert.alert(t("alerts.signOutTitle"), t("alerts.signOutBody"), [
                  {
                    text: t("alerts.cancel"),
                    style: "cancel",
                  },
                  {
                    text: t("account.actions.signOut"),
                    onPress: () => {
                      void handleSignOut();
                    },
                  },
                ]);
              }}
            >
              <View className="w-full flex-row items-center justify-center gap-3">
                {isSigningOut ? (
                  <Spinner size="sm" />
                ) : (
                  <LogOut size={18} color={mutedColor} />
                )}
                <View>
                  <Text className="text-md font-medium text-foreground">
                    {isSigningOut
                      ? t("account.actions.signingOut")
                      : t("account.actions.signOut")}
                  </Text>
                </View>
              </View>
            </Button>
          ) : null}
        </ScrollView>

        <AccountAppearanceSheet
          isOpen={isAppearanceOpen}
          onOpenChange={setIsAppearanceOpen}
        />
        {isAuthenticated ? (
          <AccountNotificationSheet
            isOpen={isNotificationSheetOpen}
            onOpenChange={setIsNotificationSheetOpen}
          />
        ) : null}
        <LanguageSheet
          isOpen={isLanguageOpen}
          onOpenChange={setIsLanguageOpen}
        />
        {isAuthenticated ? (
          <AccountActionsSheet
            isOpen={isAccountActionsOpen}
            onOpenChange={setIsAccountActionsOpen}
            isClearingCache={isClearingCache}
            isDeletingUser={isDeletingUser}
            onClearCache={() => {
              Alert.alert(
                t("alerts.clearCacheTitle"),
                t("alerts.clearCacheBody"),
                [
                  {
                    text: t("alerts.cancel"),
                    style: "cancel",
                  },
                  {
                    text: t("chat.clear"),
                    onPress: () => {
                      void handleClearCache();
                    },
                  },
                ],
              );
            }}
            onDeleteAccount={() => {
              Alert.alert(t("alerts.deleteTitle"), t("alerts.deleteBody"), [
                {
                  text: t("alerts.cancel"),
                  style: "cancel",
                },
                {
                  text: t("alerts.delete"),
                  style: "destructive",
                  onPress: () => {
                    void handleDeleteUser();
                  },
                },
              ]);
            }}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}
