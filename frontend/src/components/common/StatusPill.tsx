import { CheckCircle2, Clock, Flame, Info, AlertTriangle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

const tones = {
  free: { cls: 'bg-success-soft text-success', Icon: CheckCircle2 },
  waiting: { cls: 'bg-warning-soft text-warning', Icon: Clock },
  busy: { cls: 'bg-busy-soft text-busy', Icon: Flame },
  info: { cls: 'bg-info-soft text-info', Icon: Info },
  danger: { cls: 'bg-danger-soft text-danger', Icon: AlertTriangle },
} satisfies Record<string, { cls: string; Icon: LucideIcon }>;

export type Tone = keyof typeof tones;

interface StatusPillProps {
  tone?: Tone;
  status?: string;
  label?: string;
  className?: string;
}

export function StatusPill({ tone, status, label, className }: StatusPillProps) {
  let resolvedTone: Tone = tone || 'info';

  if (!tone && status) {
    const s = status.toLowerCase();
    if (['free', 'available', 'ready', 'completed', 'paid'].includes(s)) {
      resolvedTone = 'free';
    } else if (['busy', 'occupied'].includes(s)) {
      resolvedTone = 'busy';
    } else if (['waiting', 'preparing', 'pending', 'new', 'draft', 'bill_requested', 'billed'].includes(s)) {
      resolvedTone = 'waiting';
    } else if (['voided', 'danger', 'failed', 'canceled'].includes(s)) {
      resolvedTone = 'danger';
    } else {
      resolvedTone = 'info';
    }
  }

  const { cls, Icon } = tones[resolvedTone] || tones.info;
  const displayLabel = label || status || resolvedTone;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium capitalize',
        cls,
        className
      )}
    >
      <Icon className="h-4 w-4" aria-hidden strokeWidth={1.75} />
      <span>{displayLabel}</span>
    </span>
  );
}
