import { formatMoney } from "@/lib/formatMoney";
import { cn } from "@/lib/cn";

interface MoneyTextProps {
  cents: number | null | undefined;
  className?: string;
  withDecimals?: boolean;
}

export function MoneyText({ cents, className, withDecimals = false }: MoneyTextProps) {
  const formatted = formatMoney(cents ?? 0, withDecimals);

  return (
    <span className={cn("font-semibold tabular-nums text-text", className)}>
      {formatted}
    </span>
  );
}
