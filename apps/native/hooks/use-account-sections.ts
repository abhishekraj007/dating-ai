import { api, useQuery } from "@dating-ai/backend";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  Bug,
  FileCheck,
  FileText,
  LifeBuoy,
  MessageCircleQuestion,
  Palette,
  Settings,
  Share2,
  Star,
} from "lucide-react-native";
import { Alert, Platform, Share } from "react-native";

const FALLBACK_ANDROID_APP_ID = "com.noosperai.quotes";

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

const appendBugTopic = (supportUrl: string) => {
  try {
    const parsed = new URL(supportUrl);
    parsed.searchParams.set("topic", "bug");
    return parsed.toString();
  } catch {
    return supportUrl;
  }
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
};

export const useAccountSections = ({
  onOpenAppearance,
}: UseAccountSectionsOptions) => {
  const router = useRouter();
  const runtimeConfig = useQuery(
    (api as any).features.appConfig.queries.getPublicAppConfig,
  ) as RuntimeAppConfig | undefined;

  const openExternal = async (url: string, fallbackMessage: string) => {
    if (!url) {
      Alert.alert("Link unavailable", fallbackMessage);
      return;
    }

    try {
      if (url.startsWith("http://") || url.startsWith("https://")) {
        await WebBrowser.openBrowserAsync(url);
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open link", "Please try again in a moment.");
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
            "Rating unavailable",
            "iOS App Store ID is not configured yet.",
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
      Alert.alert("Unable to open rating", "Please try again in a moment.");
    }
  };

  const shareApp = async () => {
    const shareUrl =
      runtimeConfig?.shareUrl ??
      process.env.EXPO_PUBLIC_APP_SHARE_URL ??
      process.env.EXPO_PUBLIC_CONVEX_SITE_URL ??
      "";

    if (!shareUrl) {
      Alert.alert("Share unavailable", "App share URL is not configured yet.");
      return;
    }

    try {
      await Share.share({
        message: `Check out Dating AI: ${shareUrl}`,
        url: shareUrl,
        title: "Dating AI",
      });
    } catch {
      Alert.alert("Unable to share", "Please try again in a moment.");
    }
  };

  const termsUrl = runtimeConfig?.termsUrl ?? buildFallbackUrl("/terms");
  const privacyUrl = runtimeConfig?.privacyUrl ?? buildFallbackUrl("/privacy");
  const helpCenterUrl =
    runtimeConfig?.helpCenterUrl ?? buildFallbackUrl("/help");
  const supportUrl = runtimeConfig?.supportUrl ?? buildFallbackUrl("/support");

  const sections: AccountSection[] = [
    {
      id: "quick-actions",
      title: "Quick Actions",
      items: [
        {
          id: "appearance",
          title: "Appearance",
          icon: Palette,
          onPress: onOpenAppearance,
        },
        {
          id: "settings",
          title: "Settings",
          icon: Settings,
          onPress: () => router.push("/(root)/(main)/settings"),
        },
        {
          id: "notifications",
          title: "Notifications",
          icon: Bell,
          onPress: () => router.push("/(root)/(main)/notifications"),
        },
      ],
    },
    {
      id: "support",
      title: "Support",
      description: "Help, troubleshooting, and contact options.",
      items: [
        {
          id: "help-center",
          title: "Help Center",
          description: "Read FAQs and product guidance.",
          icon: MessageCircleQuestion,
          onPress: () =>
            openExternal(
              helpCenterUrl,
              "Help Center URL is not configured yet.",
            ),
        },
        {
          id: "contact-support",
          title: "Contact Support",
          icon: LifeBuoy,
          onPress: () =>
            openExternal(supportUrl, "Support URL is not configured yet."),
        },
        {
          id: "report-bug",
          title: "Report a Bug",
          icon: Bug,
          onPress: () =>
            openExternal(
              appendBugTopic(supportUrl),
              "Bug report URL is not configured yet.",
            ),
        },
      ],
    },
    {
      id: "legal",
      title: "Legal",
      items: [
        {
          id: "terms",
          title: "Terms of Service",
          icon: FileText,
          onPress: () =>
            openExternal(termsUrl, "Terms URL is not configured yet."),
        },
        {
          id: "privacy",
          title: "Privacy Policy",
          icon: FileCheck,
          onPress: () =>
            openExternal(privacyUrl, "Privacy URL is not configured yet."),
        },
      ],
    },
    {
      id: "feedback",
      title: "Feedback",
      description: "Share your feedback and help us improve.",
      items: [
        {
          id: "rate-us",
          title: "Rate Us",
          icon: Star,
          onPress: openRateUs,
        },
        {
          id: "share-app",
          title: "Share App",
          icon: Share2,
          onPress: shareApp,
        },
      ],
    },
  ];

  return {
    sections,
  };
};
