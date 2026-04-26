"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { Lock } from "lucide-react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import type { Id } from "@dating-ai/backend/convex/_generated/dataModel";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { PremiumSubscriptionModal } from "@/components/premium-subscription-modal";

type PremiumProfileImageProps = {
  imageKey?: string | null;
  alt: string;
  fallbackText: string;
  sizes: string;
  priority?: boolean;
  profileId: string;
  placeholderImageUrl: string;
  profileName: string;
};

function buildPathWithUpgradeFlag(
  pathname: string,
  searchParams: URLSearchParams | null,
) {
  const nextParams = new URLSearchParams(searchParams?.toString());
  nextParams.set("upgrade", "premium");
  const nextQuery = nextParams.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function buildPathWithoutUpgradeFlag(
  pathname: string,
  searchParams: URLSearchParams | null,
) {
  const nextParams = new URLSearchParams(searchParams?.toString());
  nextParams.delete("upgrade");
  const nextQuery = nextParams.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

export function PremiumProfileImage({
  imageKey,
  alt,
  fallbackText,
  sizes,
  priority = false,
  profileId,
  placeholderImageUrl,
  profileName,
}: PremiumProfileImageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { open } = useAuthModal();
  const premiumState = useQuery(api.features.premium.queries.isPremium);
  const resolvedImageUrl = useQuery(
    api.features.ai.queries.getProfileImageUrl,
    isAuthenticated && premiumState?.isPremium && imageKey
      ? {
          profileId: profileId as Id<"aiProfiles">,
          imageKey,
        }
      : "skip",
  );
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);

  const isPremium = Boolean(premiumState?.isPremium);
  const isLocked = !isAuthenticated || !isPremium;
  const searchParamsString = searchParams?.toString() ?? "";

  const upgradeReturnTo = useMemo(
    () => buildPathWithUpgradeFlag(pathname, searchParams),
    [pathname, searchParamsString],
  );

  useEffect(() => {
    if (!searchParams?.get("upgrade") || isLoading || !isAuthenticated) {
      return;
    }

    if (!isPremium) {
      setIsPremiumOpen(true);
    }

    router.replace(buildPathWithoutUpgradeFlag(pathname, searchParams), {
      scroll: false,
    });
  }, [
    isAuthenticated,
    isLoading,
    isPremium,
    pathname,
    router,
    searchParams,
    searchParamsString,
  ]);

  const handleLockedClick = () => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      open(upgradeReturnTo);
      return;
    }

    setIsPremiumOpen(true);
  };

  if (!imageKey) {
    return (
      <div className="flex h-full items-center justify-center bg-muted text-6xl font-semibold text-muted-foreground">
        {fallbackText}
      </div>
    );
  }

  if (!isLocked && !resolvedImageUrl) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }

  const displayImageUrl = isLocked ? placeholderImageUrl : resolvedImageUrl;

  return (
    <>
      {isLocked ? (
        <button
          type="button"
          onClick={handleLockedClick}
          className="group relative h-full w-full overflow-hidden text-left cursor-pointer"
        >
          <Image
            alt={alt}
            className="object-cover scale-[1.03] blur-2xl saturate-75 transition-transform duration-300 group-hover:scale-[1.06]"
            fill
            priority={priority}
            sizes={sizes}
            src={displayImageUrl!}
            unoptimized
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/92 text-foreground shadow-lg">
              <Lock className="h-5 w-5" />
            </div>
            <div className="rounded-full bg-background/95 px-4 py-2 text-xs font-medium text-foreground shadow-lg">
              {!isAuthenticated
                ? "Sign in to unlock Gallery"
                : "Go premium to unlock Gallery"}
            </div>
          </div>
        </button>
      ) : (
        <Image
          alt={alt}
          className="object-cover"
          fill
          priority={priority}
          sizes={sizes}
          src={displayImageUrl!}
          unoptimized
        />
      )}

      <PremiumSubscriptionModal
        open={isPremiumOpen}
        onOpenChange={setIsPremiumOpen}
        title={`Unlock ${profileName}`}
        description="Upgrade to premium to view every showcase photo clearly and unlock the full profile gallery."
      />
    </>
  );
}
