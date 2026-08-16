"use client";

import { Search, Users } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { PageShell } from "@/components/admin/page-shell";
import { StatChip } from "@/components/admin/stat-chip";
import { ProtectedRoute } from "@/components/protected-route";
import { Input } from "@/components/ui/input";
import { UsersList } from "./_components/users-list";
import { UsersSkeleton } from "./_components/users-skeleton";
import { useAdminUsers } from "./_hooks/use-admin-users";

export default function UsersPage() {
  const {
    searchQuery,
    setSearchQuery,
    users,
    isAuthGateLoading,
    isUsersLoading,
    isLoadingMoreUsers,
    canLoadMoreUsers,
    loadMoreRef,
    premiumCount,
    adminCount,
  } = useAdminUsers();

  return (
    <ProtectedRoute>
      <PageShell>
        <PageHeader
          title="Users"
          subtitle={
            isAuthGateLoading || isUsersLoading
              ? "Loading registered users..."
              : `Showing ${users.length}${canLoadMoreUsers || isLoadingMoreUsers ? "+" : ""} registered users`
          }
        />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or email..."
              className="pl-8"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search users"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <StatChip label="loaded" value={users.length} variant="outline" />
            <StatChip label="premium" value={premiumCount} />
            <StatChip label="admins" value={adminCount} variant="secondary" />
          </div>
        </div>

        {isAuthGateLoading || isUsersLoading ? (
          <UsersSkeleton />
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No users found"
            description="Try a different name or email, or clear search to see the latest users."
          />
        ) : (
          <>
            <UsersList users={users} />
            {isLoadingMoreUsers ? (
              <div className="mt-3">
                <UsersSkeleton count={3} />
              </div>
            ) : null}
            {canLoadMoreUsers ? (
              <div
                ref={loadMoreRef}
                className="h-px w-full"
                aria-hidden="true"
              />
            ) : null}
          </>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}
