import { useState } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { Onboarding } from './screens/Onboarding';
import { Discover } from './screens/Discover';
import { StudioDetail } from './screens/StudioDetail';
import { InstructorProfile } from './screens/InstructorProfile';
import { Booking } from './screens/Booking';
import { MyBookings } from './screens/MyBookings';
import { Search } from './screens/Search';
import { Profile } from './screens/Profile';
import { InstructorDashboard } from './screens/InstructorDashboard';
import { Roster } from './screens/Roster';
import { Earnings } from './screens/Earnings';
import { EditSchedule } from './screens/EditSchedule';

export type ScreenId =
  | 'onboarding'
  | 'discover'
  | 'studio'
  | 'instructor'
  | 'booking'
  | 'bookings'
  | 'search'
  | 'profile'
  | 'instructor-dashboard'
  | 'edit-schedule'
  | 'roster'
  | 'earnings';

const screens: { id: ScreenId; label: string; tone?: 'dark' | 'light'; group?: 'teach' }[] = [
  { id: 'onboarding', label: 'Onboarding', tone: 'light' },
  { id: 'discover', label: 'Discover' },
  { id: 'studio', label: 'Studio', tone: 'light' },
  { id: 'instructor', label: 'Instructor', tone: 'light' },
  { id: 'booking', label: 'Booking' },
  { id: 'bookings', label: 'My bookings' },
  { id: 'search', label: 'Search' },
  { id: 'profile', label: 'Profile' },
  { id: 'instructor-dashboard', label: 'Teach', group: 'teach' },
  { id: 'edit-schedule', label: 'Schedule', group: 'teach' },
  { id: 'roster', label: 'Roster', group: 'teach' },
  { id: 'earnings', label: 'Earnings', group: 'teach' },
];

export default function App() {
  const [active, setActive] = useState<ScreenId>('discover');
  const tone = screens.find((s) => s.id === active)?.tone ?? 'dark';

  return (
    <div className="min-h-screen w-full bg-stone-soft">
      <header className="mx-auto max-w-[1280px] px-6 pt-10 pb-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="label-eyebrow">Design prototype</div>
            <h1 className="font-display mt-1 text-[28px] leading-tight">
              Pilates Marketplace · <span className="italic">9 screens</span>
            </h1>
          </div>
          <div className="hidden text-[12px] text-ink-60 sm:block">
            390 × 844 mobile · React + Tailwind v4
          </div>
        </div>

        {/* Screen switcher */}
        <div className="mt-5 -mx-6 overflow-x-auto px-6 pb-2 scrollbar-none">
          <div className="flex items-center gap-2">
            {screens.map((s, i) => {
              const prev = screens[i - 1];
              const showDivider = !!prev && prev.group !== s.group;
              return (
                <span key={s.id} className="flex items-center gap-2">
                  {showDivider && (
                    <span className="mx-1 h-5 w-px bg-stone" aria-hidden />
                  )}
                  <button
                    onClick={() => setActive(s.id)}
                    className={[
                      'press-soft whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition-colors',
                      active === s.id
                        ? 'bg-ink text-bone'
                        : 'bg-bone text-ink hover:bg-sand border border-stone/60',
                    ].join(' ')}
                  >
                    {s.label}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      </header>

      {/* Stage */}
      <main className="mx-auto flex max-w-[1280px] justify-center px-6 pb-24 pt-4">
        <PhoneFrame key={active} statusBarTone={tone}>
          <ScreenView id={active} goto={setActive} />
        </PhoneFrame>
      </main>

      <footer className="mx-auto max-w-[1280px] px-6 pb-12 text-center text-[12px] text-ink-60">
        Click any chip above to switch screens. Use the in-app nav, back arrows, and CTAs to flow between
        related screens — they’re all linked.
      </footer>
    </div>
  );
}

function ScreenView({ id, goto }: { id: ScreenId; goto: (id: ScreenId) => void }) {
  switch (id) {
    case 'onboarding':
      return <Onboarding />;
    case 'discover':
      return <Discover goto={goto} />;
    case 'studio':
      return <StudioDetail goto={goto} />;
    case 'instructor':
      return <InstructorProfile goto={goto} />;
    case 'booking':
      return <Booking goto={goto} />;
    case 'bookings':
      return <MyBookings goto={goto} />;
    case 'search':
      return <Search goto={goto} />;
    case 'profile':
      return <Profile goto={goto} />;
    case 'instructor-dashboard':
      return <InstructorDashboard goto={goto} />;
    case 'edit-schedule':
      return <EditSchedule goto={goto} />;
    case 'roster':
      return <Roster goto={goto} />;
    case 'earnings':
      return <Earnings goto={goto} />;
  }
}
