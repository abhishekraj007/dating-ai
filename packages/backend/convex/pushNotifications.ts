import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { authComponent } from "./lib/betterAuth";
import { requireAdmin } from "./features/appConfig/guards";

// Initialize the push notifications component
// Using string type for userId to work with Better Auth's user IDs
const pushNotifications = new PushNotifications<string>(
  components.pushNotifications,
  {
    logLevel: "DEBUG",
  },
);

const BULK_PUSH_BATCH_SIZE = 100;

const adminAudienceStatsValidator = v.object({
  totalUsers: v.number(),
  registeredUsers: v.number(),
  pausedUsers: v.number(),
  eligibleUsers: v.number(),
});

async function getAdminPushAudienceStats(ctx: QueryCtx | MutationCtx): Promise<{
  totalUsers: number;
  registeredUsers: number;
  pausedUsers: number;
  eligibleUsers: number;
  eligibleUserIds: Array<string>;
}> {
  const profiles = await ctx.db.query("profile").collect();
  const uniqueUserIds: Array<string> = Array.from(
    new Set(profiles.map((profile) => profile.authUserId)),
  );

  const statuses = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const status = await pushNotifications.getStatusForUser(ctx, { userId });

      return {
        userId,
        hasToken: status.hasToken,
        paused: status.paused,
      };
    }),
  );

  const registeredUsers = statuses.filter((status) => status.hasToken).length;
  const pausedUsers = statuses.filter(
    (status) => status.hasToken && status.paused,
  ).length;
  const eligibleUserIds = statuses
    .filter((status) => status.hasToken && !status.paused)
    .map((status) => status.userId);

  return {
    totalUsers: uniqueUserIds.length,
    registeredUsers,
    pausedUsers,
    eligibleUsers: eligibleUserIds.length,
    eligibleUserIds,
  };
}

function buildAdminPushNotification(args: {
  title: string;
  body?: string;
  imageUrl?: string;
}) {
  const trimmedImageUrl = args.imageUrl?.trim();

  return {
    title: args.title,
    body: args.body,
    ...(trimmedImageUrl
      ? {
          data: {
            imageUrl: trimmedImageUrl,
            posterUrl: trimmedImageUrl,
          },
          mutableContent: true,
        }
      : {}),
  };
}

// Register a user's push notification token
export const recordPushNotificationToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    await pushNotifications.recordToken(ctx, {
      userId: user._id as string,
      pushToken: args.token,
    });
  },
});

export const setMyPushNotificationsEnabled = mutation({
  args: { enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    await ctx.runMutation(
      args.enabled
        ? components.pushNotifications.public.unpauseNotificationsForUser
        : components.pushNotifications.public.pauseNotificationsForUser,
      {
        logLevel: "DEBUG",
        userId: user._id as string,
      },
    );

    return null;
  },
});

// Send a push notification to a user
export const sendPushNotification = mutation({
  args: {
    to: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const pushId = await pushNotifications.sendPushNotification(ctx, {
      userId: args.to,
      notification: {
        title: args.title,
        body: args.body,
        data: args.data,
      },
    });

    return pushId;
  },
});

// Get push notification status for current user
export const getMyPushNotificationStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const status = await pushNotifications.getStatusForUser(ctx, {
      userId: user._id as string,
    });
    return status;
  },
});

export const adminLookupPushNotificationUser = query({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.object({
      authUserId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      isAdmin: v.boolean(),
      hasRegisteredToken: v.boolean(),
      notificationsEnabled: v.boolean(),
      notificationsPaused: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const exactEmail = args.email.trim();
    const normalizedEmail = exactEmail.toLowerCase();

    const profile =
      (await ctx.db
        .query("profile")
        .withIndex("by_email", (q) => q.eq("email", exactEmail))
        .unique()) ??
      (normalizedEmail !== exactEmail
        ? await ctx.db
            .query("profile")
            .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
            .unique()
        : null);

    if (!profile) {
      return null;
    }

    const status = await pushNotifications.getStatusForUser(ctx, {
      userId: profile.authUserId,
    });

    return {
      authUserId: profile.authUserId,
      email: profile.email,
      name: profile.name,
      isAdmin: profile.isAdmin === true,
      hasRegisteredToken: status.hasToken,
      notificationsEnabled: status.hasToken && !status.paused,
      notificationsPaused: status.paused,
    };
  },
});

export const adminGetPushAudienceStats = query({
  args: {},
  returns: adminAudienceStatsValidator,
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const { eligibleUserIds: _eligibleUserIds, ...stats } =
      await getAdminPushAudienceStats(ctx);

    return stats;
  },
});

export const adminSendPushNotification = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const pushId = await pushNotifications.sendPushNotification(ctx, {
      userId: args.userId,
      notification: buildAdminPushNotification(args),
    });

    return pushId;
  },
});

export const adminSendBulkPushNotification = mutation({
  args: {
    title: v.string(),
    body: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.object({
    totalUsers: v.number(),
    eligibleUsers: v.number(),
    queuedNotifications: v.number(),
    skippedUsers: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { eligibleUserIds, ...stats } = await getAdminPushAudienceStats(ctx);

    if (eligibleUserIds.length === 0) {
      return {
        totalUsers: stats.totalUsers,
        eligibleUsers: 0,
        queuedNotifications: 0,
        skippedUsers: stats.totalUsers,
      };
    }

    const notification = buildAdminPushNotification(args);
    let queuedNotifications = 0;

    for (
      let startIndex = 0;
      startIndex < eligibleUserIds.length;
      startIndex += BULK_PUSH_BATCH_SIZE
    ) {
      const batchUserIds = eligibleUserIds.slice(
        startIndex,
        startIndex + BULK_PUSH_BATCH_SIZE,
      );

      const batchResults = await pushNotifications.sendPushNotificationBatch(
        ctx,
        {
          notifications: batchUserIds.map((userId) => ({
            userId,
            notification,
          })),
          allowUnregisteredTokens: true,
        },
      );

      queuedNotifications += batchResults.filter(Boolean).length;
    }

    return {
      totalUsers: stats.totalUsers,
      eligibleUsers: stats.eligibleUsers,
      queuedNotifications,
      skippedUsers: stats.totalUsers - stats.eligibleUsers,
    };
  },
});

// Get notifications for current user
export const getMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const notifications = await pushNotifications.getNotificationsForUser(ctx, {
      userId: user._id as string,
      limit: args.limit,
    });
    return notifications;
  },
});

// Get notification status by ID
export const getNotification = query({
  args: {
    notificationId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const notification = await pushNotifications.getNotification(ctx, {
      id: args.notificationId,
    });
    return notification;
  },
});
