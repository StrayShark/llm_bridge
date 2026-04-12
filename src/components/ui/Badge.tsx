import * as React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface-container text-on-surface-variant',
      success: 'bg-green-500/20 text-green-400',
      warning: 'bg-tertiary/20 text-tertiary',
      error: 'bg-error/20 text-error',
      primary: 'bg-primary/20 text-primary'
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium
          ${variants[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };
