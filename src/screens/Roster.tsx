import { ChevronLeft, MoreHorizontal, MessageCircle, Check, X } from 'lucide-react';
import { rosterToday } from '../data/mock';
import type { ScreenId } from '../App';
import { Button } from '../components/ui/Button';
import { StickyCTA } from '../components/ui/StickyCTA';

export function Roster({ goto }: { goto: (id: ScreenId) => void }) {
  const checked = rosterToday.entries.filter((e) => e.status === 'checked_in').length;
  const confirmed = rosterToday.entries.filter((e) => e.status === 'confirmed').length;
  const waitlist = rosterToday.entries.filter((e) => e.status === 'waitlist').length;

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
          <h1 className="font-display mt-1 text-[28px] leading-tight">{rosterToday.classTitle}</h1>
          <p className="mt-1 text-[13px] text-ink-60">
            {rosterToday.startsAt} · {rosterToday.studio}
          </p>
        </header>

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

        {/* Booked list */}
        <section className="mt-7">
          <div className="px-5 label-eyebrow">Booked · {rosterToday.entries.filter((e) => e.status !== 'waitlist').length}/{rosterToday.capacity}</div>
          <ul className="mt-3 px-5 space-y-2">
            {rosterToday.entries
              .filter((e) => e.status !== 'waitlist')
              .map((e) => {
                const isIn = e.status === 'checked_in';
                return (
                  <li
                    key={e.id}
                    className="flex items-start gap-3 rounded-2xl bg-bone p-3.5 hairline-b"
                  >
                    <div
                      className={[
                        'grid h-11 w-11 flex-shrink-0 place-items-center rounded-full font-medium',
                        isIn ? 'bg-sage text-bone' : 'bg-sand text-ink',
                      ].join(' ')}
                    >
                      <span className="text-[13px]">{e.initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14.5px] font-medium leading-tight">{e.fullName}</span>
                        {e.packageCredit && (
                          <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-medium text-ink-60">
                            10-pack
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[12px] text-ink-60 num">
                        {e.visits} visits · {e.phone}
                      </div>
                      {e.note && (
                        <p className="mt-1.5 text-[12px] italic text-ink/85 leading-snug">
                          “{e.note}”
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {isIn ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2 py-1 text-[11px] font-medium text-sage">
                          <Check size={11} /> In
                        </span>
                      ) : (
                        <button className="press-soft inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-bone">
                          <Check size={11} /> Check in
                        </button>
                      )}
                      <button className="press-soft text-ink-60" aria-label="Message">
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>

        {/* Waitlist */}
        {waitlist > 0 && (
          <section className="mt-7">
            <div className="px-5 label-eyebrow">Waitlist · {waitlist}</div>
            <ul className="mt-3 px-5 space-y-2">
              {rosterToday.entries
                .filter((e) => e.status === 'waitlist')
                .map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 rounded-2xl border border-dashed border-stone bg-bone p-3.5"
                  >
                    <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-sand text-[12px] font-medium">
                      {e.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium">{e.fullName}</div>
                      <div className="text-[12px] text-ink-60 num">
                        {e.visits} visits · joined waitlist 2h ago
                      </div>
                    </div>
                    <button className="press-soft text-[12px] font-medium underline underline-offset-4">
                      Promote
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <p className="mt-9 px-5 text-center font-display italic text-[12px] text-ink-60">
          Class fills 9 minutes before start time on average.
        </p>
      </div>

      <StickyCTA info={<>{checked}/{confirmed + checked} checked in · class starts in <span className="num font-medium text-ink">3 min</span></>}>
        <div className="flex gap-2">
          <Button variant="tertiary" size="md" leading={<X size={14} />}>Cancel class</Button>
          <Button block size="md">Start class</Button>
        </div>
      </StickyCTA>
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
