import { LoginClient } from "./login-client";

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
