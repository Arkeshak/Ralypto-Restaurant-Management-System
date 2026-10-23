import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-surface hover:bg-brand-hover',
        secondary: 'bg-surface text-text border border-border hover:bg-bg',
        success: 'bg-success text-white hover:opacity-90',
        danger: 'bg-danger-soft text-danger border border-danger/30 hover:bg-danger hover:text-white',
        ghost: 'text-text hover:bg-bg',
      },
      size: {
        md: 'min-h-12 px-5 text-base',
        lg: 'min-h-14 px-6 text-lg',
      },
      full: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

type Props = Omit<React.ComponentProps<typeof motion.button>, 'children'> &
  VariantProps<typeof button> & {
    label: string;
    icon?: LucideIcon;
    loading?: boolean;
    children?: React.ReactNode;
  };

export const BigButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ label, icon: Icon, loading, variant, size, full, className, disabled, children, ...rest }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08 }}
        className={cn(button({ variant, size, full }), className)}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          Icon && <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
        )}
        <span>{children || label}</span>
      </motion.button>
    );
  }
);

BigButton.displayName = 'BigButton';
