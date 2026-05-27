import { v } from "convex/values";

const chatStyleOptionFields = {
  hairstyle: v.optional(v.string()),
  clothing: v.optional(v.string()),
  scene: v.optional(v.string()),
  description: v.optional(v.string()),
};

export const chatImageStyleOptionsValidator = v.optional(
  v.object(chatStyleOptionFields),
);

export const chatVideoStyleOptionsValidator = v.optional(
  v.object({
    ...chatStyleOptionFields,
    duration: v.optional(v.number()),
  }),
);
