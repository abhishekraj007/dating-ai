import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import type { AdminUser } from "../_lib/user-display";

const PAGE_SIZE = 40;

export function useAdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [resolvedUsers, setResolvedUsers] = useState<AdminUser[]>([]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );
  const canQueryUsers = isAuthenticated && userData?.profile?.isAdmin === true;

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setVisibleLimit(PAGE_SIZE);
    }, 250);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  const result = useQuery(
    api.user.adminListUsers,
    canQueryUsers
      ? {
          search: debouncedSearch || undefined,
          limit: visibleLimit,
        }
      : "skip",
  );

  useEffect(() => {
    if (result !== undefined) {
      setResolvedUsers(result.users);
    }
  }, [result]);

  const isAuthGateLoading =
    authLoading || (isAuthenticated && userData === undefined);
  const isUsersLoading = result === undefined && visibleLimit === PAGE_SIZE;
  const isLoadingMoreUsers = result === undefined && visibleLimit > PAGE_SIZE;
  const users = result?.users ?? (isLoadingMoreUsers ? resolvedUsers : []);
  const canLoadMoreUsers =
    !isUsersLoading &&
    !isLoadingMoreUsers &&
    users.length > 0 &&
    result?.hasMore === true;

  useEffect(() => {
    const node = loadMoreRef.current;

    if (!node || !canLoadMoreUsers) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();
          setVisibleLimit((current) => current + PAGE_SIZE);
        }
      },
      {
        rootMargin: "300px 0px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [canLoadMoreUsers]);

  const premiumCount = users.filter((user) => user.isPremium).length;
  const adminCount = users.filter((user) => user.isAdmin).length;

  return {
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
  };
}
