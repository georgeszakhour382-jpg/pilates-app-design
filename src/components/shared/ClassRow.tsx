import type { ClassSession, Instructor } from '../../data/mock';

const stripeFor: Record<string, string> = {
  Reformer: 'bg-clay',
  Mat: 'bg-sage',
  Contemporary: 'bg-rose',
  Clinical: 'bg-ink',
  'Pre/postnatal': 'bg-clay-soft',
};

export function ClassRow({
  session,
  instructor,
  onClick,
  selected,
  alreadyBooked = false,
}: {
  session: ClassSession;
  instructor: Instructor;
  onClick?: () => void;
  selected?: boolean;
  alreadyBooked?: boolean;
}) {
  const remaining = session.capacity - session.booked;
  const isFull = remaining <= 0;
  const isLow = !isFull && remaining <= 2;
  const [day, time] = session.startsAt.split(' · ');
  return (
    <button
      onClick={onClick}
      aria-disabled={alreadyBooked || undefined}
      className={[
        'press-soft relative flex w-full items-stretch gap-4 rounded-2xl bg-bone p-4 text-start hairline-b',
        selected ? 'ring-2 ring-ink' : '',
        // Already-booked: still tappable (so we can show the toast), but
        // visually greyed-out so users don't try to book again.
        alreadyBooked ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className={['w-1 self-stretch rounded-full', stripeFor[session.type] ?? 'bg-stone'].join(' ')} />
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="num text-[18px] font-display">{time}</span>
          <span className="text-[12px] text-ink-60">{day}</span>
        </div>
        <div className="mt-0.5 text-[14px] font-medium">{session.type} · {session.durationMin} min</div>
        <div className="mt-0.5 text-[12px] text-ink-60">
          {instructor.fullName} · {session.level}
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <span className="num text-[15px] font-medium">${session.priceUsd}</span>
        <span
          className={[
            'rounded-full px-2 py-0.5 text-[11px] font-medium',
            alreadyBooked
              ? 'bg-sage/40 text-ink'
              : isFull
                ? 'bg-stone text-ink-60'
                : isLow
                  ? 'bg-rose/60 text-ink'
                  : 'bg-sand text-ink-60',
          ].join(' ')}
        >
          {alreadyBooked ? 'Booked' : isFull ? 'Waitlist' : isLow ? `${remaining} left` : 'Open'}
        </span>
      </div>
    </button>
  );
}
