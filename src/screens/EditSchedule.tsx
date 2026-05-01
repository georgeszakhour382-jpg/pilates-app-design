import { useState } from 'react';
import { ChevronLeft, Plus, Calendar as CalendarIcon, Copy, X } from 'lucide-react';
import { schedule } from '../data/mock';
import type { ScreenId } from '../App';
import { Button } from '../components/ui/Button';
import { StickyCTA } from '../components/ui/StickyCTA';

export function EditSchedule({ goto }: { goto: (id: ScreenId) => void }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const day = schedule[activeIdx]!;

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
            <button className="press-soft -mr-2 inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-[12px] font-medium">
              <CalendarIcon size={13} />
              Week
            </button>
          </div>
        </div>

        <header className="px-5 pt-2">
          <div className="label-eyebrow">Schedule</div>
          <h1 className="font-display mt-1 text-[28px] leading-tight">Edit your week</h1>
          <p className="mt-1 text-[13px] text-ink-60">Tap a day to manage classes, block time off, or copy a template.</p>
        </header>

        {/* Week strip */}
        <div className="mt-6 -mx-0">
          <div className="flex gap-2 overflow-x-auto px-5 scrollbar-none">
            {schedule.map((d, i) => {
              const sel = i === activeIdx;
              return (
                <button
                  key={d.label}
                  onClick={() => setActiveIdx(i)}
                  className={[
                    'press-soft flex flex-col items-center justify-center rounded-2xl border px-3 py-3 transition-colors',
                    sel ? 'border-ink bg-ink text-bone' : 'border-stone bg-bone text-ink hover:bg-stone-soft',
                  ].join(' ')}
                  style={{ minWidth: 64 }}
                >
                  <span className={['text-[10px] font-medium uppercase tracking-wide', sel ? 'text-bone/70' : 'text-ink-60'].join(' ')}>
                    {d.weekday}
                  </span>
                  <span className="font-display num mt-0.5 text-[20px] leading-none">{d.date}</span>
                  <span className={[
                    'mt-1.5 h-1.5 w-1.5 rounded-full',
                    d.blocked ? 'bg-rose' : d.classes.length > 0 ? (sel ? 'bg-bone' : 'bg-clay') : 'bg-stone',
                  ].join(' ')} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Day content */}
        <section className="mt-6 px-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[22px]">
              {day.weekday}, {day.date} {day.label === 'Today' || day.label === 'Tomorrow' ? `· ${day.label}` : ''}
            </h2>
            <button className="press-soft inline-flex items-center gap-1 text-[12px] font-medium text-ink-60 underline underline-offset-4">
              <Copy size={12} />
              Copy from…
            </button>
          </div>

          {day.blocked ? (
            <BlockedDay />
          ) : day.classes.length === 0 ? (
            <EmptyDay />
          ) : (
            <ul className="mt-4 space-y-2">
              {day.classes.map((c) => {
                const full = c.booked >= c.capacity;
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-4 rounded-2xl bg-bone p-4 hairline-b"
                  >
                    <div className="num text-[18px] font-display">{c.time}</div>
                    <div className="flex-1">
                      <div className="text-[14.5px] font-medium">{c.type} · {c.duration}m</div>
                      <div className="mt-0.5 text-[12px] text-ink-60 num">
                        {c.booked}/{c.capacity} booked
                      </div>
                    </div>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        full ? 'bg-rose/60 text-ink' : 'bg-sand text-ink-60',
                      ].join(' ')}
                    >
                      {full ? 'Full' : 'Open'}
                    </span>
                    <button
                      className="press-soft text-[12px] font-medium text-ink-60 underline underline-offset-4"
                      onClick={() => goto('roster')}
                    >
                      Edit
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Inline templates row */}
          <div className="mt-5 rounded-2xl border border-dashed border-stone p-4">
            <div className="label-eyebrow">Templates</div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['Reformer 09:00', 'Mat 12:00', 'Pre/postnatal 18:00', 'Saturday rest'].map((t) => (
                <button
                  key={t}
                  className="press-soft inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-sand px-3.5 py-1.5 text-[12px] font-medium"
                >
                  <Plus size={12} />
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        <p className="mt-9 px-5 text-center font-display italic text-[12px] text-ink-60">
          Beirut Pilates locks the schedule 7 days ahead — edits inside that window need owner approval.
        </p>
      </div>

      <StickyCTA info={<>Changes apply to your studio's public page · last saved <span className="num">2h ago</span></>}>
        <div className="flex gap-2">
          <Button variant="tertiary" size="md">Block day</Button>
          <Button block size="md" leading={<Plus size={16} />}>Add class</Button>
        </div>
      </StickyCTA>
    </div>
  );
}

function BlockedDay() {
  return (
    <div className="mt-5 rounded-2xl bg-sand p-6 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-bone">
        <X size={16} />
      </div>
      <div className="font-display mt-3 text-[18px]">Day blocked</div>
      <p className="mt-1 text-[13px] text-ink-60 leading-snug">
        No classes will be published. Existing bookings (if any) keep their reminders — cancel them
        manually if needed.
      </p>
      <button className="press-soft mt-4 text-[13px] font-medium underline underline-offset-4">
        Unblock
      </button>
    </div>
  );
}

function EmptyDay() {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-stone p-6 text-center">
      <div className="font-display text-[18px]">No classes yet.</div>
      <p className="mt-1 text-[13px] text-ink-60">
        Add a class from scratch, or copy from another day.
      </p>
    </div>
  );
}
