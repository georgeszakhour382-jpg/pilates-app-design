import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus } from 'lucide-react';
import type { ScreenId } from '../App';
import { BottomNav } from '../components/ui/BottomNav';
import { Button } from '../components/ui/Button';
import { api, ApiError } from '../lib/api';
import { authStore } from '../lib/auth';
import { enrichBooking } from '../lib/displayAdapters';
import { studios as mockStudios } from '../data/mock';

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&h=700&q=80';

const heroForStudio = (studioId: string, studioName: string): string => {
  const m = mockStudios.find((s) => s.id === studioId || s.name === studioName);
  return m?.hero ?? FALLBACK_HERO;
};

const neighborhoodForStudio = (studioId: string, studioName: string): string | null => {
  const m = mockStudios.find((s) => s.id === studioId || s.name === studioName);
  return m?.neighborhood ?? null;
};

export function MyBookings({ goto }: { goto: (id: ScreenId) => void }) {
  const signedIn = !!authStore.accessToken();

  const upcomingQuery = useQuery({
    queryKey: ['bookings.listMine', 'UPCOMING'],
    queryFn: () => api.bookings.listMine('UPCOMING'),
    enabled: signedIn,
  });

  const pastQuery = useQuery({
    queryKey: ['bookings.listMine', 'PAST'],
    queryFn: () => api.bookings.listMine('PAST'),
    enabled: signedIn,
  });

  const qc = useQueryClient();
  const cancel = useMutation({
    mutationFn: (bookingId: string) => api.bookings.cancel(bookingId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings.listMine'] });
    },
  });

  if (!signedIn) {
    return (
      <div className="fade-in relative h-full bg-bone">
        <div className="absolute inset-0 overflow-y-auto pb-[160px] scrollbar-none">
          <header className="px-5 pt-14">
            <div className="label-eyebrow">Your practice</div>
            <h1 className="font-display mt-1 text-[30px] leading-[1.1]">Bookings</h1>
          </header>
          <div className="mt-10 px-5">
            <div className="rounded-2xl border border-dashed border-stone bg-bone px-5 py-10 text-center">
              <Calendar size={20} className="mx-auto text-ink-60" />
              <h3 className="font-display mt-3 text-[20px]">Sign in to see your bookings</h3>
              <p className="mt-1.5 text-[13px] text-ink-60">
                Onboarding takes 30 seconds. We&apos;ll text you a code.
              </p>
              <Button size="md" className="mt-5" onClick={() => goto('onboarding')}>
                Sign in
              </Button>
            </div>
          </div>
        </div>
        <BottomNav active="bookings" onSelect={goto} />
      </div>
    );
  }

  const upcoming = (upcomingQuery.data?.items ?? []).map(enrichBooking);
  const past = (pastQuery.data?.items ?? []).map(enrichBooking);

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-[160px] scrollbar-none">
        <header className="px-5 pt-14">
          <div className="label-eyebrow">Your practice</div>
          <h1 className="font-display mt-1 text-[30px] leading-[1.1]">Bookings</h1>
        </header>

        {/* Upcoming */}
        <section className="mt-6 px-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[20px]">Upcoming</h2>
            <button
              onClick={() => goto('discover')}
              className="press-soft inline-flex items-center gap-1 text-[12px] font-medium text-ink-60"
            >
              <Plus size={14} /> Book
            </button>
          </div>

          {upcomingQuery.isLoading && (
            <p className="mt-4 text-[13px] text-ink-60">Loading…</p>
          )}
          {upcomingQuery.error && (
            <p className="mt-4 text-[13px] text-terracotta">
              {upcomingQuery.error instanceof ApiError
                ? upcomingQuery.error.message
                : 'Could not load bookings.'}
            </p>
          )}

          <ul className="mt-4 space-y-3">
            {upcoming.map((b, idx) => {
              const next = idx === 0;
              const hero = heroForStudio(b.studioId, b.studioName);
              const neighborhood = neighborhoodForStudio(b.studioId, b.studioName);
              const cancellable =
                b.rawStatus === 'CONFIRMED' ||
                b.rawStatus === 'REQUESTED' ||
                b.rawStatus === 'WAITLISTED';
              return (
                <li key={b.id}>
                  <div
                    className="press-soft relative w-full overflow-hidden rounded-[20px] text-start"
                    style={{ boxShadow: 'var(--shadow-soft)' }}
                  >
                    <div className="relative h-44 w-full">
                      <img
                        src={hero}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(to right, rgba(31,27,22,0.65) 0%, rgba(31,27,22,0.25) 60%, rgba(31,27,22,0.45) 100%)',
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col justify-between p-5 text-bone">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-bone/20 px-2.5 py-1 text-[11px] font-medium tracking-wide backdrop-blur-sm">
                            {next ? 'Next class' : 'Upcoming'}
                            {b.countdown ? ` · ${b.countdown}` : ''}
                          </span>
                          <span className="num text-[12px] text-bone/85">{b.date}</span>
                        </div>
                        <div>
                          {neighborhood && (
                            <div className="label-eyebrow !text-bone/70">{neighborhood}</div>
                          )}
                          <h3 className="font-display mt-1 text-[24px] leading-tight">
                            {b.studioName}
                          </h3>
                          <div className="mt-2 flex items-center gap-3 text-[12px] text-bone/85">
                            <span className="num font-medium text-bone">{b.time}</span>
                            <span>·</span>
                            <span className="num">${b.price}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-bone px-5 py-3">
                      <button
                        onClick={() => goto('discover')}
                        className="press-soft flex-1 text-[13px] font-medium underline underline-offset-4"
                      >
                        Book another
                      </button>
                      <span className="h-4 w-px bg-stone" />
                      <button
                        disabled={!cancellable || cancel.isPending}
                        onClick={() => {
                          if (window.confirm('Cancel this booking?')) {
                            cancel.mutate(b.id);
                          }
                        }}
                        className="press-soft flex-1 text-[13px] font-medium text-ink-60 underline underline-offset-4 disabled:opacity-50"
                      >
                        {cancel.isPending ? 'Cancelling…' : 'Cancel · free'}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
            {!upcomingQuery.isLoading && upcoming.length === 0 && (
              <EmptyUpcoming onAction={() => goto('discover')} />
            )}
          </ul>
        </section>

        {/* Past */}
        <section className="mt-9 px-5">
          <h2 className="font-display text-[20px]">Past</h2>
          {pastQuery.isLoading && (
            <p className="mt-4 text-[13px] text-ink-60">Loading…</p>
          )}
          <ul className="mt-4 divide-y divide-stone/70">
            {past.map((b) => {
              const cancelled = b.outcome === 'cancelled';
              const hero = heroForStudio(b.studioId, b.studioName);
              return (
                <li key={b.id} className="flex items-center gap-3 py-4">
                  <img
                    src={hero}
                    alt=""
                    className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14.5px] font-medium">{b.studioName}</span>
                      {cancelled && (
                        <span className="rounded-full bg-stone-soft px-2 py-0.5 text-[10px] font-medium text-ink-60">
                          Cancelled
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-60 num">
                      {b.date} · {b.time}
                    </div>
                  </div>
                  <button
                    onClick={() => goto('discover')}
                    className="press-soft text-[12px] font-medium text-ink-60 underline underline-offset-4"
                  >
                    Rebook
                  </button>
                </li>
              );
            })}
            {!pastQuery.isLoading && past.length === 0 && (
              <li className="py-4 text-[13px] text-ink-60">No past bookings yet.</li>
            )}
          </ul>
        </section>
      </div>

      <BottomNav active="bookings" onSelect={goto} />
    </div>
  );
}

function EmptyUpcoming({ onAction }: { onAction: () => void }) {
  return (
    <li>
      <div className="rounded-2xl border border-dashed border-stone bg-bone px-5 py-10 text-center">
        <Calendar size={20} className="mx-auto text-ink-60" />
        <h3 className="font-display mt-3 text-[20px]">No bookings yet.</h3>
        <p className="mt-1.5 text-[13px] text-ink-60">
          Find a class you like — most studios open 4 weeks ahead.
        </p>
        <Button size="md" className="mt-5" onClick={onAction}>
          Browse studios
        </Button>
      </div>
    </li>
  );
}
