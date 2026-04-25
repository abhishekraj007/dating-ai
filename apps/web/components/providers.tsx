"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
          <AuthModalProvider>{children}</AuthModalProvider>
        </ConvexBetterAuthProvider>
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
