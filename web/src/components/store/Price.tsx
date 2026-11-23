import { formatUSD } from "@latelylebanon/shared";
import { cn } from "@/lib/cn";

interface PriceProps {
  cents: number;
  compareAtCents?: number | null;
  fromLabel?: string;
  className?: string;
}

export function Price({ cents, compareAtCents, fromLabel, className }: PriceProps) {
  const onSale = compareAtCents != null && compareAtCents > cents;
  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular-nums", className)}>
      {fromLabel && <span className="text-muted">{fromLabel}</span>}
      <span className={cn(onSale && "text-terracotta")}>{formatUSD(cents)}</span>
      {onSale && (
        <s className="text-muted" aria-label={`was ${formatUSD(compareAtCents)}`}>
          {formatUSD(compareAtCents)}
        </s>
      )}
    </span>
  );
}
