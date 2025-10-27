/**
 * LoadingState component displays a skeleton UI while recipe data is being fetched
 * Matches the layout of the actual recipe detail content
 */
export function LoadingState() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        {/* Title skeleton */}
        <div className="mb-4 h-10 w-3/4 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />

        {/* Metadata skeleton */}
        <div className="flex flex-col gap-2 text-sm">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

