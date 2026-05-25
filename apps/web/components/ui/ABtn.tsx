import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'ink';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-card hover:bg-accent-deep border-transparent',
  secondary: 'bg-card text-ink border-rule hover:bg-paper',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-paper-warm',
  ink: 'bg-ink text-card border-transparent hover:bg-ink-soft',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

interface ABtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function ABtn({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ABtnProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center font-sans font-medium border',
        'rounded-[2px] transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
