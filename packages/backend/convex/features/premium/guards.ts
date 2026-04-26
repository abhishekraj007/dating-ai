import * as Users from "../../model/user";

type PremiumAccessSnapshot =
  | {
      isPremium: true;
      grantedBy: "lifetime" | "manual" | "subscription";
      expiresAt?: number;
      platform?: string;
      reason?: string;
    }
  | {
      isPremium: false;
      reason: string;
    };

/**
 * Returns the authenticated user's current premium status without mutating data.
 */
export async function getPremiumAccessSnapshot(
  ctx: any,
): Promise<PremiumAccessSnapshot> {
  const userData = await Users.getUserAndProfile(ctx);
  if (!userData) {
    return { isPremium: false, reason: "Not authenticated" };
  }

  const profile = userData.profile;
  const now = Date.now();

  if (profile?.isPremium) {
    if (profile.premiumGrantedBy === "lifetime") {
      return { isPremium: true, grantedBy: "lifetime" };
    }

    if (profile.premiumGrantedBy === "manual") {
      if (profile.premiumExpiresAt && profile.premiumExpiresAt < now) {
        return { isPremium: false, reason: "Manual grant expired" };
      }

      return {
        isPremium: true,
        grantedBy: "manual",
        expiresAt: profile.premiumExpiresAt,
      };
    }

    if (profile.premiumGrantedBy === "subscription") {
      return { isPremium: true, grantedBy: "subscription" };
    }
  }

  const activeSubscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_user_status", (q: any) =>
      q.eq("userId", userData.userMetadata._id).eq("status", "active"),
    )
    .first();

  if (activeSubscription) {
    return {
      isPremium: true,
      grantedBy: "subscription",
      platform: activeSubscription.platform,
    };
  }

  return { isPremium: false, reason: "No active subscription or grant" };
}

/**
 * Helper to check if current user is admin
 * TODO: Implement proper admin role checking based on your auth system
 */
export async function isAdmin(ctx: any): Promise<boolean> {
  const userData = await Users.getUserAndProfile(ctx);
  if (!userData) return false;

  // TODO: Replace with actual admin check
  // Option 1: Check against admin user IDs from env
  // const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  // return adminIds.includes(userData.userMetadata._id);

  // Option 2: Check role field in profile
  // return userData.profile?.role === 'admin';

  // For now, return false - YOU MUST IMPLEMENT THIS
  return false;
}

/**
 * Server-side guard to enforce premium access
 * Call this at the start of any premium-gated mutation/query
 * Throws error if user is not premium
 */
export async function requirePremium(ctx: any): Promise<void> {
  const userData = await Users.getUserAndProfile(ctx);
  if (!userData) {
    throw new Error("Authentication required");
  }

  const premiumState = await getPremiumAccessSnapshot(ctx);
  if (premiumState.isPremium) {
    return;
  }

  // No premium access - throw error
  throw new Error("Premium access required. Please upgrade your account.");
}
