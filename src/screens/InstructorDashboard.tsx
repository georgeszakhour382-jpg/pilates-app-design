import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar, Users, Sparkles, ChevronRight, Plus } from 'lucide-react';
import { instructorToday } from '../data/mock';
import type { ScreenId } from '../App';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { authStore } from '../lib/auth';

function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Beirut',
  }).format(new Date(iso));
}

export function InstructorDashboard({ goto }: { goto: (id: ScreenId) => void }) {
  const signedIn = !!authStore.accessToken();
  const meQuery = useQuery({
    queryKey: ['auth.me'],
    queryFn: () => api.auth.me(),
    enabled: signedIn,
  });
  const isStaff =
    !!meQuery.data && meQuery.data.role !== 'CUSTOMER' && meQuery.data.studioId !== null;

  // Today's schedule, real. Window = local-day midnight → midnight.
  const { fromIso, toIso } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 86_400_000);
    return { fromIso: start.toISOString(), toIso: end.toISOString() };
  }, []);

  const sessionsQuery = useQuery({
    queryKey: ['classes.studioList', fromIso, toIso, 'today'],
    queryFn: () =>
      api.staff.classes.studioList({ from: fromIso, to: toIso, includeCancelled: false }),
    enabled: isStaff,
  });

  // Real revenue snapshot for the week. Fallback to mock if backend not
  // reachable or staff not signed in.
  const summaryQuery = useQuery({
    queryKey: ['reports.summary', 'WEEK'],
    queryFn: () => api.staff.reports.summary('WEEK'),
    enabled: isStaff,
  });

  const todaySessions = useMemo(
    () => (sessionsQuery.data ?? []).filter((s) => s.status !== 'CANCELLED'),
    [sessionsQuery.data],
  );

  // Greeting + name from the JWT.
  const firstName = (meQuery.data?.fullName ?? 'there').split(/\s+/)[0];
  const todayLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Beirut',
  }).format(new Date());

  // Revenue card. When real summary is available, use net revenue this week.
  // The "vs last week" comparison still falls back to mock until we plumb a
  // dedicated procedure for that.
  const netMinor = summaryQuery.data
    ? BigInt(summaryQuery.data.revenue.net.amount)
    : null;
  const netMajor =
    netMinor !== null
      ? Number(netMinor) / 100 // backend stores minor units
      : instructorToday.earningsThisWeek;
  const change =
    ((instructorToday.earningsThisWeek - instructorToday.earningsLastWeek) /
      instructorToday.earningsLastWeek) *
    100;

  const completeness = Math.round(instructorToday.profileCompleteness * 100);

  if (!signedIn || (meQuery.data && !isStaff)) {
    return (
      <div className="fade-in relative h-full bg-bone">
        <div className="absolute inset-0 overflow-y-auto pb-12 scrollbar-none">
          <header className="px-5 pt-14">
            <div className="label-eyebrow">Teach</div>
            <h1 className="font-display mt-1 text-[28px] leading-tight">
              Staff sign-in needed
            </h1>
          </header>
          <div className="mx-5 mt-8 rounded-2xl border border-dashed border-stone p-6 text-center">
            <p className="text-[14px] text-ink/85 leading-relaxed">
              {meQuery.data && !isStaff
                ? "You're signed in as a customer. Sign in with a studio-staff phone (the seed plants +96170100001 / +96170100002 / +96170100003) to see today's classes, manage the schedule and check in clients."
                : "Sign in with your studio-staff phone to see today's classes, manage the schedule and check in clients."}
            </p>
            <Button size="md" className="mt-5" onClick={() => goto('onboarding')}>
              Sign in
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-12 scrollbar-none">
        {/* Header */}
        <header className="px-5 pt-14">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-eyebrow">{todayLabel}</div>
              <h1 className="font-display mt-1 text-[30px] leading-[1.1]">
                Hello, <span className="italic">{firstName}</span>.
              </h1>
            </div>
            <button
              onClick={() => goto('discover')}
              className="press-soft text-[12px] font-medium underline underline-offset-4"
            >
              Switch view
            </button>
          </div>
        </header>

        {/* Earnings */}
        <section className="mt-6 px-5">
          <div className="rounded-[20px] bg-ink p-5 text-bone">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="label-eyebrow !text-bone/60">
                  Net revenue · this week{summaryQuery.data ? '' : ' (estimate)'}
                </div>
                <div className="font-display mt-1 num text-[40px] leading-none">
                  ${Math.round(netMajor)}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[12px] text-bone/85">
                <TrendingUp size={12} />
                <span className="num">+{change.toFixed(0)}%</span>
              </div>
            </div>
            <p className="mt-4 text-[13px] text-bone/70">
              {summaryQuery.data
                ? `${summaryQuery.data.bookings.checkedIn} checked-in · ${summaryQuery.data.bookings.fillRatePct}% fill rate`
                : `Next payout · ${instructorToday.payoutNext}`}
            </p>
          </div>
        </section>

        {/* Today's schedule */}
        <section className="mt-7 px-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="label-eyebrow">Today's schedule</div>
              <h2 className="font-display mt-1 text-[22px]">
                {sessionsQuery.isLoading
                  ? 'Loading…'
                  : `${todaySessions.length} ${todaySessions.length === 1 ? 'class' : 'classes'}`}
              </h2>
            </div>
            <button
              onClick={() => goto('edit-schedule')}
              className="press-soft inline-flex items-center gap-1 rounded-full bg-sand px-3 py-1.5 text-[12px] font-medium"
            >
              <Plus size={14} /> New
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {todaySessions.length === 0 && !sessionsQuery.isLoading && (
              <li className="rounded-2xl border border-dashed border-stone bg-bone px-5 py-6 text-center text-[13px] text-ink-60">
                Nothing scheduled today.
              </li>
            )}
            {todaySessions.map((c) => {
              const full = c.bookedCount >= c.capacity;
              const durationMin = Math.round(
                (new Date(c.endsAt).getTime() - new Date(c.startsAt).getTime()) / 60_000,
              );
              return (
                <li key={c.id}>
                  <button
                    onClick={() => goto('roster')}
                    className="press-soft flex w-full items-center gap-4 rounded-2xl bg-bone p-4 text-start hairline-b"
                  >
                    <div className="num text-[18px] font-display">{fmtTime(c.startsAt)}</div>
                    <div className="flex-1">
                      <div className="text-[14.5px] font-medium">
                        {c.className ?? c.type ?? 'Class'} · {durationMin}m
                      </div>
                      <div className="mt-0.5 text-[12px] text-ink-60">
                        {c.instructorName ?? 'No instructor'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="num text-[13px] font-medium">
                        {c.bookedCount}/{c.capacity}
                      </span>
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-[10px] font-medium',
                          full ? 'bg-rose/60 text-ink' : 'bg-sand text-ink-60',
                        ].join(' ')}
                      >
                        {full ? 'Full' : 'Bookable'}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Quick actions */}
        <section className="mt-7 px-5">
          <div className="label-eyebrow">Quick actions</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ActionCard
              icon={Calendar}
              title="Edit schedule"
              body="Add a class, block a date."
              onClick={() => goto('edit-schedule')}
            />
            <ActionCard
              icon={Users}
              title="Roster"
              body="See who’s booked today."
              onClick={() => goto('roster')}
            />
            <ActionCard
              icon={TrendingUp}
              title="Earnings"
              body="Statements & payouts."
              onClick={() => goto('earnings')}
            />
            <ActionCard
              icon={Sparkles}
              title="Profile"
              body="Bio, photos, certs."
              onClick={() => goto('instructor')}
            />
          </div>
        </section>

        {/* Profile completeness */}
        <section className="mt-7 mx-5 rounded-[20px] bg-sand p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-eyebrow">Profile completeness</div>
              <div className="font-display mt-1 num text-[28px] leading-none">{completeness}%</div>
            </div>
            <Button size="sm" variant="tertiary" onClick={() => goto('instructor')}>
              Finish
            </Button>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bone">
            <div className="h-full bg-ink" style={{ width: `${completeness}%` }} />
          </div>
          <ul className="mt-4 space-y-2 text-[13px]">
            <Done>Bio added</Done>
            <Done>Three photos uploaded</Done>
            <Todo>Add a video introduction (1–2 min)</Todo>
          </ul>
        </section>

        <p className="mt-10 px-5 text-center font-display italic text-[12px] text-ink-60">
          “Concentration. Control. Centering. Precision. Breath. Flow.” — Joseph Pilates
        </p>
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  body,
  onClick,
}: {
  icon: typeof Calendar;
  title: string;
  body: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="press-soft flex flex-col items-start gap-2 rounded-2xl border border-stone bg-bone p-4 text-start"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-sand">
        <Icon size={16} />
      </span>
      <div className="text-[14px] font-medium">{title}</div>
      <div className="text-[12px] text-ink-60">{body}</div>
      <span className="ml-auto text-ink-60">
        <ChevronRight size={14} />
      </span>
    </button>
  );
}

function Done({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="grid h-4 w-4 place-items-center rounded-full bg-sage text-bone">
        <span className="block h-1 w-1 rounded-full bg-bone" />
      </span>
      <span className="text-ink/85">{children}</span>
    </li>
  );
}
function Todo({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-ink-60">
      <span className="grid h-4 w-4 place-items-center rounded-full border border-stone" />
      <span>{children}</span>
    </li>
  );
}
