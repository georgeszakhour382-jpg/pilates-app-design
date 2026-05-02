import { Compass, CalendarCheck, Heart, User, Sparkles } from 'lucide-react';
import type { ScreenId } from '../../App';
import { useT } from '../../lib/i18n';

// Shared between customer + instructor screens. Each item is a top-level
// destination both audiences can reach. New items: append, don't reorder
// (changing positions breaks muscle memory across the user base).
const items: {
  id: ScreenId;
  tKey: 'nav.discover' | 'nav.search' | 'nav.social' | 'nav.bookings' | 'nav.profile';
  icon: typeof Compass;
}[] = [
  { id: 'discover', tKey: 'nav.discover', icon: Compass },
  { id: 'search', tKey: 'nav.search', icon: Heart },
  { id: 'social', tKey: 'nav.social', icon: Sparkles },
  { id: 'bookings', tKey: 'nav.bookings', icon: CalendarCheck },
  { id: 'profile', tKey: 'nav.profile', icon: User },
];

export function BottomNav({
  active,
  onSelect,
}: {
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
}) {
  const t = useT();
  return (
    <nav className="absolute inset-x-0 bottom-0 h-[88px] hairline-t bg-bone/95 backdrop-blur-sm">
      <ul className="flex h-16 items-stretch px-1">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <li key={it.id} className="flex-1">
              <button
                onClick={() => onSelect(it.id)}
                className={[
                  'press-soft flex h-full w-full flex-col items-center justify-center gap-1 px-1',
                  isActive ? 'text-ink' : 'text-ink-60',
                ].join(' ')}
              >
                <Icon size={22} strokeWidth={isActive ? 2 : 1.6} />
                <span className="text-[10.5px] font-medium tracking-tight">{t(it.tKey)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
