import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        brand:
          'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-900/30 font-semibold',
        secondary:
          'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60',
        outline:
          'border-2 border-zinc-700 bg-transparent hover:bg-zinc-800/60 text-zinc-200',
        destructive:
          'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30',
        success:
          'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30',
        ghost: 'bg-transparent hover:bg-zinc-800/60 text-zinc-300',
      },
      size: {
        touch: 'min-h-[48px] px-5 py-3 text-base',
        'touch-lg': 'min-h-[56px] px-6 py-4 text-lg font-bold',
        sm: 'h-10 px-4 text-sm',
        icon: 'h-12 w-12 p-0 flex items-center justify-center',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'brand',
      size: 'touch',
      fullWidth: false,
    },
  }
);

export interface BigButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
}

export const BigButton = React.forwardRef<HTMLButtonElement, BigButtonProps>(
  ({ className, variant, size, fullWidth, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {icon && <span className="mr-2.5 inline-flex items-center">{icon}</span>}
        <span>{children}</span>
      </button>
    );
  }
);

BigButton.displayName = 'BigButton';
