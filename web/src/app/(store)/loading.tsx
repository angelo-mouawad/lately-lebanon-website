import { Skeleton } from "@/components/ui/Skeleton";

/** Shown while a storefront page loads: the outline of a product grid, never a spinner. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 lg:px-10 lg:pt-14" aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-10 h-14 w-64" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-4/5 w-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
