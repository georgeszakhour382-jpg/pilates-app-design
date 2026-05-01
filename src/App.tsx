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
import { useT } from './lib/i18n';

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

const screens: { id: ScreenId; tone?: 'dark' | 'light'; group?: 'teach' }[] = [
  { id: 'onboarding', tone: 'light' },
  { id: 'discover' },
  { id: 'studio', tone: 'light' },
  { id: 'instructor', tone: 'light' },
  { id: 'booking' },
  { id: 'bookings' },
  { id: 'search' },
  { id: 'profile' },
  { id: 'instructor-dashboard', group: 'teach' },
  { id: 'edit-schedule', group: 'teach' },
  { id: 'roster', group: 'teach' },
  { id: 'earnings', group: 'teach' },
];

export default function App() {
  const t = useT();
  const [active, setActive] = useState<ScreenId>('discover');
  // Selected entities used for cross-screen navigation. The prototype's
  // screen switcher is global; these track "which studio / which session
  // should the next screen render against."
  const [activeStudioSlug, setActiveStudioSlug] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const tone = screens.find((s) => s.id === active)?.tone ?? 'dark';

  return (
    <div className="min-h-screen w-full bg-stone-soft">
      <header className="mx-auto max-w-[1280px] px-6 pt-10 pb-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="label-eyebrow">{t.switcher.eyebrow}</div>
            <h1 className="font-display mt-1 text-[28px] leading-tight">{t.switcher.title}</h1>
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
                  {showDivider && <span className="mx-1 h-5 w-px bg-stone" aria-hidden />}
                  <button
                    onClick={() => setActive(s.id)}
                    className={[
                      'press-soft whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition-colors',
                      active === s.id
                        ? 'bg-ink text-bone'
                        : 'bg-bone text-ink hover:bg-sand border border-stone/60',
                    ].join(' ')}
                  >
                    {t.switcher.screens[s.id]}
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
          <ScreenView
            id={active}
            goto={setActive}
            activeStudioSlug={activeStudioSlug}
            activeSessionId={activeSessionId}
            setActiveStudioSlug={setActiveStudioSlug}
            setActiveSessionId={setActiveSessionId}
          />
        </PhoneFrame>
      </main>

      <footer className="mx-auto max-w-[1280px] px-6 pb-12 text-center text-[12px] text-ink-60">
        {t.switcher.footer}
      </footer>
    </div>
  );
}

interface ScreenProps {
  id: ScreenId;
  goto: (id: ScreenId) => void;
  activeStudioSlug: string | null;
  activeSessionId: string | null;
  setActiveStudioSlug: (slug: string | null) => void;
  setActiveSessionId: (id: string | null) => void;
}

function ScreenView(props: ScreenProps) {
  const { id, goto, activeStudioSlug, activeSessionId, setActiveStudioSlug, setActiveSessionId } =
    props;
  switch (id) {
    case 'onboarding':
      return <Onboarding goto={goto} />;
    case 'discover':
      return <Discover goto={goto} setActiveStudioSlug={setActiveStudioSlug} />;
    case 'studio':
      return (
        <StudioDetail
          goto={goto}
          slug={activeStudioSlug}
          setActiveSessionId={setActiveSessionId}
        />
      );
    case 'instructor':
      return <InstructorProfile goto={goto} />;
    case 'booking':
      return <Booking goto={goto} sessionId={activeSessionId} />;
    case 'bookings':
      return <MyBookings goto={goto} />;
    case 'search':
      return <Search goto={goto} setActiveStudioSlug={setActiveStudioSlug} />;
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
