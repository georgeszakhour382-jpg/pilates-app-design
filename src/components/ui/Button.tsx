import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'ghost';
type Size = 'lg' | 'md' | 'sm';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-ink text-bone hover:bg-[color:var(--color-ink)]/95 disabled:bg-ink-30 disabled:text-bone',
  secondary:
    'bg-clay text-bone hover:bg-[color:var(--color-clay)]/95 disabled:bg-clay-soft',
  tertiary:
    'bg-sand text-ink hover:bg-stone-soft border border-stone/60',
  ghost: 'bg-transparent text-ink hover:bg-stone-soft',
};

const sizeClass: Record<Size, string> = {
  lg: 'h-14 px-7 text-[15px]',
  md: 'h-12 px-6 text-[14px]',
  sm: 'h-10 px-4 text-[13px]',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'lg', block, leading, trailing, className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={[
        'press-soft inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight',
        'transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
        variantClass[variant],
        sizeClass[size],
        block ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
});
