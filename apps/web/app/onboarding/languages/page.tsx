"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingLanguagesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/preferences");
  }, [router]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
    </div>
  );
}
