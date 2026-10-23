import React from "react";
import { BigButton } from "./BigButton";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: "primary" | "secondary" | "success" | "danger";
  };
  children?: React.ReactNode;
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/40">
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-text leading-tight">{title}</h1>
        {description && <p className="mt-1 text-base text-muted">{description}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {children}
        {action && (
          <BigButton
            label={action.label}
            icon={action.icon}
            onClick={action.onClick}
            loading={action.loading}
            disabled={action.disabled}
            variant={action.variant ?? "primary"}
            size="md"
          />
        )}
      </div>
    </div>
  );
}
