"use client";

import AuthScreen from "@/components/auth-screen";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Redirect /auth to the main login page at /
export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return <AuthScreen isPending pendingMessage="Opening admin portal..." />;
}
