import { api, useQuery } from "@dating-ai/backend";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  FileCheck,
  FileText,
  LifeBuoy,
  MessageCircleQuestion,
  Palette,
  Settings,
  Share2,
  Star,
  UserRound,
} from "lucide-react-native";
import { Alert, Platform, Share } from "react-native";
import { useTranslation } from "@/hooks/use-translation";

const FALLBACK_ANDROID_APP_ID = "com.noosperai.datingai";

type RuntimeAppConfig = {
  baseWebUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
  helpCenterUrl?: string;
  supportUrl?: string;
  shareUrl?: string;
  iosAppStoreId?: string;
  androidAppId?: string;
};

const getFallbackBaseUrl = () => {
  const rawBase =
    process.env.EXPO_PUBLIC_LEGAL_BASE_URL ??
    process.env.EXPO_PUBLIC_CONVEX_SITE_URL ??
    "";

  return rawBase.replace(/\/$/, "");
};

const buildFallbackUrl = (path: string) => {
  const baseUrl = getFallbackBaseUrl();
  if (!baseUrl) {
    return "";
  }

  return `${baseUrl}${path}`;
};

type AccountActionItem = {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  onPress: () => void | Promise<void>;
};

export type AccountSection = {
  id: string;
  title: string;
  description?: string;
  items: AccountActionItem[];
};

type UseAccountSectionsOptions = {
  onOpenAppearance: () => void;
  onOpenNotifications: () => void;
  onOpenLanguage: () => void;
  onOpenAccountActions: () => void;
  isAuthenticated: boolean;
};

export const useAccountSections = ({
  onOpenAppearance,
  onOpenNotifications,
  onOpenLanguage,
  onOpenAccountActions,
  isAuthenticated,
}: UseAccountSectionsOptions) => {
  const router = useRouter();
  const { t } = useTranslation();
  const runtimeConfig = useQuery(
    (api as any).features.appConfig.queries.getPublicAppConfig,
  ) as RuntimeAppConfig | undefined;

  const openExternal = async (url: string, fallbackMessage: string) => {
    if (!url) {
      Alert.alert(t("alerts.linkUnavailable"), fallbackMessage);
      return;
    }

    try {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        await WebBrowser.openBrowserAsync(url);
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(t("alerts.unableOpenLink"), t("alerts.tryAgainMoment"));
    }
  };

  const openRateUs = async () => {
    try {
      if (Platform.OS === "ios") {
        const iosAppStoreId =
          runtimeConfig?.iosAppStoreId ??
          process.env.EXPO_PUBLIC_IOS_APP_STORE_ID;

        if (!iosAppStoreId) {
          Alert.alert(
            t("alerts.ratingUnavailable"),
            t("alerts.iosStoreMissing"),
          );
          return;
        }

        await Linking.openURL(
          `itms-apps://apps.apple.com/app/id${iosAppStoreId}?action=write-review`,
        );
        return;
      }

      const androidAppId =
        runtimeConfig?.androidAppId ?? FALLBACK_ANDROID_APP_ID;
      const marketUrl = `market://details?id=${androidAppId}`;
      const playStoreUrl = `https://play.google.com/store/apps/details?id=${androidAppId}`;

      try {
        await Linking.openURL(marketUrl);
      } catch {
        await Linking.openURL(playStoreUrl);
      }
    } catch (error) {
      console.log(error);
      Alert.alert(t("alerts.unableOpenRating"), t("alerts.tryAgainMoment"));
    }
  };

  const shareApp = async () => {
    const shareUrl =
      runtimeConfig?.shareUrl ??
      process.env.EXPO_PUBLIC_APP_SHARE_URL ??
      process.env.EXPO_PUBLIC_CONVEX_SITE_URL ??
      "";

    if (!shareUrl) {
      Alert.alert(t("alerts.shareUnavailable"), t("alerts.shareUrlMissing"));
      return;
    }

    try {
      await Share.share({
        message: `Check out Dating AI: ${shareUrl}`,
        url: shareUrl,
        title: "Dating AI",
      });
    } catch {
      Alert.alert(t("alerts.unableShare"), t("alerts.tryAgainMoment"));
    }
  };

  const termsUrl =
    runtimeConfig?.termsUrl ?? buildFallbackUrl("/dating-ai/terms");
  const privacyUrl =
    runtimeConfig?.privacyUrl ?? buildFallbackUrl("/dating-ai/privacy");
  const helpCenterUrl =
    runtimeConfig?.helpCenterUrl ?? buildFallbackUrl("/dating-ai/help");
  const supportUrl =
    runtimeConfig?.supportUrl ?? buildFallbackUrl("/dating-ai/support");

  const sections: AccountSection[] = [
    {
      id: "feedback",
      title: t("account.section.feedback"),
      items: [
        {
          id: "rate-us",
          title: t("account.item.rateUs"),
          icon: Star,
          onPress: openRateUs,
        },
        {
          id: "share-app",
          title: t("account.item.shareApp"),
          icon: Share2,
          onPress: shareApp,
        },
      ],
    },
    {
      id: "quick-actions",
      title: t("account.section.quickActions"),
      items: [
        {
          id: "appearance",
          title: t("account.item.appearance"),
          icon: Palette,
          onPress: onOpenAppearance,
        },
        {
          id: "notifications",
          title: t("account.item.notifications"),
          icon: Bell,
          onPress: isAuthenticated
            ? onOpenNotifications
            : () => router.push("/(root)/(auth)"),
        },
        {
          id: "language",
          title: t("account.item.language"),
          icon: Settings,
          onPress: onOpenLanguage,
        },
        ...(isAuthenticated
          ? [
              {
                id: "account-actions",
                title: t("account.item.account"),
                icon: UserRound,
                onPress: onOpenAccountActions,
              },
            ]
          : []),
      ],
    },
    {
      id: "support",
      title: t("account.section.support"),
      description: t("account.section.supportDescription"),
      items: [
        {
          id: "help-center",
          title: t("account.item.helpCenter"),
          icon: MessageCircleQuestion,
          onPress: () =>
            openExternal(helpCenterUrl, t("account.helpCenterMissing")),
        },
        {
          id: "contact-support",
          title: t("account.item.contactSupport"),
          icon: LifeBuoy,
          onPress: () => openExternal(supportUrl, t("account.supportMissing")),
        },
      ],
    },
    {
      id: "legal",
      title: t("account.section.legal"),
      items: [
        {
          id: "terms",
          title: t("account.item.terms"),
          icon: FileText,
          onPress: () => openExternal(termsUrl, t("account.termsMissing")),
        },
        {
          id: "privacy",
          title: t("account.item.privacy"),
          icon: FileCheck,
          onPress: () => openExternal(privacyUrl, t("account.privacyMissing")),
        },
      ],
    },
  ];

  return {
    sections,
  };
};
