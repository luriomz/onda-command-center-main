import { Skeleton } from '@/components/ui/skeleton';

export const OverviewSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Stat cards skeleton */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Tables skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="glass-panel p-6 space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Check-in summary skeleton */}
      <div className="glass-panel p-6">
        <Skeleton className="h-5 w-44 mb-4" />
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Skeleton className="h-[140px] w-[140px] rounded-full flex-shrink-0" />
          <div className="grid w-full flex-1 grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
