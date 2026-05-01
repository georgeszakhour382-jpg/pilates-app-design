interface Props {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'pill';
}

const radius: Record<NonNullable<Props['rounded']>, string> = {
  sm: 'rounded-md',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  pill: 'rounded-full',
};

export function Skeleton({ className = 'h-4 w-full', rounded = 'md' }: Props) {
  return <div className={['shimmer', radius[rounded], className].join(' ')} />;
}
