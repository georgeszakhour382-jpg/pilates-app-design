import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Sheet({
  open,
  title,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-30">
      <div
        className="absolute inset-0 bg-ink/30"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 sheet-in flex flex-col bg-bone"
        style={{
          maxHeight: '92%',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        <div className="flex items-center justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-stone" />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h3 className="font-display text-[22px]">{title}</h3>
          <button
            onClick={onClose}
            className="press-soft -mr-2 rounded-full p-2 text-ink-60 hover:bg-stone-soft"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer ? (
          <div className="px-5 pt-3 pb-7 hairline-t">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
