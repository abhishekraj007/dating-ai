"use client";

import { createContext, useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

type AuthModalContextValue = {
  isOpen: boolean;
  returnTo: string;
  open: (returnTo?: string) => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue>({
  isOpen: false,
  returnTo: "/explore",
  open: () => {},
  close: () => {},
});

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [returnTo, setReturnTo] = useState("/explore");
  const [dialogKey, setDialogKey] = useState(0);

  const value = {
    isOpen,
    returnTo,
    open: (nextReturnTo?: string) => {
      setReturnTo(nextReturnTo || "/explore");
      setDialogKey((currentKey) => currentKey + 1);
      setIsOpen(true);
    },
    close: () => setIsOpen(false),
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent key={dialogKey} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              Continue with Google to keep browsing FeelAI and unlock the full
              chat experience.
            </DialogDescription>
          </DialogHeader>
          <Card className="border-border/70 bg-card/90 py-0 shadow-none ring-0">
            <CardContent className="space-y-4 p-0">
              <GoogleSignInButton
                className="h-12 w-full"
                returnTo={returnTo}
                variant="outline"
              />
              <p className="text-center text-xs text-muted-foreground">
                By signing in, you agree to our terms of service and privacy
                policy.
              </p>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
