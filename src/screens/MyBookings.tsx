import { Calendar, MapPin, Clock, Plus } from 'lucide-react';
import { findInstructor, findStudio, pastBookings, upcomingBookings } from '../data/mock';
import type { ScreenId } from '../App';
import { BottomNav } from '../components/ui/BottomNav';
import { Button } from '../components/ui/Button';

export function MyBookings({ goto }: { goto: (id: ScreenId) => void }) {
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

          <ul className="mt-4 space-y-3">
            {upcomingBookings.map((b, idx) => {
              const studio = findStudio(b.studioId);
              const instructor = findInstructor(b.instructorId);
              const next = idx === 0;
              return (
                <li key={b.id}>
                  <button
                    onClick={() => goto('studio')}
                    className="press-soft relative w-full overflow-hidden rounded-[20px] text-start"
                    style={{ boxShadow: 'var(--shadow-soft)' }}
                  >
                    <div className="relative h-44 w-full">
                      <img src={studio.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
                            {next ? 'Next class' : 'Upcoming'} · {b.countdown}
                          </span>
                          <span className="num text-[12px] text-bone/85">{b.date}</span>
                        </div>
                        <div>
                          <div className="label-eyebrow !text-bone/70">{studio.neighborhood}</div>
                          <h3 className="font-display mt-1 text-[24px] leading-tight">{studio.name}</h3>
                          <div className="mt-2 flex items-center gap-3 text-[12px] text-bone/85">
                            <span className="num font-medium text-bone">{b.time}</span>
                            <span>·</span>
                            <span>{instructor.fullName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-bone px-5 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="press-soft flex-1 text-[13px] font-medium underline underline-offset-4"
                      >
                        Get directions
                      </button>
                      <span className="h-4 w-px bg-stone" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="press-soft flex-1 text-[13px] font-medium text-ink-60 underline underline-offset-4"
                      >
                        Cancel · free
                      </button>
                    </div>
                  </button>
                </li>
              );
            })}
            {upcomingBookings.length === 0 && (
              <EmptyUpcoming onAction={() => goto('discover')} />
            )}
          </ul>
        </section>

        {/* Past */}
        <section className="mt-9 px-5">
          <h2 className="font-display text-[20px]">Past</h2>
          <ul className="mt-4 divide-y divide-stone/70">
            {pastBookings.map((b) => {
              const studio = findStudio(b.studioId);
              const instructor = findInstructor(b.instructorId);
              const cancelled = b.outcome === 'cancelled';
              return (
                <li key={b.id} className="flex items-center gap-3 py-4">
                  <img
                    src={studio.hero}
                    alt=""
                    className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14.5px] font-medium">{studio.name}</span>
                      {cancelled && (
                        <span className="rounded-full bg-stone-soft px-2 py-0.5 text-[10px] font-medium text-ink-60">
                          Cancelled
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-60">
                      {instructor.fullName} · <span className="num">{b.date} · {b.time}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => goto('studio')}
                    className="press-soft text-[12px] font-medium text-ink-60 underline underline-offset-4"
                  >
                    Rebook
                  </button>
                </li>
              );
            })}
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
        <p className="mt-1.5 text-[13px] text-ink-60">Find a class you like — most studios open 4 weeks ahead.</p>
        <Button size="md" className="mt-5" onClick={onAction}>
          Browse studios
        </Button>
      </div>
    </li>
  );
}

// Lint-keepers
void MapPin;
void Clock;
