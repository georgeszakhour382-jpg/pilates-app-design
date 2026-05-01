import { type ReactNode } from 'react';
import { StatusBar } from './ui/StatusBar';

export function PhoneFrame({
  children,
  statusBarTone = 'dark',
}: {
  children: ReactNode;
  statusBarTone?: 'dark' | 'light';
}) {
  return (
    <div
      className="relative overflow-hidden bg-bone"
      style={{
        width: 390,
        height: 844,
        borderRadius: 48,
        boxShadow:
          '0 0 0 12px #1f1b16, 0 0 0 13px #2a251f, 0 30px 80px rgba(31,27,22,0.35)',
      }}
    >
      <StatusBar tone={statusBarTone} />
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 36 }}>
        {children}
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-2.5 h-7 w-32 -translate-x-1/2 rounded-full bg-ink"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-2.5 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-ink/85"
        aria-hidden
      />
    </div>
  );
}
