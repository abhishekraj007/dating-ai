import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profile: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    authUserId: v.string(),
    credits: v.optional(v.number()),
    // Admin status - can only be set manually in database
    isAdmin: v.optional(v.boolean()),
    // Premium status - can be granted manually or via subscription
    isPremium: v.optional(v.boolean()),
    premiumGrantedBy: v.optional(
      v.union(
        v.literal("manual"), // Admin granted
        v.literal("subscription"), // From active subscription
        v.literal("lifetime") // Lifetime access
      )
    ),
    premiumGrantedAt: v.optional(v.number()),
    premiumExpiresAt: v.optional(v.number()), // null = lifetime/subscription-based
  }).index("by_auth_user_id", ["authUserId"]),

  // Unified subscriptions table for both Polar (web) and RevenueCat (native)
  // Single source of truth for all subscription and premium status data
  subscriptions: defineTable({
    userId: v.string(), // Better Auth user ID (stored as string)
    platform: v.union(v.literal("polar"), v.literal("revenuecat")),

    // Customer and subscription identifiers (required for tracking)
    platformCustomerId: v.string(), // Polar/RevenueCat customer ID
    platformSubscriptionId: v.string(), // Polar/RevenueCat subscription ID
    platformProductId: v.string(), // Product ID from platform

    // Subscription details
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("expired"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    productType: v.optional(v.string()), // e.g., "monthly", "yearly" - derived from webhook

    // Customer info (denormalized for convenience)
    customerEmail: v.string(),
    customerName: v.optional(v.string()),

    // Dates
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_platform", ["userId", "platform"])
    .index("by_user_status", ["userId", "status"])
    .index("by_platform_subscription_id", ["platformSubscriptionId"])
    // Composite index for guaranteed uniqueness across platforms
    .index("by_platform_and_subscription", [
      "platform",
      "platformSubscriptionId",
    ]),

  // Orders table for tracking one-time purchases (credit purchases)
  orders: defineTable({
    userId: v.string(), // Better Auth user ID (stored as string)
    platform: v.union(v.literal("polar"), v.literal("revenuecat")),
    platformOrderId: v.string(), // Unique order ID from platform
    platformProductId: v.string(), // Product ID that was purchased
    amount: v.number(), // Credit amount purchased
    status: v.union(
      v.literal("paid"),
      v.literal("pending"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    createdAt: v.number(),
  })
    .index("by_platform_order_id", ["platformOrderId"])
    .index("by_user", ["userId"])
    .index("by_user_platform", ["userId", "platform"]),

  // Uploads table for tracking R2 uploads
  uploads: defineTable({
    key: v.string(), // R2 object key
    userId: v.string(), // Better Auth user ID
    contentType: v.string(),
    contentLength: v.number(),
    uploadedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_key", ["key"]),

  // AI Profiles - pre-seeded + user-created AI characters
  aiProfiles: defineTable({
    // Required fields
    name: v.string(),
    gender: v.union(v.literal("female"), v.literal("male")),
    avatarImageKey: v.optional(v.string()), // R2 key for main avatar (optional for seed data)
    isUserCreated: v.boolean(),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("archived")
    ),
    // Optional profile fields - AI adapts if missing
    age: v.optional(v.number()),
    zodiacSign: v.optional(v.string()),
    occupation: v.optional(v.string()),
    bio: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    personalityTraits: v.optional(v.array(v.string())),
    profileImageKeys: v.optional(v.array(v.string())), // Additional R2 keys
    relationshipGoal: v.optional(v.string()),
    mbtiType: v.optional(v.string()),
    language: v.optional(v.string()), // defaults to "en"
    voiceId: v.optional(v.string()), // ElevenLabs voice ID
    voiceType: v.optional(v.string()), // Voice type description (legacy)
    createdAt: v.optional(v.number()), // Creation timestamp (legacy)
    createdByUserId: v.optional(v.string()), // Better Auth user ID if user-created
  })
    .index("by_gender", ["gender"])
    .index("by_user", ["createdByUserId"])
    .index("by_status_and_gender", ["status", "gender"]),

  // Conversation metadata - links Agent threads to AI profiles
  aiConversations: defineTable({
    threadId: v.string(), // Agent component thread ID
    userId: v.string(), // Better Auth user ID
    aiProfileId: v.id("aiProfiles"),
    relationshipLevel: v.number(), // 1-5, default 1
    compatibilityScore: v.number(), // 0-100, default 60
    messageCount: v.number(), // default 0
    lastMessageAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_profile", ["userId", "aiProfileId"])
    .index("by_thread", ["threadId"])
    .index("by_user_and_last_message", ["userId", "lastMessageAt"]),

  // Chat image generation requests (selfies, custom images, etc.)
  chatImages: defineTable({
    conversationId: v.id("aiConversations"),
    userId: v.string(),
    aiProfileId: v.id("aiProfiles"),
    prompt: v.string(),
    styleOptions: v.optional(
      v.object({
        hairstyle: v.optional(v.string()),
        clothing: v.optional(v.string()),
        scene: v.optional(v.string()),
      })
    ),
    imageKey: v.optional(v.string()), // R2 key when complete
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    replicateJobId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    creditsCharged: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});
