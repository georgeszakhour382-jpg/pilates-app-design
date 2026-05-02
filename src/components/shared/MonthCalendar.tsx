import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Mindbody-pattern month grid: 7-column week, terracotta dot under each
// day that has at least one available class. Past days are dimmed and
// disabled. Selected day gets the dark ink fill.

export interface MonthCalendarProps {
  /** ISO date strings (yyyy-mm-dd, Beirut-local) for days that have
   *  at least one bookable class. */
  availableDays: ReadonlySet<string>;
  /** Selected day, ISO yyyy-mm-dd. */
  selectedIso: string | null;
  /** Limit how far back the user can browse. Defaults to today. */
  minIso?: string;
  /** Limit how far forward. Defaults to today + 60 days. */
  maxIso?: string;
  onSelect: (iso: string) => void;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Asia/Beirut local yyyy-mm-dd for the current moment.
function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut' }).format(new Date());
}

// Map JS Date.getUTCDay (Sun=0..Sat=6) to a Monday-first column index.
const COL_FOR_DOW = [6, 0, 1, 2, 3, 4, 5];

interface MonthCell {
  iso: string;
  day: number;
  inMonth: boolean;
  available: boolean;
  past: boolean;
  beyondMax: boolean;
}

function isoOfDay(year: number, month: number, day: number): string {
  // Treat as Beirut-local; we don't need exact tz offset for the iso bucket
  // because backend dates are already Beirut-aligned in the schedule.
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function buildMonthCells(
  year: number,
  month: number,
  minIso: string,
  maxIso: string,
  availableDays: ReadonlySet<string>,
): MonthCell[] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startCol = COL_FOR_DOW[firstOfMonth.getUTCDay()]!;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  // Lead-in days from previous month
  const prevDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: MonthCell[] = [];

  // Lead-in
  for (let i = startCol - 1; i >= 0; i -= 1) {
    const d = prevDays - i;
    cells.push({
      iso: isoOfDay(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d),
      day: d,
      inMonth: false,
      available: false,
      past: true,
      beyondMax: false,
    });
  }

  // The month itself
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = isoOfDay(year, month, day);
    cells.push({
      iso,
      day,
      inMonth: true,
      available: availableDays.has(iso),
      past: iso < minIso,
      beyondMax: iso > maxIso,
    });
  }

  // Trailing days to fill the last row to 7
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!;
    const next = new Date(`${last.iso}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    cells.push({
      iso: next.toISOString().slice(0, 10),
      day: next.getUTCDate(),
      inMonth: false,
      available: false,
      past: false,
      beyondMax: true,
    });
  }
  return cells;
}

export function MonthCalendar({
  availableDays,
  selectedIso,
  minIso,
  maxIso,
  onSelect,
}: MonthCalendarProps) {
  const today = todayIso();
  const effectiveMin = minIso ?? today;
  const effectiveMax =
    maxIso ??
    (() => {
      const d = new Date(`${today}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 60);
      return d.toISOString().slice(0, 10);
    })();

  // Browse cursor — defaults to the selected day's month, falls back to today's month.
  const initialAnchor = selectedIso ?? effectiveMin;
  const [year, setYear] = useState(parseInt(initialAnchor.slice(0, 4), 10));
  const [month, setMonth] = useState(parseInt(initialAnchor.slice(5, 7), 10) - 1);

  const cells = useMemo(
    () => buildMonthCells(year, month, effectiveMin, effectiveMax, availableDays),
    [year, month, effectiveMin, effectiveMax, availableDays],
  );

  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const goPrev = (): void => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const goNext = (): void => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // Disable prev when we're already at the month containing min, next when
  // at the month containing max.
  const minMonth = `${effectiveMin.slice(0, 7)}`;
  const maxMonth = `${effectiveMax.slice(0, 7)}`;
  const curMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
  const canPrev = curMonth > minMonth;
  const canNext = curMonth < maxMonth;

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev}
          className="press-soft grid h-9 w-9 place-items-center rounded-full text-ink-60 hover:bg-stone-soft disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-display text-[18px]">{monthLabel}</div>
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext}
          className="press-soft grid h-9 w-9 place-items-center rounded-full text-ink-60 hover:bg-stone-soft disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday header */}
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wider text-ink-60">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      {/* Cells */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          const isSelected = c.iso === selectedIso;
          const disabled = !c.inMonth || c.past || c.beyondMax;
          const interactive = c.inMonth && !c.past && !c.beyondMax;
          return (
            <button
              key={`${c.iso}-${i}`}
              type="button"
              onClick={() => interactive && onSelect(c.iso)}
              disabled={disabled}
              className={[
                'press-soft relative grid aspect-square place-items-center rounded-xl text-[15px] tabular-nums',
                isSelected
                  ? 'bg-ink text-bone'
                  : c.available && !c.past
                    ? 'bg-bone hairline-b text-ink hover:bg-stone-soft'
                    : 'text-ink-60',
                disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
              ].join(' ')}
              aria-label={c.available ? `${c.iso} (classes available)` : c.iso}
            >
              <span>{c.day}</span>
              {c.available && !isSelected && !c.past && (
                <span
                  aria-hidden
                  className="absolute bottom-1.5 h-1 w-1 rounded-full"
                  style={{ background: '#C97B5B' }}
                />
              )}
              {c.available && isSelected && (
                <span aria-hidden className="absolute bottom-1.5 h-1 w-1 rounded-full bg-bone" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-ink-60">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: '#C97B5B' }} />
          Classes available
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-full bg-ink" />
          Selected
        </span>
      </div>
    </div>
  );
}
