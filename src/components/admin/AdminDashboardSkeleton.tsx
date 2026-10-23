"use client";

/**
 * Skeleton loader for an individual metric card.
 * Uses consistent sizing, border radius, and dark/light mode tokens.
 */
export function AdminMetricCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded-md" />
        <div className="size-8 rounded-xl bg-slate-100 dark:bg-zinc-800/70 border border-slate-200/40 dark:border-zinc-700/40" />
      </div>
      <div className="mt-3.5 space-y-2">
        <div className="h-8 sm:h-9 w-14 sm:w-16 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-3.5 w-24 bg-slate-100 dark:bg-zinc-800/60 rounded" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for the 4-column metrics row on the admin home page.
 */
export function AdminMetricsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <AdminMetricCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for an individual pending access request card.
 */
export function PendingRequestCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          {/* User Name Skeleton */}
          <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded-md" />
          {/* User Email Skeleton */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="size-3 bg-slate-200 dark:bg-zinc-800 rounded-full shrink-0" />
            <div className="h-3 w-36 sm:w-44 bg-slate-100 dark:bg-zinc-800/60 rounded" />
          </div>
          {/* Company Badge Skeleton */}
          <div className="h-5 w-28 bg-slate-100 dark:bg-zinc-800/80 rounded-full mt-1.5" />
        </div>
        {/* Date Timestamp Skeleton */}
        <div className="h-3 w-12 sm:w-14 bg-slate-100 dark:bg-zinc-800/60 rounded" />
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <div className="flex-1 h-7 rounded-xl bg-slate-100 dark:bg-zinc-800/60" />
        <div className="flex-1 h-7 rounded-xl bg-slate-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for the urgent pending access requests queue list.
 */
export function PendingRequestsQueueSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <PendingRequestCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for the Accounts pending access requests tab.
 */
export function AccountsRequestsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4 animate-pulse"
        >
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="h-4.5 w-36 bg-slate-200 dark:bg-zinc-800 rounded-md" />
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="size-3 bg-slate-200 dark:bg-zinc-800 rounded-full shrink-0" />
                  <div className="h-3 w-40 sm:w-48 bg-slate-100 dark:bg-zinc-800/60 rounded" />
                </div>
              </div>
              <div className="h-3 w-14 bg-slate-100 dark:bg-zinc-800/60 rounded" />
            </div>

            <div className="h-6 w-36 bg-slate-100 dark:bg-zinc-800/80 rounded-full" />
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex-1 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800/60" />
            <div className="flex-1 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for the Approved Members table body on Accounts page.
 */
export function AccountsMembersTableSkeleton({
  rows = 5,
  isSuperAdmin = true,
}: {
  rows?: number;
  isSuperAdmin?: boolean;
}) {
  return (
    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="py-3.5 px-4">
            <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded-md mb-1.5" />
            <div className="flex items-center gap-1">
              <div className="size-3 rounded-full bg-slate-200 dark:bg-zinc-800" />
              <div className="h-3 w-36 bg-slate-100 dark:bg-zinc-800/60 rounded" />
            </div>
          </td>
          <td className="py-3.5 px-4">
            <div className="flex items-center gap-1.5">
              <div className="size-3.5 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-4 w-28 bg-slate-100 dark:bg-zinc-800/80 rounded" />
            </div>
          </td>
          <td className="py-3.5 px-4">
            <div className="h-6 w-24 bg-slate-100 dark:bg-zinc-800/70 rounded-full" />
          </td>
          <td className="py-3.5 px-4">
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
              <div className="h-3 w-12 bg-slate-100 dark:bg-zinc-800/60 rounded" />
            </div>
          </td>
          {isSuperAdmin && (
            <td className="py-3.5 px-4 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <div className="h-7 w-12 rounded-lg bg-slate-100 dark:bg-zinc-800/70" />
                <div className="h-7 w-12 rounded-lg bg-slate-100 dark:bg-zinc-800/70" />
                <div className="size-7 rounded-lg bg-slate-100 dark:bg-zinc-800/70" />
              </div>
            </td>
          )}
        </tr>
      ))}
    </tbody>
  );
}

/**
 * Skeleton loader for the Companies & Hierarchy Tree list on the Companies page.
 */
export function CompaniesTreeSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => {
        const isChild = i === 1 || i === 3;
        return (
          <div
            key={i}
            className={`p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse ${
              isChild ? "ml-4 sm:ml-8 border-l-4 border-l-slate-200 dark:border-l-zinc-700" : ""
            }`}
          >
            {/* Left Info Skeleton */}
            <div className="flex items-start gap-3 flex-1">
              <div className="size-5 mt-0.5 rounded bg-slate-200 dark:bg-zinc-800 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-4.5 w-40 sm:w-52 bg-slate-200 dark:bg-zinc-800 rounded-md" />
                  <div className="h-4 w-16 bg-slate-100 dark:bg-zinc-800/60 rounded-full" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-3 w-14 bg-slate-100 dark:bg-zinc-800/60 rounded" />
                  <div className="h-4 w-28 bg-slate-100 dark:bg-zinc-800/80 rounded" />
                  <div className="h-4 w-20 bg-slate-100 dark:bg-zinc-800/80 rounded" />
                </div>
              </div>
            </div>

            {/* Right Action Buttons Skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-7 w-20 bg-slate-100 dark:bg-zinc-800/70 rounded-xl" />
              <div className="size-7 bg-slate-100 dark:bg-zinc-800/70 rounded-xl" />
              <div className="size-7 bg-slate-100 dark:bg-zinc-800/70 rounded-xl" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Skeleton loader for the Retention expiring visits table.
 */
export function RetentionTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="py-3 px-4">
            <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded-md mb-1.5" />
            <div className="h-3 w-20 bg-slate-100 dark:bg-zinc-800/60 rounded" />
          </td>
          <td className="py-3 px-4">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-3.5 w-24 bg-slate-100 dark:bg-zinc-800/80 rounded" />
            </div>
          </td>
          <td className="py-3 px-4">
            <div className="h-3.5 w-20 bg-slate-100 dark:bg-zinc-800/60 rounded" />
          </td>
          <td className="py-3 px-4">
            <div className="h-3.5 w-16 bg-slate-200 dark:bg-zinc-800 rounded" />
          </td>
          <td className="py-3 px-4">
            <div className="h-3.5 w-14 bg-slate-100 dark:bg-zinc-800/60 rounded" />
          </td>
          <td className="py-3 px-4 text-right">
            <div className="inline-block h-6 w-28 bg-slate-100 dark:bg-zinc-800/70 rounded-full" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/**
 * Skeleton loader for the Last Cleanup Execution card.
 */
export function RetentionLastCleanupSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 pt-1 animate-pulse">
      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/60 space-y-1.5">
        <div className="h-5 w-8 mx-auto bg-slate-200 dark:bg-zinc-800 rounded" />
        <div className="h-2.5 w-14 mx-auto bg-slate-200/60 dark:bg-zinc-700/60 rounded" />
      </div>
      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/60 space-y-1.5">
        <div className="h-5 w-8 mx-auto bg-slate-200 dark:bg-zinc-800 rounded" />
        <div className="h-2.5 w-14 mx-auto bg-slate-200/60 dark:bg-zinc-700/60 rounded" />
      </div>
      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/60 space-y-1.5">
        <div className="h-5 w-12 mx-auto bg-slate-200 dark:bg-zinc-800 rounded" />
        <div className="h-2.5 w-14 mx-auto bg-slate-200/60 dark:bg-zinc-700/60 rounded" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for the Retention 4-card metric row.
 */
export function RetentionMetricsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-slate-200 dark:bg-zinc-800 rounded-md" />
            <div className="size-8 rounded-xl bg-slate-100 dark:bg-zinc-800/70" />
          </div>
          <div className="mt-3.5 space-y-2">
            <div className="h-8 w-16 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-3 w-28 bg-slate-100 dark:bg-zinc-800/60 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}


