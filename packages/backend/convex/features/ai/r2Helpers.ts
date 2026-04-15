import { v } from "convex/values";
import { query, internalMutation } from "../../_generated/server";
import { r2 } from "../../uploads";

/**
 * Helper to get signed URLs for profile images
 */
export const getProfileImageUrls = query({
  args: {
    imageKeys: v.array(v.string()),
  },
  returns: v.array(v.union(v.string(), v.null())),
  handler: async (ctx, args) => {
    const urls: Array<string | null> = [];
    
    for (const key of args.imageKeys) {
      try {
        if (key) {
          const url = await r2.getUrl(key);
          urls.push(url);
        } else {
          urls.push(null);
        }
      } catch (error) {
        console.error("Error getting URL for key:", key, error);
        urls.push(null);
      }
    }
    
    return urls;
  },
});

/**
 * Helper to upload image to R2 from a buffer/blob
 * This is used internally for generated images
 */
export const uploadGeneratedImage = internalMutation({
  args: {
    userId: v.string(),
    imageData: v.string(), // base64 encoded image
    contentType: v.string(),
  },
  returns: v.string(), // Returns R2 key
  handler: async (ctx, args) => {
    // Create a unique key with userId prefix
    const key = `${args.userId}/generated/${crypto.randomUUID()}`;
    
    // Note: In production, you'd upload the actual image data to R2 here
    // For now, we'll return the key and handle the upload in the action layer
    
    return key;
  },
});

/**
 * Get single image URL
 */
export const getImageUrl = query({
  args: {
    imageKey: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    try {
      if (!args.imageKey) return null;
      return await r2.getUrl(args.imageKey);
    } catch (error) {
      console.error("Error getting URL for key:", args.imageKey, error);
      return null;
    }
  },
});

