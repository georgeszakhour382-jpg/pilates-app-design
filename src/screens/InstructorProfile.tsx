import { ChevronLeft, Star, Globe, Award, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StickyCTA } from '../components/ui/StickyCTA';
import { ClassRow } from '../components/shared/ClassRow';
import { findStudio, instructors, sessions } from '../data/mock';
import type { ScreenId } from '../App';

export function InstructorProfile({ goto }: { goto: (id: ScreenId) => void }) {
  const instructor = instructors[0]!;
  const studio = findStudio(instructor.studioId);
  const upcoming = sessions.filter((s) => s.instructorId === instructor.id);

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-32 scrollbar-none">
        {/* Portrait */}
        <div className="relative aspect-[4/5] w-full">
          <img src={instructor.portrait} alt={instructor.fullName} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: 'linear-gradient(to top, rgba(31,27,22,0.7) 0%, transparent 100%)' }} />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-12">
            <button
              onClick={() => goto('studio')}
              className="press-soft grid h-10 w-10 place-items-center rounded-full bg-bone/85 text-ink"
            >
              <ChevronLeft size={20} />
            </button>
            <button className="press-soft grid h-10 w-10 place-items-center rounded-full bg-bone/85 text-ink">
              <Heart size={18} />
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 text-bone">
            <div className="label-eyebrow !text-bone/70">{studio.name} · {studio.neighborhood}</div>
            <h1 className="font-display mt-1 text-[34px] leading-tight">{instructor.fullName}</h1>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-px bg-stone hairline-b">
          <Stat label="Rating" value={instructor.rating.toFixed(2)} sub={`${instructor.reviewCount} reviews`} icon={<Star size={14} className="fill-ink stroke-ink" />} />
          <Stat label="Teaching" value={`${instructor.yearsTeaching}y`} sub="Years experience" icon={<Award size={14} />} />
          <Stat label="Languages" value={instructor.languages.join(' · ')} sub="Spoken in class" icon={<Globe size={14} />} />
        </div>

        {/* Bio */}
        <section className="px-5 pt-7">
          <div className="label-eyebrow">About</div>
          <p className="mt-2 text-[15px] leading-[1.6] text-ink/85">
            {instructor.bio}
          </p>
        </section>

        {/* Specialties */}
        <section className="mt-8 px-5">
          <div className="label-eyebrow">Specialties</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {instructor.specialties.map((s) => (
              <span key={s} className="rounded-full bg-sand px-3.5 py-1.5 text-[13px] font-medium">
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* Certifications */}
        <section className="mt-8 px-5">
          <div className="label-eyebrow">Certifications</div>
          <ul className="mt-3 space-y-2.5">
            {instructor.certifications.map((c) => (
              <li key={c} className="flex items-center gap-3 text-[14px]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-sand text-ink-60">
                  <Award size={13} />
                </span>
                {c}
              </li>
            ))}
          </ul>
        </section>

        {/* Upcoming */}
        <section className="mt-9 px-5">
          <div className="label-eyebrow">Upcoming</div>
          <h2 className="font-display mt-1 text-[22px]">Classes you can join</h2>
          <ul className="mt-4 space-y-2">
            {upcoming.length === 0 ? (
              <EmptyState onAction={() => goto('discover')} />
            ) : (
              upcoming.map((s) => (
                <li key={s.id}>
                  <ClassRow session={s} instructor={instructor} onClick={() => goto('booking')} />
                </li>
              ))
            )}
          </ul>
        </section>

        <div className="h-12" />
      </div>

      <StickyCTA info={<>Next class · <span className="font-medium text-ink">Tomorrow 09:00</span></>}>
        <Button block onClick={() => goto('booking')}>Book with {instructor.fullName.split(' ')[0]}</Button>
      </StickyCTA>
    </div>
  );
}

function Stat({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="bg-bone p-4">
      <div className="label-eyebrow">{label}</div>
      <div className="mt-1 flex items-center gap-1.5 num text-[18px] font-display">
        {icon}
        <span>{value}</span>
      </div>
      <div className="mt-0.5 text-[11px] text-ink-60">{sub}</div>
    </div>
  );
}

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="rounded-2xl border border-stone bg-bone px-5 py-8 text-center">
      <div className="font-display text-[18px]">No upcoming classes this week.</div>
      <p className="mt-1 text-[13px] text-ink-60">Check back soon — schedules drop on Monday morning.</p>
      <button onClick={onAction} className="press-soft mt-4 text-[13px] font-medium underline underline-offset-4">
        Browse other instructors
      </button>
    </div>
  );
}
