import type { ReactNode } from 'react';

export function StickyCTA({ children, info }: { children: ReactNode; info?: ReactNode }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 px-5 pt-4 pb-7 hairline-t bg-bone"
      style={{ boxShadow: 'var(--shadow-sticky)' }}
    >
      {info ? <div className="mb-3 text-[12px] text-ink-60">{info}</div> : null}
      {children}
    </div>
  );
}
