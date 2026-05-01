import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

export function ScreenHeader({
  title,
  onBack,
  trailing,
  transparent,
}: {
  title?: string;
  onBack?: () => void;
  trailing?: ReactNode;
  transparent?: boolean;
}) {
  return (
    <div
      className={[
        'flex h-12 items-center justify-between px-4 pt-1',
        transparent ? '' : 'bg-bone',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        {onBack ? (
          <button
            onClick={onBack}
            className={[
              'press-soft -ml-2 grid h-9 w-9 place-items-center rounded-full',
              transparent ? 'bg-bone/85 text-ink shadow-sm' : 'text-ink hover:bg-stone-soft',
            ].join(' ')}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}
        {title ? <h1 className="text-[16px] font-medium">{title}</h1> : null}
      </div>
      <div className="flex items-center gap-1">{trailing}</div>
    </div>
  );
}
