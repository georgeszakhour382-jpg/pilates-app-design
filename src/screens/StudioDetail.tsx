import { useState } from 'react';
import { ChevronLeft, Heart, Share2, Star, MapPin, Clock } from 'lucide-react';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { StickyCTA } from '../components/ui/StickyCTA';
import { ClassRow } from '../components/shared/ClassRow';
import { InstructorBadge } from '../components/shared/InstructorBadge';
import { instructors, reviews, sessions, studios } from '../data/mock';
import type { ScreenId } from '../App';

const days = ['Today', 'Tomorrow', 'Thu 4', 'Fri 5', 'Sat 6', 'Sun 7', 'Mon 8'];

export function StudioDetail({ goto }: { goto: (id: ScreenId) => void }) {
  const studio = studios[0]!;
  const studioInstructors = instructors.filter((i) => i.studioId === studio.id);
  const studioSessions = sessions.filter((s) => s.studioId === studio.id);
  const [day, setDay] = useState('Tomorrow');

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-32 scrollbar-none">
        {/* Hero */}
        <div className="relative aspect-[4/5] w-full">
          <img src={studio.hero} alt={studio.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: 'linear-gradient(to top, rgba(31,27,22,0.6) 0%, transparent 100%)' }} />
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
          <div className="label-eyebrow">{studio.neighborhood} · {studio.city}</div>
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
              7 min walk
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
            “{studio.loved}”
          </p>
        </section>

        {/* Schedule with sticky day picker */}
        <section className="mt-9">
          <div className="px-5">
            <div className="label-eyebrow">Schedule</div>
            <h2 className="font-display mt-1 text-[22px]">Pick a day</h2>
          </div>
          <div className="sticky top-0 z-10 mt-3 -mx-0 bg-bone/95 backdrop-blur-sm">
            <div className="flex gap-2 overflow-x-auto px-5 py-2 scrollbar-none">
              {days.map((d) => (
                <Chip key={d} selected={day === d} onClick={() => setDay(d)}>
                  {d}
                </Chip>
              ))}
            </div>
            <div className="h-px bg-stone/70" />
          </div>
          <ul className="mt-3 space-y-2 px-5">
            {studioSessions.map((s) => {
              const inst = instructors.find((i) => i.id === s.instructorId)!;
              return (
                <li key={s.id}>
                  <ClassRow session={s} instructor={inst} onClick={() => goto('booking')} />
                </li>
              );
            })}
          </ul>
        </section>

        {/* Instructors */}
        <section className="mt-9 px-5">
          <div className="label-eyebrow">Teaching here</div>
          <h2 className="font-display mt-1 text-[22px]">Instructors</h2>
          <ul className="mt-4 space-y-4">
            {studioInstructors.map((i) => (
              <li key={i.id}>
                <InstructorBadge instructor={i} onClick={() => goto('instructor')} />
              </li>
            ))}
          </ul>
        </section>

        {/* Reviews */}
        <section className="mt-9 px-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="label-eyebrow">From regulars</div>
              <h2 className="font-display mt-1 text-[22px]">{studio.reviewCount} reviews</h2>
            </div>
            <button className="text-[12px] font-medium text-ink-60">See all</button>
          </div>
          <ul className="mt-4 space-y-5">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-stone/70 pb-5 last:border-b-0">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium">{r.author}</span>
                  <span className="text-[12px] text-ink-60">{r.date}</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < r.rating ? 'fill-ink stroke-ink' : 'stroke-ink-30'} />
                  ))}
                </div>
                <p className="mt-2 text-[14px] leading-[1.55] text-ink/85">{r.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Map placeholder */}
        <section className="mt-9 px-5">
          <div className="label-eyebrow">Find it</div>
          <h2 className="font-display mt-1 text-[22px]">{studio.address}</h2>
          <div
            className="mt-3 aspect-[16/10] overflow-hidden rounded-2xl"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, #ede5d8 0%, #d6cfc2 60%, #c5bdb0 100%)',
            }}
          >
            <div className="relative h-full w-full">
              <div className="absolute inset-0 opacity-50" style={{
                backgroundImage:
                  'linear-gradient(transparent 95%, rgba(31,27,22,0.07) 95%), linear-gradient(90deg, transparent 95%, rgba(31,27,22,0.07) 95%)',
                backgroundSize: '32px 32px',
              }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-clay text-bone shadow-md">
                  <MapPin size={16} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cancellation copy */}
        <section className="mt-7 mx-5 rounded-2xl border border-stone p-4">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <Clock size={14} />
            Cancellation
          </div>
          <p className="mt-1 text-[13px] leading-[1.55] text-ink-60">
            Free cancellation up to {studio.cancellationHours} hours before class. After that, the class
            counts toward your monthly cap and isn’t refundable.
          </p>
        </section>

        <div className="h-12" />
      </div>

      <StickyCTA
        info={
          <span>
            Next class · <span className="font-medium text-ink">Tomorrow 09:00</span> · from $
            <span className="num">{studio.priceFrom}</span>
          </span>
        }
      >
        <Button block onClick={() => goto('booking')}>
          Book a class
        </Button>
      </StickyCTA>
    </div>
  );
}
