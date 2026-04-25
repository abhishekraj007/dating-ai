"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

type LoginClientProps = {
  redirectTo: string;
};

export function LoginClient({ redirectTo }: LoginClientProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-2xl rounded-2xl border p-0 mx-6">
        <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[180px] overflow-hidden border-b border-border/70 bg-muted/30 md:min-h-[420px] md:border-r md:border-b-0">
            <Image
              src="/discover/female.webp"
              alt="FeelAI companion preview"
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover rounded-2xl rounded-b-none md:rounded-r-none"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.18)_35%,rgba(0,0,0,0.56)_100%)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.26)_35%,rgba(0,0,0,0.7)_100%)]" />
          </div>

          <div className="flex flex-col justify-center px-6 py-6 sm:px-8 sm:py-8">
            <div className="space-y-4 text-left">
              <h3 className="max-w-md text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-[2.15rem]">
                Sign in to continue.
              </h3>
              <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
                Save your chats, picks, credits, and unlock the full chat
                experience across web and mobile.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <GoogleSignInButton
                className="h-14 w-full rounded-[28px] px-8 text-base transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out active:scale-[0.96]"
                colorMode="inverted"
                returnTo={redirectTo}
                variant="outline"
              />
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                By signing in, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                >
                  terms of service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                >
                  privacy policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
