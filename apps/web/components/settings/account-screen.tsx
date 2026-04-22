"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChevronRight,
  Coins,
  Crown,
  FileCheck2,
  FileText,
  HelpCircle,
  Languages,
  LogOut,
  MailQuestion,
  Monitor,
  Palette,
  Settings2,
  Share2,
  Star,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditsModal } from "@/components/credits-modal";
import { PremiumSubscriptionModal } from "@/components/premium-subscription-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountScreen } from "@/hooks/use-account-screen";
import { cn } from "@/lib/utils";

type ActionRowProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: "default" | "destructive";
  value?: string;
};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[2rem] bg-card/90 py-5 shadow-[0_24px_48px_-34px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
      <CardHeader className="gap-1 px-5">
        <CardTitle className="text-balance text-2xl font-semibold tracking-tight">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-pretty text-base">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="px-5">{children}</CardContent>
    </Card>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  value,
}: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-16 w-full items-center justify-between rounded-[1.75rem] bg-muted/60 px-5 text-left transition-[transform,background-color,color,box-shadow] active:scale-[0.96]",
        tone === "destructive"
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted",
      )}
    >
      <div className="flex items-center gap-4">
        <Icon className={cn("size-5", tone === "destructive" ? "text-destructive" : "text-muted-foreground")} />
        <div>
          <div className="text-xl font-medium tracking-tight">{label}</div>
          {value ? (
            <div className="mt-0.5 text-sm text-muted-foreground">{value}</div>
          ) : null}
        </div>
      </div>
      <ChevronRight className={cn("size-5", tone === "destructive" ? "text-destructive/70" : "text-muted-foreground")} />
    </button>
  );
}

function ThemeOptionButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-20 flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-border/70 px-4 py-3 text-sm font-medium transition-[transform,background-color,color,box-shadow] active:scale-[0.96]",
        active
          ? "bg-primary text-primary-foreground shadow-[0_20px_36px_-28px_rgba(0,0,0,0.85)]"
          : "bg-muted/55 text-foreground hover:bg-muted",
      )}
    >
      <Icon className="size-5" />
      <span>{label}</span>
    </button>
  );
}

function AccountScreenSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <Card className="rounded-[2rem] py-5">
        <CardContent className="space-y-6 px-5">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-4 w-52 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-16 rounded-[1.5rem]" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded-full" />
            <Skeleton className="h-12 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="rounded-[2rem] py-5">
          <CardContent className="space-y-3 px-5">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-16 rounded-[1.75rem]" />
            <Skeleton className="h-16 rounded-[1.75rem]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AccountScreen() {
  const {
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
    openHelpCenter,
    openPrivacyPolicy,
    openSupport,
    openTermsOfService,
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
  } = useAccountScreen();

  if (isLoading) {
    return <AccountScreenSkeleton />;
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 pb-28 md:px-8 md:py-10 md:pb-10">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Account
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Manage your FeelAI profile and mobile shortcuts.
          </h1>
        </div>

        <Card className="rounded-[2rem] bg-card/95 py-5 shadow-[0_28px_54px_-34px_rgba(0,0,0,0.9)] ring-1 ring-white/5">
          <CardContent className="space-y-6 px-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 ring-1 ring-white/10">
                {session?.user.image ? (
                  <AvatarImage alt={identity.name} src={session.user.image} />
                ) : null}
                <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                  {identity.initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-3xl font-semibold tracking-tight">
                  {identity.name}
                </p>
                <p className="truncate text-lg text-muted-foreground">
                  {identity.email}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[1.75rem] bg-muted/55 px-4 py-4 shadow-[0_14px_30px_-28px_rgba(0,0,0,0.9)]">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Coins className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">Current credits</p>
                  <p className="text-xs text-muted-foreground/80">Available for chats and selfies</p>
                </div>
              </div>
              <span className="text-2xl font-semibold tabular-nums">{credits}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-full text-sm font-medium"
                onClick={() => setIsCreditsOpen(true)}
              >
                Buy Credits
              </Button>
              {isPremium ? (
                <Button
                  variant="secondary"
                  className="h-12 rounded-full text-sm font-medium"
                >
                  Premium Active
                </Button>
              ) : (
                <Button
                  className="h-12 rounded-full text-sm font-medium"
                  onClick={() => setIsPremiumOpen(true)}
                >
                  <Crown className="size-4" />
                  Get Premium
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <SectionCard title="Feedback">
          <div className="space-y-3 border-t border-border/70 pt-5">
            <ActionRow
              icon={Star}
              label="Rate Us"
              onClick={() => setIsRateDialogOpen(true)}
              value={ratingLabel}
            />
            <ActionRow icon={Share2} label="Share App" onClick={handleShare} />
          </div>
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="space-y-3 border-t border-border/70 pt-5">
            <ActionRow
              icon={Palette}
              label="Appearance"
              onClick={() => setIsAppearanceOpen(true)}
              value={themeLabel}
            />
            <ActionRow
              icon={Bell}
              label="Notifications"
              onClick={() => setIsNotificationsOpen(true)}
              value={notificationLabel}
            />
            <ActionRow
              icon={Languages}
              label="Language"
              onClick={() => setIsLanguageOpen(true)}
              value={languageLabel}
            />
            <ActionRow
              icon={Settings2}
              label="Account"
              onClick={() => setIsAccountDetailsOpen(true)}
              value={isPremium ? "Premium Member" : "Free Plan"}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Support"
          description="Help, troubleshooting, and contact options."
        >
          <div className="space-y-3 border-t border-border/70 pt-5">
            <ActionRow
              icon={HelpCircle}
              label="FAQ & Help Center"
              onClick={openHelpCenter}
            />
            <ActionRow
              icon={MailQuestion}
              label="Contact Support"
              onClick={openSupport}
            />
          </div>
        </SectionCard>

        <SectionCard title="Legal">
          <div className="space-y-3 border-t border-border/70 pt-5">
            <ActionRow
              icon={FileText}
              label="Terms of Service"
              onClick={openTermsOfService}
            />
            <ActionRow
              icon={FileCheck2}
              label="Privacy Policy"
              onClick={openPrivacyPolicy}
            />
          </div>
        </SectionCard>

        <Button
          variant="secondary"
          className="min-h-16 rounded-full text-lg font-medium"
          onClick={handleSignOut}
        >
          <LogOut className="size-5" />
          {isSigningOut ? "Signing Out..." : "Sign Out"}
        </Button>
      </div>

      <CreditsModal open={isCreditsOpen} onOpenChange={setIsCreditsOpen} />
      <PremiumSubscriptionModal
        open={isPremiumOpen}
        onOpenChange={setIsPremiumOpen}
      />

      <Dialog open={isAppearanceOpen} onOpenChange={setIsAppearanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appearance</DialogTitle>
            <DialogDescription>
              Choose how FeelAI looks across the web app.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <ThemeOptionButton
              active={themePreference === "light"}
              icon={Palette}
              label="Light"
              onClick={() => handleThemeChange("light")}
            />
            <ThemeOptionButton
              active={themePreference === "dark"}
              icon={Palette}
              label="Dark"
              onClick={() => handleThemeChange("dark")}
            />
            <ThemeOptionButton
              active={themePreference === "system"}
              icon={Monitor}
              label="System"
              onClick={() => handleThemeChange("system")}
            />
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
              Control browser notification access for future chat and account updates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-[1.5rem] bg-muted/55 p-4">
              <div className="text-sm text-muted-foreground">Current status</div>
              <div className="mt-1 text-lg font-semibold">{notificationLabel}</div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={requestNotifications}>Enable notifications</Button>
              <Button variant="outline" onClick={sendTestNotification}>
                Send test notification
              </Button>
            </div>
            {notificationStatus === "denied" ? (
              <p className="text-sm text-muted-foreground">
                Notifications are blocked in your browser settings. Re-enable them there and come back to test again.
              </p>
            ) : null}
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog open={isLanguageOpen} onOpenChange={setIsLanguageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Language</DialogTitle>
            <DialogDescription>
              Pick how FeelAI should set your browser language preference on web.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={languagePreference} onValueChange={(value) => handleLanguageChange(value as "auto" | "en") }>
              <SelectTrigger className="w-full rounded-[1.25rem]">
                <SelectValue placeholder="Choose language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              More languages can be layered on top of this preference without changing your saved setting later.
            </p>
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog open={isAccountDetailsOpen} onOpenChange={setIsAccountDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account details</DialogTitle>
            <DialogDescription>
              Review your current plan, credits, and account identity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-[1.5rem] bg-muted/55 p-4">
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="mt-1 text-lg font-semibold">{identity.name}</div>
            </div>
            <div className="rounded-[1.5rem] bg-muted/55 p-4">
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="mt-1 text-lg font-semibold">{identity.email}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.5rem] bg-muted/55 p-4">
                <div className="text-sm text-muted-foreground">Plan</div>
                <div className="mt-1 text-lg font-semibold">
                  {isPremium ? "Premium" : "Free"}
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-muted/55 p-4">
                <div className="text-sm text-muted-foreground">Credits</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">{credits}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreditsOpen(true)}>
              Buy credits
            </Button>
            {!isPremium ? (
              <Button onClick={() => setIsPremiumOpen(true)}>Get premium</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate FeelAI</DialogTitle>
            <DialogDescription>
              A quick rating helps us prioritize what to improve next.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-2">
            {Array.from({ length: 5 }).map((_, index) => {
              const rating = index + 1;
              const isActive = rating <= selectedRating;

              return (
                <button
                  key={rating}
                  type="button"
                  aria-label={`Rate ${rating} out of 5`}
                  onClick={() => setSelectedRating(rating)}
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full border border-border/70 transition-[transform,background-color,color] active:scale-[0.96]",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/55 text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Star className={cn("size-5", isActive && "fill-current")} />
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" asChild>
              <Link href="/help">Need help instead?</Link>
            </Button>
            <Button onClick={handleSubmitRating}>Submit rating</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}