import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { R2, type R2Callbacks } from "@convex-dev/r2";
import { authComponent } from "./lib/betterAuth";

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
    // Create a key with userId prefix so we can extract it later
    const key = `${user._id}/${crypto.randomUUID()}`;
    return await r2.generateUploadUrl(key);
  },
});

// Generate the client API with upload callbacks
export const { generateUploadUrl, syncMetadata, onSyncMetadata } = r2.clientApi(
  {
    callbacks,
    checkUpload: async (ctx, bucket) => {
      // Verify the user is authenticated before allowing upload
      const user = await authComponent.safeGetAuthUser(ctx as any);
      if (!user) {
        throw new Error("Not authenticated");
      }
    },
    onSyncMetadata: async (ctx, args) => {
      // This runs after metadata sync, so r2.getMetadata will work
      // args: { bucket: string; key: string; isNew: boolean }
      const metadata = await r2.getMetadata(ctx, args.key);

      if (!metadata) {
        console.error("No metadata found for key:", args.key);
        return;
      }

      // Check if this is an AI profile image upload
      // Format: aiProfiles/{profileId}/{type}/{uuid}
      if (args.key.startsWith("aiProfiles/")) {
        const parts = args.key.split("/");
        const profileId = parts[1];
        const type = parts[2]; // "avatar" or "gallery"

        if (profileId && type) {
          await ctx.runMutation(internal.uploads.updateAIProfileImage, {
            profileId: profileId as any,
            key: args.key,
            type: type as "avatar" | "gallery",
          });
        }
        return;
      }

      // Extract userId from key (format: userId/uuid)
      const userId = args.key.split("/")[0];
      if (!userId) {
        console.error("No userId found in key:", args.key);
        return;
      }

      // Create the upload record
      await ctx.runMutation(internal.uploads.createUploadRecord, {
        key: args.key,
        userId,
        contentType: metadata.contentType || "application/octet-stream",
        contentLength: metadata.size || 0,
      });
    },
  }
);

// Mutation to associate an upload with the current user
export const associateUpload = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
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
      // Update the userId if it's not set
      if (!existing.userId) {
        await ctx.db.patch(existing._id, {
          userId: user._id,
        });
      }
      return;
    }

    // Create new record
    await ctx.db.insert("uploads", {
      key: args.key,
      userId: user._id,
      contentType: metadata.contentType || "application/octet-stream",
      contentLength: metadata.size || 0,
      uploadedAt: Date.now(),
    });
  },
});

// Internal mutation to create upload records
export const createUploadRecord = internalMutation({
  args: {
    key: v.string(),
    userId: v.string(),
    contentType: v.string(),
    contentLength: v.number(),
    isNew: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("uploads", {
      key: args.key,
      userId: args.userId,
      contentType: args.contentType,
      contentLength: args.contentLength,
      uploadedAt: Date.now(),
    });
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
      })
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
  },
});

// Internal mutation to update AI profile with new image
export const updateAIProfileImage = internalMutation({
  args: {
    profileId: v.id("aiProfiles"),
    key: v.string(),
    type: v.union(v.literal("avatar"), v.literal("gallery")),
  },
  handler: async (ctx, { profileId, key, type }) => {
    const profile = await ctx.db.get(profileId);
    if (!profile) {
      console.error("AI profile not found:", profileId);
      return;
    }

    if (type === "avatar") {
      // If there's an existing avatar, we could delete it here
      // For now, just update the key
      await ctx.db.patch(profileId, { avatarImageKey: key });
    } else {
      // Gallery image - append to the array
      const currentKeys = profile.profileImageKeys ?? [];
      if (currentKeys.length >= 10) {
        console.error("Gallery image limit reached for profile:", profileId);
        return;
      }
      await ctx.db.patch(profileId, {
        profileImageKeys: [...currentKeys, key],
      });
    }
  },
});
