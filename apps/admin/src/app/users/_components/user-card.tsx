import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCredits,
  formatJoinedDate,
  getUserDisplayName,
  getUserInitial,
  type AdminUser,
} from "../_lib/user-display";
import {
  OnboardingBadge,
  PremiumBadge,
  RoleBadge,
} from "./user-status-badges";

export function UserCard({ user }: { user: AdminUser }) {
  const displayName = getUserDisplayName(user);

  return (
    <Card size="sm" className="bg-card/60">
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-11">
            <AvatarFallback>{getUserInitial(user)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold leading-tight">
              {displayName}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
          <div className="shrink-0">
            <PremiumBadge user={user} />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Credits</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {formatCredits(user.credits)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Joined</dt>
            <dd className="mt-0.5 font-medium">
              {formatJoinedDate(user._creationTime)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">Role</dt>
            <dd>
              <RoleBadge isAdmin={user.isAdmin} />
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs text-muted-foreground">Onboarding</dt>
            <dd>
              <OnboardingBadge completed={user.hasCompletedOnboarding} />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
