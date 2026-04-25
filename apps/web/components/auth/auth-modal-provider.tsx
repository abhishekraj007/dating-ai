"use client";

import { createContext, useContext, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

type AuthModalContextValue = {
  isOpen: boolean;
  returnTo: string;
  open: (returnTo?: string) => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue>({
  isOpen: false,
  returnTo: "/",
  open: () => {},
  close: () => {},
});

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [returnTo, setReturnTo] = useState("/");
  const [dialogKey, setDialogKey] = useState(0);

  const value = {
    isOpen,
    returnTo,
    open: (nextReturnTo?: string) => {
      setReturnTo(nextReturnTo || "/");
      setDialogKey((currentKey) => currentKey + 1);
      setIsOpen(true);
    },
    close: () => setIsOpen(false),
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          key={dialogKey}
          className="w-[80vw] max-w-2xl overflow-hidden bg-background p-0 shadow-[0_28px_90px_-40px_rgba(0,0,0,0.35)] dark:shadow-[0_32px_120px_-48px_rgba(0,0,0,0.82)]"
        >
          <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
            <div className="relative min-h-[180px] overflow-hidden border-b border-border/70 bg-muted/30 md:min-h-[420px] md:border-r md:border-b-0">
              <Image
                src="/discover/female.webp"
                alt="FeelAI companion preview"
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.18)_35%,rgba(0,0,0,0.56)_100%)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.26)_35%,rgba(0,0,0,0.7)_100%)]" />
            </div>

            <div className="flex flex-col justify-center px-6 py-6 sm:px-8 sm:py-8">
              <DialogHeader className="space-y-4 text-left">
                <DialogTitle className="max-w-md text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-[2.15rem]">
                  Sign in to continue.
                </DialogTitle>
                <DialogDescription className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
                  Save your chats, picks, credits, and unlock the full chat
                  experience across web and mobile.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 space-y-4">
                <GoogleSignInButton
                  className="h-14 w-full rounded-[28px] px-8 text-base transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out active:scale-[0.96]"
                  colorMode="inverted"
                  returnTo={returnTo}
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
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
