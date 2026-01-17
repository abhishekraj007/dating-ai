import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profile: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    authUserId: v.string(),
    credits: v.optional(v.number()),
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
    // Active thread for English tutor (syncs across devices)
    activeTutorThreadId: v.optional(v.string()),
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

  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),

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

  // AI Dating Profiles - both pre-seeded and user-created
  aiProfiles: defineTable({
    name: v.string(),
    age: v.number(),
    gender: v.union(v.literal("male"), v.literal("female")),
    zodiacSign: v.optional(v.string()),
    occupation: v.optional(v.string()),
    bio: v.string(),
    interests: v.array(v.string()),
    personalityTraits: v.array(v.string()),
    avatarImageKey: v.optional(v.string()), // R2 key
    profileImageKeys: v.array(v.string()), // Array of R2 keys
    relationshipGoal: v.optional(v.string()),
    mbtiType: v.optional(v.string()),
    language: v.optional(v.string()),
    voiceType: v.optional(v.string()),
    isUserCreated: v.boolean(),
    createdByUserId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("archived")
    ),
    createdAt: v.number(),
  })
    .index("by_gender", ["gender"])
    .index("by_status", ["status"])
    .index("by_created_by_user_id", ["createdByUserId"])
    .index("by_gender_and_status", ["gender", "status"])
    .index("by_is_user_created", ["isUserCreated"]),

  // Dating conversations - maps to Agent threads
  // Uses Agent component threads internally, this stores dating-specific metadata
  conversations: defineTable({
    userId: v.string(), // Better Auth user ID
    aiProfileId: v.id("aiProfiles"),
    threadId: v.string(), // Agent thread ID from @convex-dev/agent
    relationshipLevel: v.number(), // 1-5
    compatibilityScore: v.number(), // 0-100
    lastMessageAt: v.optional(v.number()),
    messageCount: v.number(),
    totalTokensUsed: v.number(),
    status: v.union(v.literal("active"), v.literal("archived")),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_ai_profile_id", ["aiProfileId"])
    .index("by_user_id_and_status", ["userId", "status"])
    .index("by_user_id_and_ai_profile_id", ["userId", "aiProfileId"])
    .index("by_thread_id", ["threadId"]),

  // Custom selfie generation requests
  selfieRequests: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    aiProfileId: v.id("aiProfiles"),
    prompt: v.string(),
    styleOptions: v.any(), // JSON object with hairstyle, clothing, scene
    imageKey: v.optional(v.string()), // R2 key
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    replicateJobId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_conversation_id", ["conversationId"])
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_replicate_job_id", ["replicateJobId"]),
});
