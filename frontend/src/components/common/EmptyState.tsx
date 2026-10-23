import React from 'react';
import { BigButton } from './BigButton';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 ${className || ''}`}
    >
      <div className="p-4 rounded-2xl bg-zinc-900 text-zinc-500 mb-4 border border-zinc-800">
        {icon || <PackageOpen className="w-10 h-10" />}
      </div>
      <h3 className="text-lg font-bold text-zinc-200">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-400">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <BigButton variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </BigButton>
        </div>
      )}
    </div>
  );
};
