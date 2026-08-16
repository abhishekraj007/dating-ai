import { Badge } from "@/components/ui/badge";
import { getPremiumGrantLabel, type AdminUser } from "../_lib/user-display";

export function PremiumBadge({ user }: { user: AdminUser }) {
  const grantLabel = getPremiumGrantLabel(user);

  if (!user.isPremium) {
    return (
      <Badge variant="outline" className="capitalize">
        Free
      </Badge>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge>Premium</Badge>
      {grantLabel ? (
        <span className="text-[11px] text-muted-foreground">{grantLabel}</span>
      ) : null}
    </div>
  );
}

export function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Badge variant={isAdmin ? "secondary" : "outline"} className="capitalize">
      {isAdmin ? "Admin" : "User"}
    </Badge>
  );
}

export function OnboardingBadge({ completed }: { completed: boolean }) {
  return (
    <Badge variant={completed ? "secondary" : "outline"} className="capitalize">
      {completed ? "Onboarded" : "Pending"}
    </Badge>
  );
}
