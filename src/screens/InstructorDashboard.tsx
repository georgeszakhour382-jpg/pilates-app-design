import { TrendingUp, Calendar, Users, Sparkles, ChevronRight, Plus } from 'lucide-react';
import { instructorToday, instructors } from '../data/mock';
import type { ScreenId } from '../App';
import { Button } from '../components/ui/Button';

export function InstructorDashboard({ goto }: { goto: (id: ScreenId) => void }) {
  const me = instructors[0]!;
  const change = ((instructorToday.earningsThisWeek - instructorToday.earningsLastWeek) /
    instructorToday.earningsLastWeek) * 100;
  const completeness = Math.round(instructorToday.profileCompleteness * 100);

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-12 scrollbar-none">
        {/* Header */}
        <header className="px-5 pt-14">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-eyebrow">Tuesday, May 1</div>
              <h1 className="font-display mt-1 text-[30px] leading-[1.1]">
                Good morning, <span className="italic">{me.fullName.split(' ')[0]}</span>.
              </h1>
            </div>
            <button onClick={() => goto('discover')} className="press-soft text-[12px] font-medium underline underline-offset-4">
              Switch view
            </button>
          </div>
        </header>

        {/* Earnings */}
        <section className="mt-6 px-5">
          <div className="rounded-[20px] bg-ink p-5 text-bone">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="label-eyebrow !text-bone/60">This week</div>
                <div className="font-display mt-1 num text-[40px] leading-none">
                  ${instructorToday.earningsThisWeek}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[12px] text-bone/85">
                <TrendingUp size={12} />
                <span className="num">+{change.toFixed(0)}%</span>
              </div>
            </div>
            <p className="mt-4 text-[13px] text-bone/70">
              Next payout · <span className="font-medium text-bone">{instructorToday.payoutNext}</span>
            </p>
          </div>
        </section>

        {/* Today's schedule */}
        <section className="mt-7 px-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="label-eyebrow">Today’s schedule</div>
              <h2 className="font-display mt-1 text-[22px]">{instructorToday.upcomingToday.length} classes</h2>
            </div>
            <button
              onClick={() => goto('edit-schedule')}
              className="press-soft inline-flex items-center gap-1 rounded-full bg-sand px-3 py-1.5 text-[12px] font-medium"
            >
              <Plus size={14} /> New
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {instructorToday.upcomingToday.map((c) => {
              const full = c.booked >= c.capacity;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => goto('roster')}
                    className="press-soft flex w-full items-center gap-4 rounded-2xl bg-bone p-4 text-start hairline-b"
                  >
                    <div className="num text-[18px] font-display">{c.time}</div>
                    <div className="flex-1">
                      <div className="text-[14.5px] font-medium">{c.type} · {c.duration}m</div>
                      <div className="mt-0.5 text-[12px] text-ink-60">{c.studio}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="num text-[13px] font-medium">{c.booked}/{c.capacity}</span>
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
