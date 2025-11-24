import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { authComponent } from "./lib/betterAuth";

// Initialize the push notifications component
// Using string type for userId to work with Better Auth's user IDs
const pushNotifications = new PushNotifications<string>(
  components.pushNotifications,
  {
    logLevel: "DEBUG",
  }
);

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
