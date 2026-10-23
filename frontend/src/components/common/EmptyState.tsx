import { BigButton } from "./BigButton";
import { PackageOpen, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-card border border-dashed border-border bg-surface",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-muted mb-4">
        <Icon className="h-8 w-8" aria-hidden />
      </div>
      <h3 className="text-xl font-semibold tracking-[-0.02em] text-text">{title}</h3>
      <p className="mt-1.5 max-w-md text-base text-muted">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <BigButton
            label={actionLabel}
            icon={actionIcon}
            variant="primary"
            size="md"
            onClick={onAction}
          />
        </div>
      )}
    </div>
  );
}
