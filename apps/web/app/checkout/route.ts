// src/app/checkout/route.ts
import { Checkout } from "@polar-sh/nextjs";
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
    return new URL("/chat", appOrigin);
  }

  if (requestedReturnPath.startsWith("//")) {
    return new URL("/chat", appOrigin);
  }

  try {
    return new URL(requestedReturnPath, appOrigin);
  } catch {
    return new URL("/chat", appOrigin);
  }
}

export function GET(request: NextRequest) {
  const appOrigin = resolveAppOrigin(request);
  const returnUrl = resolveSafeReturnUrl(request, appOrigin);
  const successUrl = new URL(returnUrl.toString());

  successUrl.searchParams.set("checkout_id", "{CHECKOUT_ID}");

  const handler = Checkout({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    returnUrl: returnUrl.toString(),
    successUrl: successUrl.toString(),
    includeCheckoutId: false,
    server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
  });

  return handler(request);
}
