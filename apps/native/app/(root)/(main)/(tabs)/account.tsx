import { Fragment } from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner } from "heroui-native";
import { api, useQuery } from "@dating-ai/backend";
import { useRouter } from "expo-router";
import { useConvexAuth } from "convex/react";
import {
  AccountActionsSheet,
  AccountAppearanceSheet,
  AccountGuestSummary,
  AccountLinkItem,
  AccountProfileSummary,
  AccountSectionCard,
} from "@/components/account";
import { LanguageSheet } from "@/components/language/language-sheet";
import { authClient } from "@/lib/betterAuth/client";
import { usePurchases } from "@/contexts/purchases-context";
import { useAccountSections } from "@/hooks/use-account-sections";
import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { presentPaywall } = usePurchases();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAccountActionsOpen, setIsAccountActionsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const { sections } = useAccountSections({
    onOpenAppearance: () => setIsAppearanceOpen(true),
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
          Alert.alert(t("alerts.error"), ctx.error.message || "Failed to sign out");
        },
      },
    );
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
        </ScrollView>

        <AccountAppearanceSheet
          isOpen={isAppearanceOpen}
          onOpenChange={setIsAppearanceOpen}
        />
        <LanguageSheet
          isOpen={isLanguageOpen}
          onOpenChange={setIsLanguageOpen}
        />
        {isAuthenticated ? (
          <AccountActionsSheet
            isOpen={isAccountActionsOpen}
            onOpenChange={setIsAccountActionsOpen}
            isSigningOut={isSigningOut}
            isDeletingUser={isDeletingUser}
            onSignOut={() => {
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
            onDeleteAccount={() => {
              Alert.alert(
                t("alerts.deleteTitle"),
                t("alerts.deleteBody"),
                [
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
                ],
              );
            }}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}
