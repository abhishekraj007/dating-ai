import { Skeleton } from "@/components/ui/skeleton";

export function UsersSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`user-card-skeleton-${index}`}
            className="rounded-2xl border border-border/70 bg-card/60 p-4"
          >
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="size-11 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44 max-w-full" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-border/70 md:block">
        <div className="border-b px-3 py-3">
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`user-row-skeleton-${index}`}
            className="flex items-center gap-3 border-b px-3 py-3 last:border-0"
          >
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-4 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </>
  );
}
