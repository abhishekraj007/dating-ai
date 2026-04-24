export function getSiteUrl() {
  const explicitUrl =
    process.env.SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3004";
}
