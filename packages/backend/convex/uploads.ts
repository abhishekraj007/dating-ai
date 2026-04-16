import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { R2, type R2Callbacks } from "@convex-dev/r2";
import { authComponent } from "./lib/betterAuth";
import { rateLimiter } from "./lib/rateLimit";
import {
  getUserStorageQuota,
  validateUploadMetadata,
} from "./lib/uploadValidation";

// Initialize the R2 component
export const r2 = new R2(components.r2);

// Callbacks for the R2 client API
const callbacks: R2Callbacks = internal.uploads;

// Custom generateUploadUrl that embeds userId in the key
export const generateUploadUrlWithUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }
    await rateLimiter.limit(ctx, "uploadUrlMint", {
      key: user._id,
      throws: true,
    });
    // Create a key with userId prefix so we can extract it later
    const key = `${user._id}/${crypto.randomUUID()}`;
    return await r2.generateUploadUrl(key);
  },
});

// Generate the client API with upload callbacks
export const { generateUploadUrl, syncMetadata, onSyncMetadata } = r2.clientApi(
  {
    callbacks,
    checkUpload: async (ctx, _bucket) => {
      // Verify the user is authenticated before allowing upload
      const user = await authComponent.safeGetAuthUser(ctx as any);
      if (!user) {
        throw new Error("Not authenticated");
      }
      // Rate-limit public upload URL minting (the @convex-dev/r2 default key
      // is a random UUID, so we can only gate this by user here).
      await rateLimiter.limit(ctx as any, "uploadUrlMint", {
        key: user._id,
        throws: true,
      });
    },
    onSyncMetadata: async (ctx, args) => {
      // This runs after metadata sync, so r2.getMetadata will work.
      // args: { bucket: string; key: string; isNew: boolean }
      const metadata = await r2.getMetadata(ctx, args.key);

      if (!metadata) {
        console.error("No metadata found for key:", args.key);
        return;
      }

      // --- MIME + size validation ---------------------------------------
      const invalidReason = validateUploadMetadata(
        metadata.contentType,
        metadata.size,
      );
      if (invalidReason) {
        console.warn(
          `[onSyncMetadata] rejecting upload ${args.key}: ${invalidReason}`,
        );
        try {
          await r2.deleteObject(ctx, args.key);
        } catch (err) {
          console.error(
            `[onSyncMetadata] failed to delete invalid upload ${args.key}:`,
            err,
          );
        }
        return;
      }

      // --- Routing: internal keys ---------------------------------------
      // AI generation stores showcase/avatar images under this prefix BEFORE
      // the aiProfiles row exists. The profile generation flow itself patches
      // the profile record with these keys — we must NOT try to do so here
      // (parts[1] is the jobId, not a valid v.id("aiProfiles")).
      if (args.key.startsWith("aiProfiles/generated/")) {
        return;
      }

      // --- Routing: admin-initiated aiProfiles uploads ------------------
      // Format: aiProfiles/{profileId}/{avatar|gallery}/{uuid}
      // Require a matching `pendingAdminUploads` row (defense-in-depth so
      // no future caller can spoof this prefix to hijack a profile avatar).
      if (args.key.startsWith("aiProfiles/")) {
        await ctx.runMutation(internal.uploads.applyAdminProfileImage, {
          key: args.key,
        });
        return;
      }

      // --- Routing: chat image keys -------------------------------------
      // `chatImages/{userId}/{profileId}/{requestId}.{ext}` are written by
      // internal generation actions via `r2.store`. They are tracked via the
      // `chatImages` table, not the generic `uploads` table, and their quota
      // is covered by the credit charge.
      if (args.key.startsWith("chatImages/")) {
        return;
      }

      // --- Routing: user-owned uploads ----------------------------------
      // Format: {userId}/{uuid}
      const userId = args.key.split("/")[0];
      if (!userId) {
        console.error("No userId found in key:", args.key);
        try {
          await r2.deleteObject(ctx, args.key);
        } catch {
          /* swallow */
        }
        return;
      }

      await ctx.runMutation(internal.uploads.createUploadRecord, {
        key: args.key,
        userId,
        contentType: metadata.contentType || "application/octet-stream",
        contentLength: metadata.size || 0,
      });
    },
  },
);

/**
 * Internal mutation: apply an admin-initiated AI profile image upload.
 * Requires a matching non-expired `pendingAdminUploads` row.
 * Deletes the R2 object if no ticket exists.
 */
export const applyAdminProfileImage = internalMutation({
  args: { key: v.string() },
  returns: v.null(),
  handler: async (ctx, { key }) => {
    const ticket = await ctx.db
      .query("pendingAdminUploads")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (!ticket || ticket.expiresAt < Date.now()) {
      console.warn(
        `[applyAdminProfileImage] rejecting key without valid admin ticket: ${key}`,
      );
      try {
        await r2.deleteObject(ctx, key);
      } catch (err) {
        console.error(
          `[applyAdminProfileImage] failed to delete orphan: ${key}`,
          err,
        );
      }
      return null;
    }

    // Verify profile still exists and is an admin-editable (non user-created) row
    const profile = await ctx.db.get(ticket.profileId);
    if (!profile || profile.isUserCreated) {
      console.warn(
        `[applyAdminProfileImage] stale ticket: profile missing or user-created: ${ticket.profileId}`,
      );
      await ctx.db.delete(ticket._id);
      try {
        await r2.deleteObject(ctx, key);
      } catch {
        /* swallow */
      }
      return null;
    }

    if (ticket.type === "avatar") {
      await ctx.db.patch(ticket.profileId, { avatarImageKey: key });
    } else {
      const currentKeys = profile.profileImageKeys ?? [];
      if (currentKeys.length >= 10) {
        console.warn(
          `[applyAdminProfileImage] gallery limit reached for profile ${ticket.profileId}; deleting upload`,
        );
        try {
          await r2.deleteObject(ctx, key);
        } catch {
          /* swallow */
        }
      } else {
        await ctx.db.patch(ticket.profileId, {
          profileImageKeys: [...currentKeys, key],
        });
      }
    }

    // Ticket consumed — delete regardless of outcome
    await ctx.db.delete(ticket._id);
    return null;
  },
});

// Mutation to associate an upload with the current user.
// Only the user owning the key prefix may associate the upload; this blocks
// one user from claiming another user's orphan row.
export const associateUpload = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Enforce ownership by key prefix. Our key format for user uploads is
    // `{userId}/{uuid}` — any other shape is not associable by a user.
    if (!args.key.startsWith(`${user._id}/`)) {
      throw new Error("Not authorized for this key");
    }

    // Get metadata from R2
    const metadata = await r2.getMetadata(ctx, args.key);
    if (!metadata) {
      throw new Error("File not found in R2");
    }

    // Check if record already exists
    const existing = await ctx.db
      .query("uploads")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      // Idempotent: if already ours, nothing to do.
      if (existing.userId === user._id) return;
      // Someone else owns the row — do NOT overwrite.
      throw new Error("Upload already associated with another user");
    }

    // Create new record via the internal mutation so we share the quota code path.
    await ctx.runMutation(internal.uploads.createUploadRecord, {
      key: args.key,
      userId: user._id,
      contentType: metadata.contentType || "application/octet-stream",
      contentLength: metadata.size || 0,
    });
  },
});

/**
 * Internal mutation to create upload records.
 * Enforces per-user storage quota and upload count limit.
 * Deletes the R2 object and rejects if the user is over quota.
 */
export const createUploadRecord = internalMutation({
  args: {
    key: v.string(),
    userId: v.string(),
    contentType: v.string(),
    contentLength: v.number(),
    isNew: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Idempotency: if a row already exists for this key, don't double-insert.
    const existing = await ctx.db
      .query("uploads")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) return null;

    // Look up the user's profile to enforce quota.
    const userProfile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.userId))
      .unique();

    const quota = getUserStorageQuota(userProfile?.isPremium);
    const currentBytes = userProfile?.storageBytesUsed ?? 0;
    const currentCount = userProfile?.uploadCount ?? 0;

    // Hard per-user limits: storage bytes + file count.
    const exceedsBytes = currentBytes + args.contentLength > quota;
    const exceedsCount = currentCount >= 500;
    if (exceedsBytes || exceedsCount) {
      console.warn(
        `[createUploadRecord] quota exceeded for user ${args.userId}: ` +
          `bytesUsed=${currentBytes}, incoming=${args.contentLength}, quota=${quota}, count=${currentCount}`,
      );
      try {
        await r2.deleteObject(ctx, args.key);
      } catch (err) {
        console.error(
          `[createUploadRecord] failed to delete over-quota upload ${args.key}:`,
          err,
        );
      }
      return null;
    }

    await ctx.db.insert("uploads", {
      key: args.key,
      userId: args.userId,
      contentType: args.contentType,
      contentLength: args.contentLength,
      uploadedAt: Date.now(),
    });

    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        storageBytesUsed: currentBytes + args.contentLength,
        uploadCount: currentCount + 1,
      });
    }

    return null;
  },
});

// Query to list user's uploads
export const listUserUploads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const uploads = await ctx.db
      .query("uploads")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 50);

    // Generate URLs for each upload
    return Promise.all(
      uploads.map(async (upload) => {
        try {
          const url = upload.key ? await r2.getUrl(upload.key) : null;
          return {
            ...upload,
            url,
          };
        } catch (error) {
          console.error("Error getting URL for upload:", upload.key, error);
          return {
            ...upload,
            url: null,
          };
        }
      }),
    );
  },
});

// Get a single upload with URL
export const getUpload = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const upload = await ctx.db
      .query("uploads")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!upload || upload.userId !== user._id) {
      return null;
    }

    return {
      ...upload,
      url: await r2.getUrl(upload.key),
    };
  },
});

// Delete an upload
export const deleteUpload = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const upload = await ctx.db
      .query("uploads")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!upload || upload.userId !== user._id) {
      throw new Error("Upload not found");
    }

    // Delete from R2
    await r2.deleteObject(ctx, args.key);

    // Delete from database
    await ctx.db.delete(upload._id);

    // Decrement quota counters for the owning user.
    const userProfile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user._id))
      .unique();
    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        storageBytesUsed: Math.max(
          0,
          (userProfile.storageBytesUsed ?? 0) - upload.contentLength,
        ),
        uploadCount: Math.max(0, (userProfile.uploadCount ?? 0) - 1),
      });
    }
  },
});

// Note: the old `updateAIProfileImage` internalMutation was replaced by
// `applyAdminProfileImage` above, which additionally requires a matching
// `pendingAdminUploads` row and enforces non-user-created profiles.

/**
 * Internal mutation: delete an expired `pendingAdminUploads` row and its R2
 * object (if still present). Used by the cron cleanup job.
 */
export const gcExpiredAdminUploads = internalMutation({
  args: { limit: v.optional(v.number()) },
  returns: v.number(),
  handler: async (ctx, { limit }) => {
    const cap = Math.min(Math.max(limit ?? 50, 1), 200);
    const now = Date.now();
    const rows = await ctx.db
      .query("pendingAdminUploads")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", now))
      .take(cap);
    for (const row of rows) {
      try {
        await r2.deleteObject(ctx, row.key);
      } catch {
        /* object may already be gone */
      }
      await ctx.db.delete(row._id);
    }
    return rows.length;
  },
});
