import { query, mutation, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { ZODIAC_SIGNS, INTERESTS, INTEREST_EMOJIS } from "../../lib/constants";

// Age range presets
const AGE_RANGES = [
  { min: 18, max: 25, label: "18 - 25" },
  { min: 20, max: 30, label: "20 - 30" },
  { min: 25, max: 35, label: "25 - 35" },
  { min: 30, max: 40, label: "30 - 40" },
  { min: 35, max: 50, label: "35 - 50" },
];

// Gender options
const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "both", label: "Both" },
];

/**
 * Get all active filter options organized by type
 * This is a public query - no auth required for reading filter options
 */
export const getFilterOptions = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all active options
    const allOptions = await ctx.db
      .query("filterOptions")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Group by type and sort by order
    const grouped: Record<string, typeof allOptions> = {};
    for (const option of allOptions) {
      if (!grouped[option.type]) {
        grouped[option.type] = [];
      }
      grouped[option.type].push(option);
    }

    // Sort each group by order
    for (const type in grouped) {
      grouped[type].sort((a, b) => a.order - b.order);
    }

    return {
      // Age ranges with min/max for range selection
      ageRanges: (grouped["age_range"] || []).map((a) => ({
        value: a.value,
        label: a.label,
        min: a.minValue ?? 18,
        max: a.maxValue ?? 99,
      })),
      // Gender options
      genders: (grouped["gender"] || []).map((g) => ({
        value: g.value,
        label: g.label,
      })),
      // Zodiac signs
      zodiacSigns: (grouped["zodiac"] || []).map((z) => ({
        value: z.value,
        label: z.label,
      })),
      // Interests with emojis
      interests: (grouped["interest"] || []).map((i) => ({
        value: i.value,
        label: i.label,
        emoji: i.emoji || "",
      })),
    };
  },
});

/**
 * Seed filter options from constants (admin only)
 * Call this once to populate the database from existing constants
 */
export const seedFilterOptions = mutation({
  args: {
    force: v.optional(v.boolean()), // Force re-seed even if data exists
  },
  handler: async (ctx, args) => {
    // Check if already seeded
    const existing = await ctx.db.query("filterOptions").first();

    if (existing && !args.force) {
      return {
        success: false,
        message: "Filter options already seeded. Use force=true to re-seed.",
      };
    }

    // If force, delete all existing
    if (args.force && existing) {
      const all = await ctx.db.query("filterOptions").collect();
      for (const item of all) {
        await ctx.db.delete(item._id);
      }
    }

    const now = Date.now();
    let count = 0;

    // Seed age ranges
    for (let i = 0; i < AGE_RANGES.length; i++) {
      const range = AGE_RANGES[i];
      await ctx.db.insert("filterOptions", {
        type: "age_range",
        value: `${range.min}-${range.max}`,
        label: range.label,
        minValue: range.min,
        maxValue: range.max,
        isActive: true,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    // Seed genders
    for (let i = 0; i < GENDERS.length; i++) {
      const gender = GENDERS[i];
      await ctx.db.insert("filterOptions", {
        type: "gender",
        value: gender.value,
        label: gender.label,
        isActive: true,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    // Seed zodiac signs
    for (let i = 0; i < ZODIAC_SIGNS.length; i++) {
      const zodiac = ZODIAC_SIGNS[i];
      await ctx.db.insert("filterOptions", {
        type: "zodiac",
        value: zodiac,
        label: zodiac,
        isActive: true,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    // Seed interests
    for (let i = 0; i < INTERESTS.length; i++) {
      const interest = INTERESTS[i];
      await ctx.db.insert("filterOptions", {
        type: "interest",
        value: interest,
        label: interest,
        emoji: INTEREST_EMOJIS[interest] || "",
        isActive: true,
        order: i,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    return {
      success: true,
      message: `Seeded ${count} filter options (${AGE_RANGES.length} age ranges, ${GENDERS.length} genders, ${ZODIAC_SIGNS.length} zodiac signs, ${INTERESTS.length} interests)`,
    };
  },
});

/**
 * Add a new filter option (admin)
 */
export const addFilterOption = mutation({
  args: {
    type: v.union(v.literal("zodiac"), v.literal("interest")),
    value: v.string(),
    label: v.string(),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get max order for this type
    const existing = await ctx.db
      .query("filterOptions")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();

    const maxOrder =
      existing.length > 0 ? Math.max(...existing.map((e) => e.order)) : -1;

    const now = Date.now();

    const id = await ctx.db.insert("filterOptions", {
      type: args.type,
      value: args.value,
      label: args.label,
      emoji: args.emoji,
      isActive: true,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  },
});

/**
 * Update a filter option (admin)
 */
export const updateFilterOption = mutation({
  args: {
    id: v.id("filterOptions"),
    label: v.optional(v.string()),
    emoji: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Filter option not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a filter option (admin)
 */
export const deleteFilterOption = mutation({
  args: {
    id: v.id("filterOptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
