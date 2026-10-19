import { type AuthFunctions, createClient } from "@convex-dev/better-auth";
import { components, internal } from "../../_generated/api";
import type { DataModel, Id } from "../../_generated/dataModel";

/**
 * NOTE:
 * This authComponent is needed for integrating Convex with Better Auth,
 */

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  // verbose: isDevelopment(), // NOTE: if you want this or not?
  verbose: false, // NOTE: if you want this or not?
  triggers: {
    user: {
      onCreate: async (ctx, authUser) => {
        /**
         * NOTE:
         * The entire created document is available
         * In Better Auth 0.9+, we store the auth user ID in our profile table
         * instead of using the deprecated setUserId method
         */
        console.log("onCreate -> authUser", JSON.stringify(authUser, null, 2));
        await ctx.db.insert("profile", {
          name: authUser.name,
          authUserId: authUser._id,
          credits: 5,
          isPremium: false,
          email: authUser.email,
        });
      },
      onUpdate: async () =>
        // ctx,
        // oldUser,
        // newUser
        {
          /**
           * NOTE:
           * Both old and new documents are available
           */
        },
      onDelete: async (ctx, authUser) => {
        /**
         * NOTE:
         * The entire deleted document is available
         * Delete the user's profile data when the Better Auth user is being deleted
         */

        console.log("onDelete -> authUser", JSON.stringify(authUser, null, 2));

        const profile = await ctx.db
          .query("profile")
          .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUser._id))
          .unique();

        if (profile) {
          await ctx.db.delete(profile._id);
          console.log("Deleted profile for user:", authUser._id);
        }

        // Disconnect chat-channel links (e.g. Telegram) so a deleted account
        // stops receiving or sending messages on those channels.
        const channelLinks = await ctx.db
          .query("channelLinks")
          .withIndex("by_user", (q) => q.eq("userId", authUser._id))
          .take(50);

        for (const link of channelLinks) {
          await ctx.db.delete(link._id);
        }

        const channelThreads = await ctx.db
          .query("channelThreads")
          .withIndex("by_user", (q) => q.eq("userId", authUser._id))
          .take(50);

        for (const thread of channelThreads) {
          await ctx.db.delete(thread._id);
        }

        if (channelLinks.length > 0 || channelThreads.length > 0) {
          console.log(
            `Deleted ${channelLinks.length} channel links and ${channelThreads.length} channel threads for user:`,
            authUser._id,
          );
        }
      },
    },
  },
});
