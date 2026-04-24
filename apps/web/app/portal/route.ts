import { CustomerPortal } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";

function resolveAppOrigin(request: NextRequest) {
  const configuredAppUrl =
    process.env.SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

function resolveSafeReturnUrl(request: NextRequest, appOrigin: string) {
  const requestedReturnPath = request.nextUrl.searchParams.get("returnPath");

  if (!requestedReturnPath || !requestedReturnPath.startsWith("/")) {
    return new URL("/chat", appOrigin).toString();
  }

  if (requestedReturnPath.startsWith("//")) {
    return new URL("/chat", appOrigin).toString();
  }

  try {
    return new URL(requestedReturnPath, appOrigin).toString();
  } catch {
    return new URL("/chat", appOrigin).toString();
  }
}

export function GET(request: NextRequest) {
  const appOrigin = resolveAppOrigin(request);
  const returnUrl = resolveSafeReturnUrl(request, appOrigin);

  const handler = CustomerPortal({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    getCustomerId: async (req: NextRequest) => {
      const userId = req.nextUrl.searchParams.get("userId");
      if (!userId) {
        throw new Error("Customer ID is required");
      }
      return userId;
    },
    returnUrl,
    server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
  });

  return handler(request);
}
