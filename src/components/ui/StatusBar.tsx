import { Signal, Wifi, BatteryFull } from 'lucide-react';

export function StatusBar({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const color = tone === 'light' ? 'text-bone' : 'text-ink';
  return (
    <div className={['absolute inset-x-0 top-0 z-20 flex items-center justify-between px-7 pt-3 num text-[13px] font-medium', color].join(' ')}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal size={14} strokeWidth={2.4} />
        <Wifi size={14} strokeWidth={2.4} />
        <BatteryFull size={16} strokeWidth={2.4} />
      </div>
    </div>
  );
}
