import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Settings | FeelAI",
  description: "Manage your account settings on FeelAI.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-8">
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/explore">
            <ChevronLeft className="size-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Account controls and session management.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-4" />
            Account settings
          </CardTitle>
          <CardDescription>
            This page is ready for account preferences and privacy controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Settings is available as a protected route now. We can expand this
          page with profile, billing, notifications, and privacy controls when
          you want to build those sections.
        </CardContent>
      </Card>
    </div>
  );
}
