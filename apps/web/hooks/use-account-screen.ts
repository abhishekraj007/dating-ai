"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { getSiteUrl } from "@/lib/site";

const LANGUAGE_STORAGE_KEY = "feelai.languagePreference";

type LanguagePreference = "auto" | "en";
type NotificationStatus = NotificationPermission | "unsupported";

function getUserIdentity(
  session: ReturnType<typeof authClient.useSession>["data"],
) {
  if (!session?.user) {
    return {
      name: "Account",
      email: "Signed in",
      initials: "A",
    };
  }

  const name = session.user.name || session.user.email || "Account";
  const email = session.user.email || "Signed in";
  const initialsSource = session.user.name || session.user.email || "A";
  const initials =
    initialsSource
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "A";

  return {
    name,
    email,
    initials,
  };
}

export function useAccountScreen() {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useConvexAuth();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const userData = useQuery(api.user.fetchUserAndProfile);
  const publicConfig = useQuery(api.features.appConfig.queries.getPublicAppConfig);
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [languagePreference, setLanguagePreference] = useState<LanguagePreference>("auto");
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>("unsupported");
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSigningOut, startSignOut] = useTransition();

  const identity = getUserIdentity(session);
  const isLoading =
    isAuthLoading ||
    isSessionPending ||
    userData === undefined ||
    publicConfig === undefined;
  const credits = userData?.profile?.credits ?? 0;
  const isPremium = Boolean(userData?.profile?.isPremium);
  const themePreference = theme === "light" || theme === "dark" ? theme : "system";
  const themeLabel =
    themePreference === "system"
      ? `System (${resolvedTheme === "light" ? "Light" : "Dark"})`
      : themePreference === "light"
        ? "Light"
        : "Dark";
  const languageLabel = languagePreference === "auto" ? "Auto" : "English";
  const notificationLabel =
    notificationStatus === "granted"
      ? "Enabled"
      : notificationStatus === "denied"
        ? "Blocked"
        : notificationStatus === "default"
          ? "Ask every time"
          : "Unavailable";
  const ratingLabel = selectedRating > 0 ? `${selectedRating}/5` : "Not rated";
  const helpCenterUrl = publicConfig?.helpCenterUrl ?? "/help";
  const supportUrl = publicConfig?.supportUrl ?? "/support";
  const privacyUrl = publicConfig?.privacyUrl ?? "/privacy";
  const termsUrl = publicConfig?.termsUrl ?? "/terms";
  const shareUrl = publicConfig?.shareUrl ?? getSiteUrl();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedPreference = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const nextPreference = storedPreference === "en" ? "en" : "auto";

    setLanguagePreference(nextPreference);

    const browserLanguage = navigator.language?.split("-")[0] ?? "en";
    document.documentElement.lang =
      nextPreference === "auto" ? browserLanguage : nextPreference;

    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
      return;
    }

    setNotificationStatus(Notification.permission);
  }, []);

  const openResolvedUrl = (url: string) => {
    if (typeof window === "undefined") {
      router.push(url);
      return;
    }

    const destination = new URL(url, window.location.origin);

    if (destination.origin === window.location.origin) {
      router.push(`${destination.pathname}${destination.search}${destination.hash}`);
      return;
    }

    window.open(destination.toString(), "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    const shareData = {
      title: "FeelAI",
      text: "Check out FeelAI.",
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied to clipboard.");
    } catch {
      toast.error("Unable to share right now.");
    }
  };

  const handleThemeChange = (nextTheme: "light" | "dark" | "system") => {
    setTheme(nextTheme);
    toast.success(`Theme updated to ${nextTheme}.`);
  };

  const handleLanguageChange = (nextPreference: LanguagePreference) => {
    setLanguagePreference(nextPreference);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextPreference);

      const browserLanguage = navigator.language?.split("-")[0] ?? "en";
      document.documentElement.lang =
        nextPreference === "auto" ? browserLanguage : nextPreference;
    }

    toast.success(
      nextPreference === "auto"
        ? "Language preference set to automatic."
        : "Language preference set to English.",
    );
  };

  const requestNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser notifications are not supported here.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);

    if (permission === "granted") {
      toast.success("Notifications enabled.");
      return;
    }

    if (permission === "denied") {
      toast.error("Notifications were blocked in your browser settings.");
      return;
    }

    toast.info("Notification permission was dismissed.");
  };

  const sendTestNotification = () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser notifications are not supported here.");
      return;
    }

    if (Notification.permission !== "granted") {
      toast.error("Enable notifications first.");
      return;
    }

    new Notification("FeelAI notifications are enabled", {
      body: "You will see chat and account updates here when web notifications are available.",
    });

    toast.success("Test notification sent.");
  };

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      toast.info("Choose a rating first.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("feelai.rating", String(selectedRating));
    }

    setIsRateDialogOpen(false);

    if (selectedRating >= 4) {
      toast.success("Thanks for the rating. Sharing helps more people discover FeelAI.");
      await handleShare();
      return;
    }

    toast.info("Thanks for the feedback. You can contact support with any issue.");
    openResolvedUrl(supportUrl);
  };

  const handleSignOut = () => {
    startSignOut(async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    });
  };

  return {
    credits,
    handleLanguageChange,
    handleShare,
    handleSignOut,
    handleSubmitRating,
    handleThemeChange,
    identity,
    isAccountDetailsOpen,
    isAppearanceOpen,
    isCreditsOpen,
    isLanguageOpen,
    isLoading,
    isNotificationsOpen,
    isPremium,
    isPremiumOpen,
    isRateDialogOpen,
    isSigningOut,
    languageLabel,
    languagePreference,
    notificationLabel,
    notificationStatus,
    openHelpCenter: () => openResolvedUrl(helpCenterUrl),
    openPrivacyPolicy: () => openResolvedUrl(privacyUrl),
    openSupport: () => openResolvedUrl(supportUrl),
    openTermsOfService: () => openResolvedUrl(termsUrl),
    ratingLabel,
    requestNotifications,
    session,
    selectedRating,
    sendTestNotification,
    setIsAccountDetailsOpen,
    setIsAppearanceOpen,
    setIsCreditsOpen,
    setIsLanguageOpen,
    setIsNotificationsOpen,
    setIsPremiumOpen,
    setIsRateDialogOpen,
    setSelectedRating,
    themeLabel,
    themePreference,
  };
}