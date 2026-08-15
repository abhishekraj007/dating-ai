import { createAuth } from "@dating-ai/backend/convex/lib/betterAuth";
import { getToken as getTokenNextjs } from "@convex-dev/better-auth/nextjs";

export const getToken = () => {
  return getTokenNextjs(createAuth);
};
