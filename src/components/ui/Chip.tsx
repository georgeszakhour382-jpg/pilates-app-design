import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  leading?: ReactNode;
}

export function Chip({ selected, leading, className = '', children, ...rest }: Props) {
  return (
    <button
      className={[
        'press-soft inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
        selected
          ? 'bg-ink text-bone'
          : 'bg-sand text-ink hover:bg-stone-soft border border-stone/60',
        className,
      ].join(' ')}
      {...rest}
    >
      {leading}
      {children}
    </button>
  );
}
