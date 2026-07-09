import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97]';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-600 to-accent-600 bg-[length:150%_100%] bg-left text-white shadow-glow hover:bg-right hover:shadow-glow-lg hover:-translate-y-px',
  secondary:
    'border border-slate-200 bg-white/80 text-slate-700 shadow-sm backdrop-blur hover:border-brand-300 hover:text-brand-700 hover:shadow-card',
  danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md hover:shadow-lg hover:-translate-y-px',
  ghost: 'text-slate-600 hover:bg-brand-50 hover:text-brand-700',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
