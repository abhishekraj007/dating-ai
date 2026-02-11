import { Fragment } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Separator, Spinner } from "heroui-native";
import { api, useQuery } from "@dating-ai/backend";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { Header } from "@/components";
import {
  AccountAppearanceSheet,
  AccountLinkItem,
  AccountProfileSummary,
  AccountSectionCard,
} from "@/components/account";
import { authClient } from "@/lib/betterAuth/client";
import { usePurchases } from "@/contexts/purchases-context";
import { useAccountSections } from "@/hooks/use-account-sections";
import { useState } from "react";

export default function AccountScreen() {
  const router = useRouter();
  const { presentPaywall } = usePurchases();
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const { sections } = useAccountSections({
    onOpenAppearance: () => setIsAppearanceOpen(true),
  });
  const userData = useQuery(api.user.fetchUserAndProfile);

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
          Alert.alert("Error", ctx.error.message || "Failed to sign out");
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
          Alert.alert("Error", ctx.error.message || "Failed to delete user");
        },
      },
    );
  };

  if (!userData?.userMetadata) {
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
          <AccountProfileSummary
            name={userData.profile?.name || "No name set"}
            email={userData.userMetadata.email}
            credits={userData.profile?.credits ?? 0}
            isPremium={Boolean(userData.profile?.isPremium)}
            onBuyCredits={() => router.push("/(root)/(main)/buy-credits")}
            onShowSubscription={() => {
              void presentPaywall();
            }}
          />

          {sections.map((section) => (
            <AccountSectionCard
              key={section.id}
              title={section.title}
              description={section.description || ""}
            >
              {section.items.map((item, index) => (
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

          <AccountSectionCard title="Account">
            <Button
              variant="tertiary"
              isDisabled={isSigningOut}
              onPress={() => {
                Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Sign Out",
                    onPress: () => {
                      void handleSignOut();
                    },
                  },
                ]);
              }}
            >
              Sign Out
            </Button>

            <View className="mt-2">
              <Text className="text-base font-semibold text-danger">
                Danger Zone
              </Text>
              <Text className="text-xs text-muted">
                Once you delete your account, there is no going back.
              </Text>
              <Button
                className="mt-2"
                variant="danger"
                isDisabled={isDeletingUser}
                onPress={() => {
                  Alert.alert(
                    "Delete Account",
                    "Are you sure you want to permanently delete your account? This action cannot be undone.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          void handleDeleteUser();
                        },
                      },
                    ],
                  );
                }}
              >
                <Trash2 size={16} color="white" />
                <Text className="text-white font-medium">
                  {isDeletingUser ? "Deleting..." : "Delete Account"}
                </Text>
              </Button>
            </View>
          </AccountSectionCard>
        </ScrollView>

        <AccountAppearanceSheet
          isOpen={isAppearanceOpen}
          onOpenChange={setIsAppearanceOpen}
        />
      </SafeAreaView>
    </View>
  );
}
