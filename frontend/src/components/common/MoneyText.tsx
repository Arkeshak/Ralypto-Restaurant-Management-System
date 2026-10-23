import React from 'react';
import { formatMoney } from '../../lib/formatMoney';
import { cn } from '../../lib/utils';

interface MoneyTextProps {
  cents: number | null | undefined;
  className?: string;
  currencyClassName?: string;
  amountClassName?: string;
  showCurrency?: boolean;
  currency?: string;
}

export const MoneyText: React.FC<MoneyTextProps> = ({
  cents,
  className,
  currencyClassName,
  amountClassName,
  showCurrency = true,
  currency = 'LKR',
}) => {
  const formatted = formatMoney(cents, { showCurrency: false });

  return (
    <span className={cn('font-mono font-bold tracking-tight inline-flex items-baseline gap-1', className)}>
      {showCurrency && (
        <span className={cn('text-xs font-semibold opacity-70 tracking-normal', currencyClassName)}>
          {currency}
        </span>
      )}
      <span className={cn('tabular-nums', amountClassName)}>{formatted}</span>
    </span>
  );
};
