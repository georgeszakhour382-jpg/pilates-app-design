import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Heart, Share2, Star, MapPin, Clock } from 'lucide-react';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { StickyCTA } from '../components/ui/StickyCTA';
import { ClassRow } from '../components/shared/ClassRow';
import { InstructorBadge } from '../components/shared/InstructorBadge';
import { reviews as mockReviews } from '../data/mock';
import type { ScreenId } from '../App';
import { StudioMap } from '../components/shared/StudioMap';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';
import { authStore } from '../lib/auth';
import { useT } from '../lib/i18n';
import {
  enrichInstructor,
  enrichSession,
  enrichStudio,
  instructorFromSession,
  nextDayLabels,
  studioCoords,
} from '../lib/displayAdapters';

export function StudioDetail({
  goto,
  slug,
  setActiveSessionId,
}: {
  goto: (id: ScreenId) => void;
  slug: string | null;
  setActiveSessionId?: (id: string | null) => void;
}) {
  const t = useT();
  const studioQuery = useQuery({
    queryKey: ['studios.getBySlug', slug],
    queryFn: () => {
      if (!slug) throw new Error('No studio selected');
      return api.studios.getBySlug(slug);
    },
    enabled: !!slug,
  });

  // Day picker — next 7 days, Beirut-local. The query fetches the whole
  // 7-day window from the backend; the picker is purely a client filter.
  const days = useMemo(() => nextDayLabels(7), []);
  const [activeDayIso, setActiveDayIso] = useState(days[1]?.iso ?? days[0]?.iso ?? '');

  const fromIso = days[0]?.iso ? `${days[0].iso}T00:00:00.000Z` : new Date().toISOString();
  const toIso = days[days.length - 1]?.iso
    ? `${days[days.length - 1]!.iso}T23:59:59.999Z`
    : new Date().toISOString();

  const sessionsQuery = useQuery({
    queryKey: ['classes.list', studioQuery.data?.id, fromIso, toIso],
    queryFn: () => {
      if (!studioQuery.data) throw new Error('Studio not loaded yet');
      return api.classes.list({ studioId: studioQuery.data.id, from: fromIso, to: toIso });
    },
    enabled: !!studioQuery.data,
  });

  const instructorsQuery = useQuery({
    queryKey: ['instructors.list', studioQuery.data?.id],
    queryFn: () => {
      if (!studioQuery.data) throw new Error('Studio not loaded yet');
      return api.instructors.list(studioQuery.data.id);
    },
    enabled: !!studioQuery.data,
  });

  // When signed in, load the user's upcoming bookings so we can mark
  // already-booked sessions as unavailable instead of letting the user
  // walk into a duplicate-booking error at the payment step.
  const signedIn = !!authStore.accessToken();
  const myBookingsQuery = useQuery({
    queryKey: ['bookings.listMine', 'UPCOMING'],
    queryFn: () => api.bookings.listMine('UPCOMING'),
    enabled: signedIn,
  });
  const bookedSessionIds = new Set(
    (myBookingsQuery.data?.items ?? [])
      .filter((b) => b.status !== 'CANCELLED' && b.status !== 'REFUNDED')
      .map((b) => b.classSessionId),
  );

  const toast = useToast();

  const sessionsForDay = useMemo(() => {
    const all = sessionsQuery.data ?? [];
    return all
      .filter((s) => s.status === 'SCHEDULED')
      .filter((s) => s.startsAt.slice(0, 10) === activeDayIso)
      .sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));
  }, [sessionsQuery.data, activeDayIso]);

  if (studioQuery.isLoading) {
    return (
      <div className="grid h-full place-items-center bg-bone p-6 text-center">
        <p className="text-[14px] text-ink-60">Loading studio…</p>
      </div>
    );
  }

  if (studioQuery.error || !studioQuery.data) {
    return (
      <div className="grid h-full place-items-center bg-bone p-6 text-center">
        <div>
          <p className="font-display text-[20px]">{t('studio.not_found')}</p>
          <button
            onClick={() => goto('discover')}
            className="mt-3 text-[13px] font-medium text-clay underline"
          >
            {t('studio.back_to_discover')}
          </button>
        </div>
      </div>
    );
  }

  const studio = enrichStudio(studioQuery.data);

  // Find the next upcoming class for the sticky CTA
  const nextSession = (sessionsQuery.data ?? [])
    .filter((s) => s.status === 'SCHEDULED' && new Date(s.startsAt).getTime() > Date.now())
    .sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1))[0];

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-32 scrollbar-none">
        {/* Hero */}
        <div className="relative aspect-[4/5] w-full">
          <img
            src={studio.hero}
            alt={studio.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1/3"
            style={{ background: 'linear-gradient(to top, rgba(31,27,22,0.6) 0%, transparent 100%)' }}
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-12">
            <button
              onClick={() => goto('discover')}
              className="press-soft grid h-10 w-10 place-items-center rounded-full bg-bone/85 text-ink"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2">
              <button className="press-soft grid h-10 w-10 place-items-center rounded-full bg-bone/85 text-ink">
                <Share2 size={18} />
              </button>
              <button className="press-soft grid h-10 w-10 place-items-center rounded-full bg-bone/85 text-ink">
                <Heart size={18} />
              </button>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-5 flex justify-center gap-1.5">
            {studio.gallery.map((_, i) => (
              <span
                key={i}
                className={[
                  'h-1 rounded-full bg-bone/90',
                  i === 0 ? 'w-7' : 'w-1.5 bg-bone/55',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        {/* Header block */}
        <div className="px-5 pt-6">
          <div className="label-eyebrow">
            {studio.neighborhood} · {studio.city}
          </div>
          <h1 className="font-display mt-1 text-[32px] leading-tight">{studio.name}</h1>
          <p className="mt-3 text-[15px] leading-[1.55] text-ink-60">{studio.blurb}</p>

          <div className="mt-5 flex items-center gap-4 text-[13px] text-ink-60">
            <span className="flex items-center gap-1.5">
              <Star size={14} className="fill-ink stroke-ink" />
              <span className="num font-medium text-ink">{studio.rating.toFixed(2)}</span>
              <span>· {studio.reviewCount} reviews</span>
            </span>
            <span className="h-3 w-px bg-stone" />
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {studio.address}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {studio.classTypes.map((c) => (
              <Chip key={c} aria-disabled>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        {/* Why we love this */}
        <section className="mt-8 mx-5 rounded-2xl bg-sand p-5">
          <div className="label-eyebrow">Why we love this studio</div>
          <p className="font-display mt-2 text-[18px] italic leading-[1.4]">
            &ldquo;{studio.loved}&rdquo;
          </p>
        </section>

        {/* Schedule with sticky day picker */}
        <section className="mt-9">
          <div className="px-5">
            <div className="label-eyebrow">{t('studio.schedule')}</div>
            <h2 className="font-display mt-1 text-[22px]">{t('studio.pick_a_day')}</h2>
          </div>
          <div className="sticky top-0 z-10 mt-3 -mx-0 bg-bone/95 backdrop-blur-sm">
            <div className="flex gap-2 overflow-x-auto px-5 py-2 scrollbar-none">
              {days.map((d) => (
                <Chip
                  key={d.iso}
                  selected={activeDayIso === d.iso}
                  onClick={() => setActiveDayIso(d.iso)}
                >
                  {d.label}
                </Chip>
              ))}
            </div>
            <div className="h-px bg-stone/70" />
          </div>
          {sessionsQuery.isLoading && (
            <p className="mt-4 px-5 text-[13px] text-ink-60">{t('studio.schedule_loading')}</p>
          )}
          {sessionsQuery.error && (
            <p className="mt-4 px-5 text-[13px] text-terracotta">
              Couldn&apos;t load schedule.
            </p>
          )}
          {!sessionsQuery.isLoading && sessionsForDay.length === 0 && (
            <p className="mt-4 px-5 text-[13px] text-ink-60">{t('studio.no_classes')}</p>
          )}
          <ul className="mt-3 space-y-2 px-5">
            {sessionsForDay.map((s) => {
              const session = enrichSession(s);
              const inst = instructorFromSession(s);
              const alreadyBooked = bookedSessionIds.has(s.id);
              return (
                <li key={s.id}>
                  <ClassRow
                    session={session}
                    instructor={inst}
                    alreadyBooked={alreadyBooked}
                    onClick={() => {
                      if (alreadyBooked) {
                        toast.show(t('studio.already_booked_class'), 'info');
                        return;
                      }
                      setActiveSessionId?.(s.id);
                      goto('booking');
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        {/* Teaching here — real instructors from the backend */}
        {instructorsQuery.data && instructorsQuery.data.length > 0 && (
          <section className="mt-9 px-5">
            <div className="label-eyebrow">{t('studio.teaching_here')}</div>
            <h2 className="font-display mt-1 text-[22px]">{t('studio.instructors')}</h2>
            <ul className="mt-4 space-y-4">
              {instructorsQuery.data.map((i) => (
                <li key={i.id}>
                  <InstructorBadge
                    instructor={enrichInstructor(i)}
                    onClick={() => goto('instructor')}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Reviews — mock until backend exposes a Review model */}
        <section className="mt-9 px-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="label-eyebrow">{t('studio.reviews_eyebrow')}</div>
              <h2 className="font-display mt-1 text-[22px]">{studio.reviewCount} reviews</h2>
            </div>
            <button className="text-[12px] font-medium text-ink-60">See all</button>
          </div>
          <ul className="mt-4 space-y-5">
            {mockReviews.map((r) => (
              <li key={r.id} className="border-b border-stone/70 pb-5 last:border-b-0">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium">{r.author}</span>
                  <span className="text-[12px] text-ink-60">{r.date}</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < r.rating ? 'fill-ink stroke-ink' : 'stroke-ink-30'}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[14px] leading-[1.55] text-ink/85">{r.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Find it — real Leaflet map. Uses backend lat/lng when present,
            falls back to a curated by-slug lookup until seed populates them. */}
        {(() => {
          const coords = studioCoords(studioQuery.data);
          if (!coords) return null;
          return (
            <section className="mt-9 px-5">
              <div className="label-eyebrow">{t('studio.find_it')}</div>
              <h2 className="font-display mt-1 text-[22px]">{studio.address}</h2>
              <StudioMap lat={coords.lat} lng={coords.lng} className="mt-3" />
            </section>
          );
        })()}

        {/* Cancellation */}
        <section className="mt-7 mx-5 rounded-2xl border border-stone p-4">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <Clock size={14} />
            {t('studio.cancellation')}
          </div>
          <p className="mt-1 text-[13px] leading-[1.55] text-ink-60">
            Free cancellation up to {studio.cancellationHours} hours before class. After that, the
            class counts toward your monthly cap and isn&apos;t refundable.
          </p>
        </section>

        <div className="h-12" />
      </div>

      <StickyCTA
        info={
          nextSession ? (
            <span>
              {t('studio.next_class')} · <span className="font-medium text-ink">{enrichSession(nextSession).startsAt}</span> · from $
              <span className="num">{studio.priceFrom}</span>
            </span>
          ) : (
            <span>{t('discover.no_match')}</span>
          )
        }
      >
        <Button
          block
          onClick={() => {
            // Pick the first SCHEDULED session the user hasn't already booked.
            const candidates = [
              ...sessionsForDay,
              ...((sessionsQuery.data ?? []).filter((s) => s.status === 'SCHEDULED')),
            ];
            const target = candidates.find((s) => !bookedSessionIds.has(s.id));
            if (target) {
              setActiveSessionId?.(target.id);
              goto('booking');
            } else if (candidates.length > 0) {
              toast.show(t('studio.already_booked_all'), 'info');
            }
          }}
        >
          {t('studio.book_a_class')}
        </Button>
      </StickyCTA>
    </div>
  );
}

