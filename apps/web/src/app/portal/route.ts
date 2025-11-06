import { CustomerPortal } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  getCustomerId: async (req: NextRequest) => {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      throw new Error("Customer ID is required");
    }
    return userId;
  },
  server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
});
