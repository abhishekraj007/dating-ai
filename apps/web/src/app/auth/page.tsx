"use client";

import AuthScreen from "@/components/auth-screen";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { useEffect } from "react";

export default function AuthPage() {
  const router = useRouter();
  const userData = useQuery(api.user.fetchUserAndProfile);

  console.log({ userData });

  useEffect(() => {
    if (userData) {
      router.push("/dashboard");
    }
  }, [userData, router]);

  if (userData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <AuthScreen />;
}
