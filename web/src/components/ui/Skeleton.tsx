import { cn } from "@/lib/cn";

/** A quiet placeholder block shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-[shimmer_1.6s_ease-in-out_infinite] bg-sand-deep", className)} />;
}
