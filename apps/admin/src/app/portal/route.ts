import { NextRequest, NextResponse } from "next/server";
import { CustomerPortal } from "@polar-sh/nextjs";
import { fetchAction, api } from "@/lib/convex-client";
import { getToken } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  const token = await getToken();
  const portal = await fetchAction(
    api.features.dodo.actions.getCustomerPortal,
    {},
    { token },
  );

  if (portal?.portal_url) {
    return NextResponse.redirect(portal.portal_url);
  }

  const handler = CustomerPortal({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    getCustomerId: async (req: NextRequest) => {
      const userId = req.nextUrl.searchParams.get("userId");
      if (!userId) {
        throw new Error("Customer ID is required");
      }
      return userId;
    },
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004"}/dashboard`,
    server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
  });

  return handler(request);
}
