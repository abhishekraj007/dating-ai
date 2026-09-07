import { buildPrivatePageMetadata } from "@/lib/public-metadata";
import { LoginClient } from "./login-client";

export const metadata = buildPrivatePageMetadata({
  title: "Sign in",
  description: "Sign in to FeelAI to start private companion chats.",
});

type LoginPageProps = {
  searchParams: Promise<{
    redirect?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectValue = resolvedSearchParams.redirect;
  const redirectTo =
    typeof redirectValue === "string" && redirectValue.startsWith("/")
      ? redirectValue
      : "/";

  return <LoginClient redirectTo={redirectTo} />;
}
