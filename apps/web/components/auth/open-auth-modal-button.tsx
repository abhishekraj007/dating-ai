"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

type OpenAuthModalButtonProps = React.ComponentProps<typeof Button> & {
  returnTo?: string;
};

export function OpenAuthModalButton({
  returnTo,
  onClick,
  children,
  ...props
}: OpenAuthModalButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useConvexAuth();
  const { open } = useAuthModal();

  const currentPath = searchParams?.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  const destination = returnTo || currentPath || "/";

  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event);

        if (isAuthenticated) {
          router.push(destination);
          return;
        }

        open(destination);
      }}
    >
      {children}
    </Button>
  );
}
