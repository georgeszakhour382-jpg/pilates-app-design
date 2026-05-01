import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MoreHorizontal, Check, X, Loader2 } from 'lucide-react';
import type { ScreenId } from '../App';
import { Button } from '../components/ui/Button';
import { StickyCTA } from '../components/ui/StickyCTA';
import { useToast } from '../components/ui/Toast';
import { api, ApiError, type RosterEntry, type StudioSessionRow } from '../lib/api';
import { authStore } from '../lib/auth';

function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Beirut',
  }).format(new Date(iso));
}
function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Beirut',
  }).format(new Date(iso));
}

function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Roster({ goto }: { goto: (id: ScreenId) => void }) {
  const signedIn = !!authStore.accessToken();
  const meQuery = useQuery({
    queryKey: ['auth.me'],
    queryFn: () => api.auth.me(),
    enabled: signedIn,
  });
  const isStaff =
    !!meQuery.data && meQuery.data.role !== 'CUSTOMER' && meQuery.data.studioId !== null;

  // Sessions for today + the surrounding window. The roster screen lets the
  // operator pick which session's roster to look at — surface a "next class"
  // by default and a small picker for the rest.
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);
  const tomorrowEnd = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return new Date(d.getTime() + 2 * 86_400_000).toISOString();
  }, []);

  const sessionsQuery = useQuery({
    queryKey: ['classes.studioList', todayStart, tomorrowEnd, 'roster'],
    queryFn: () =>
      api.staff.classes.studioList({
        from: todayStart,
        to: tomorrowEnd,
        includeCancelled: false,
      }),
    enabled: isStaff,
  });

  const sessions = useMemo(() => {
    return (sessionsQuery.data ?? [])
      .filter((s) => s.status !== 'CANCELLED')
      .sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));
  }, [sessionsQuery.data]);

  // Default to the next class — the most useful row for "who's about to walk
  // in." Falls back to the first if all are in the past.
  const nextSession = useMemo<StudioSessionRow | null>(() => {
    const now = Date.now();
    return (
      sessions.find((s) => new Date(s.endsAt).getTime() > now) ?? sessions[0] ?? null
    );
  }, [sessions]);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const sessionId = activeSessionId ?? nextSession?.id ?? null;
  const session = sessions.find((s) => s.id === sessionId) ?? null;

  const rosterQuery = useQuery({
    queryKey: ['bookings.studioRoster', sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error('no session');
      return api.bookings.studioRoster(sessionId);
    },
    enabled: !!sessionId && isStaff,
  });

  if (!signedIn || (meQuery.data && !isStaff)) {
    return (
      <SignedOutOrCustomerWall
        goto={goto}
        message={
          meQuery.data && !isStaff
            ? "You're signed in as a customer. Sign in with a studio-staff phone (e.g. +96170100001) to see the roster."
            : 'Sign in with your studio-staff phone to see the roster.'
        }
      />
    );
  }

  const entries = rosterQuery.data ?? [];
  const checked = entries.filter((e) => e.status === 'CHECKED_IN').length;
  const confirmed = entries.filter((e) => e.status === 'CONFIRMED').length;
  const waitlist = entries.filter((e) => e.status === 'WAITLISTED').length;
  const noShow = entries.filter((e) => e.status === 'NO_SHOW').length;

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-32 scrollbar-none">
        <div className="px-4 pt-12">
          <div className="flex items-center justify-between">
            <button
              onClick={() => goto('instructor-dashboard')}
              className="press-soft -ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-stone-soft"
            >
              <ChevronLeft size={18} />
            </button>
            <button className="press-soft -mr-2 grid h-9 w-9 place-items-center rounded-full hover:bg-stone-soft">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        <header className="px-5 pt-2">
          <div className="label-eyebrow">Roster</div>
          <h1 className="font-display mt-1 text-[28px] leading-tight">
            {session
              ? `${session.className ?? 'Class'} · ${Math.round((new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime()) / 60_000)}m`
              : 'No upcoming class'}
          </h1>
          {session && (
            <p className="mt-1 text-[13px] text-ink-60">
              {fmtDate(session.startsAt)} · {fmtTime(session.startsAt)}
              {session.instructorName ? ` · ${session.instructorName}` : ''}
            </p>
          )}
        </header>

        {/* Session picker — only render when there's more than one. */}
        {sessions.length > 1 && (
          <div className="mt-4 -mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none">
            {sessions.map((s) => {
              const sel = s.id === sessionId;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className={[
                    'press-soft whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
                    sel
                      ? 'bg-ink text-bone'
                      : 'bg-bone text-ink hover:bg-sand border border-stone/60',
                  ].join(' ')}
                >
                  {fmtTime(s.startsAt)} · {s.className ?? 'Class'}
                </button>
              );
            })}
          </div>
        )}

        {/* Headline numbers */}
        <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-[20px] bg-stone mx-5 hairline-b">
          <Stat label="Checked in" value={String(checked)} />
          <Stat label="Confirmed" value={String(confirmed)} />
          <Stat
            label="Waitlist"
            value={String(waitlist)}
            sub={waitlist > 0 ? '1st up to roll over' : undefined}
          />
        </div>

        {rosterQuery.isLoading ? (
          <div className="mt-8 px-5 text-center text-[13px] text-ink-60">Loading roster…</div>
        ) : !sessionId ? (
          <div className="mt-8 mx-5 rounded-2xl border border-dashed border-stone p-6 text-center">
            <div className="font-display text-[18px]">No classes today or tomorrow</div>
            <p className="mt-1 text-[13px] text-ink-60">
              The roster appears here when there's a scheduled class to walk through.
            </p>
          </div>
        ) : (
          <>
            {/* Booked list */}
            <section className="mt-7">
              <div className="px-5 label-eyebrow">
                Booked · {entries.filter((e) => e.status !== 'WAITLISTED').length}
                {session ? `/${session.capacity}` : ''}
              </div>
              <ul className="mt-3 px-5 space-y-2">
                {entries
                  .filter((e) => e.status !== 'WAITLISTED')
                  .map((e) => (
                    <RosterRow key={e.bookingId} entry={e} sessionId={sessionId} />
                  ))}
                {entries.filter((e) => e.status !== 'WAITLISTED').length === 0 && (
                  <li className="rounded-2xl border border-dashed border-stone bg-bone px-5 py-6 text-center text-[13px] text-ink-60">
                    Nobody's booked yet.
                  </li>
                )}
              </ul>
            </section>

            {/* Waitlist */}
            {waitlist > 0 && (
              <section className="mt-7">
                <div className="px-5 label-eyebrow">Waitlist · {waitlist}</div>
                <ul className="mt-3 px-5 space-y-2">
                  {entries
                    .filter((e) => e.status === 'WAITLISTED')
                    .map((e) => (
                      <li
                        key={e.bookingId}
                        className="flex items-center gap-3 rounded-2xl border border-dashed border-stone bg-bone p-3.5"
                      >
                        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-sand text-[12px] font-medium">
                          {initials(e.customerFullName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-medium">{e.customerFullName}</div>
                          <div className="text-[12px] text-ink-60 num">
                            {e.customerPhone}
                            {e.waitlistPosition ? ` · #${e.waitlistPosition} on waitlist` : ''}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </section>
            )}

            <p className="mt-9 px-5 text-center font-display italic text-[12px] text-ink-60">
              {checked} checked in · {confirmed - checked} still expected · {noShow} no-show
            </p>
          </>
        )}
      </div>

      <StickyCTA
        info={
          session ? (
            <>
              {checked}/{confirmed + checked} checked in · {fmtTime(session.startsAt)}
            </>
          ) : (
            <>No active class</>
          )
        }
      >
        <Button block size="md" disabled={!session}>
          Done
        </Button>
      </StickyCTA>
    </div>
  );
}

function RosterRow({ entry, sessionId }: { entry: RosterEntry; sessionId: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const isIn = entry.status === 'CHECKED_IN';
  const isNoShow = entry.status === 'NO_SHOW';

  const checkIn = useMutation({
    mutationFn: () => api.bookings.checkIn(entry.bookingId),
    onSuccess: () => {
      toast.show(`${entry.customerFullName.split(' ')[0]} checked in.`);
      void qc.invalidateQueries({ queryKey: ['bookings.studioRoster', sessionId] });
    },
    onError: (err) => {
      toast.show(
        err instanceof ApiError ? err.message : "Couldn't check in — try again.",
        'warn',
      );
    },
  });

  const markNoShow = useMutation({
    mutationFn: () => api.bookings.markNoShow(entry.bookingId),
    onSuccess: () => {
      toast.show(`${entry.customerFullName.split(' ')[0]} marked no-show.`);
      void qc.invalidateQueries({ queryKey: ['bookings.studioRoster', sessionId] });
    },
    onError: (err) => {
      toast.show(
        err instanceof ApiError ? err.message : "Couldn't update — try again.",
        'warn',
      );
    },
  });

  return (
    <li className="flex items-start gap-3 rounded-2xl bg-bone p-3.5 hairline-b">
      <div
        className={[
          'grid h-11 w-11 flex-shrink-0 place-items-center rounded-full font-medium',
          isIn ? 'bg-sage text-bone' : isNoShow ? 'bg-stone text-ink-60' : 'bg-sand text-ink',
        ].join(' ')}
      >
        <span className="text-[13px]">{initials(entry.customerFullName)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14.5px] font-medium leading-tight">{entry.customerFullName}</span>
          {entry.paidVia === 'PACKAGE_CREDIT' && (
            <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-medium text-ink-60">
              Pack
            </span>
          )}
          {entry.paidVia === 'CASH_AT_STUDIO' && (
            <span className="rounded-full bg-rose/40 px-2 py-0.5 text-[10px] font-medium text-ink">
              Cash
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[12px] text-ink-60 num">{entry.customerPhone}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {isIn ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2 py-1 text-[11px] font-medium text-sage">
            <Check size={11} /> In
          </span>
        ) : isNoShow ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-soft px-2 py-1 text-[11px] font-medium text-ink-60">
            <X size={11} /> No-show
          </span>
        ) : (
          <button
            onClick={() => checkIn.mutate()}
            disabled={checkIn.isPending}
            className="press-soft inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-bone"
          >
            {checkIn.isPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            Check in
          </button>
        )}
        {!isIn && !isNoShow && (
          <button
            onClick={() => markNoShow.mutate()}
            disabled={markNoShow.isPending}
            className="press-soft text-[11px] text-ink-60 underline underline-offset-2"
          >
            No-show
          </button>
        )}
      </div>
    </li>
  );
}

function SignedOutOrCustomerWall({
  goto,
  message,
}: {
  goto: (id: ScreenId) => void;
  message: string;
}) {
  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-32 scrollbar-none">
        <div className="px-4 pt-12">
          <button
            onClick={() => goto('instructor-dashboard')}
            className="press-soft -ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-stone-soft"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
        <header className="px-5 pt-2">
          <div className="label-eyebrow">Roster</div>
          <h1 className="font-display mt-1 text-[28px] leading-tight">Staff sign-in needed</h1>
        </header>
        <div className="mx-5 mt-8 rounded-2xl border border-dashed border-stone p-6 text-center">
          <p className="text-[14px] text-ink/85 leading-relaxed">{message}</p>
          <Button size="md" className="mt-5" onClick={() => goto('onboarding')}>
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-bone p-4">
      <div className="label-eyebrow">{label}</div>
      <div className="mt-1 font-display num text-[26px] leading-none">{value}</div>
      {sub && <div className="mt-1 text-[10px] text-ink-60">{sub}</div>}
    </div>
  );
}
