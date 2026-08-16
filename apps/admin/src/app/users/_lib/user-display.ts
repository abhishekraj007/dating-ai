import { api } from "@dating-ai/backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type AdminUser = FunctionReturnType<
  typeof api.user.adminListUsers
>["users"][number];

export function getUserDisplayName(user: AdminUser) {
  const name = user.name?.trim();
  if (name) {
    return name;
  }

  return user.email.split("@")[0] ?? user.email;
}

export function getUserInitial(user: AdminUser) {
  return getUserDisplayName(user).charAt(0).toUpperCase();
}

export function formatJoinedDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCredits(credits: number) {
  return credits.toLocaleString();
}

export function getPremiumGrantLabel(user: AdminUser) {
  if (user.premiumGrantedBy === "lifetime") {
    return "Lifetime";
  }

  if (user.premiumGrantedBy === "subscription") {
    return "Subscription";
  }

  if (user.premiumGrantedBy === "manual") {
    return "Granted";
  }

  return null;
}
