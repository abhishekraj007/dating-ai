import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export function UsersTable({ users }: { users: AdminUser[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead className="text-right">Credits</TableHead>
            <TableHead className="hidden lg:table-cell">Role</TableHead>
            <TableHead className="hidden lg:table-cell">Onboarding</TableHead>
            <TableHead className="hidden xl:table-cell">Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const displayName = getUserDisplayName(user);

            return (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="flex min-w-0 max-w-[200px] items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback>{getUserInitial(user)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">{displayName}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[240px] truncate text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <PremiumBadge user={user} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCredits(user.credits)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <RoleBadge isAdmin={user.isAdmin} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <OnboardingBadge completed={user.hasCompletedOnboarding} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  {formatJoinedDate(user._creationTime)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
