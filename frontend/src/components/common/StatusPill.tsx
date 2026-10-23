import React from 'react';
import { cn } from '../../lib/utils';

export type StatusType = 'free' | 'busy' | 'waiting' | 'info';

interface StatusPillProps {
  status: StatusType | string;
  label?: string;
  className?: string;
  dotOnly?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  className,
  dotOnly = false,
}) => {
  let normalizedStatus: StatusType = 'info';

  if (['free', 'available', 'ready', 'completed', 'paid'].includes(status.toLowerCase())) {
    normalizedStatus = 'free';
  } else if (['busy', 'occupied', 'problem', 'voided', 'failed', 'canceled'].includes(status.toLowerCase())) {
    normalizedStatus = 'busy';
  } else if (['waiting', 'preparing', 'pending', 'new', 'draft'].includes(status.toLowerCase())) {
    normalizedStatus = 'waiting';
  } else {
    normalizedStatus = 'info';
  }

  const colorStyles: Record<StatusType, { bg: string; text: string; dot: string; border: string }> = {
    free: {
      bg: 'bg-emerald-950/50',
      text: 'text-emerald-400',
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
      border: 'border-emerald-800/50',
    },
    busy: {
      bg: 'bg-red-950/50',
      text: 'text-red-400',
      dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
      border: 'border-red-800/50',
    },
    waiting: {
      bg: 'bg-amber-950/50',
      text: 'text-amber-400',
      dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      border: 'border-amber-800/50',
    },
    info: {
      bg: 'bg-sky-950/50',
      text: 'text-sky-400',
      dot: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]',
      border: 'border-sky-800/50',
    },
  };

  const style = colorStyles[normalizedStatus];

  if (dotOnly) {
    return <span className={cn('h-3 w-3 rounded-full inline-block', style.dot, className)} />;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border',
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      <span className={cn('h-2 w-2 rounded-full inline-block', style.dot)} />
      {label || status}
    </span>
  );
};
