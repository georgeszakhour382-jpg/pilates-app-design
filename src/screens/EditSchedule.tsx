import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Plus,
  Calendar as CalendarIcon,
  X,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import type { ScreenId } from '../App';
import { Button } from '../components/ui/Button';
import { StickyCTA } from '../components/ui/StickyCTA';
import { Sheet } from '../components/ui/Sheet';
import { useToast } from '../components/ui/Toast';
import { api, ApiError, type ClassTemplateSummary, type StudioSessionRow } from '../lib/api';
import { authStore } from '../lib/auth';

const DAYS_AHEAD = 7;

interface DayBucket {
  iso: string; // YYYY-MM-DD
  weekday: string; // Mon
  date: string; // 02
  isToday: boolean;
  isTomorrow: boolean;
  sessions: StudioSessionRow[];
}

function startOfDayBeirut(d: Date): Date {
  // Beirut = UTC+3 (no DST modeled here; backend reports do the same).
  const utc = new Date(d.getTime() + 3 * 60 * 60_000);
  utc.setUTCHours(0, 0, 0, 0);
  return new Date(utc.getTime() - 3 * 60 * 60_000);
}

function fmt(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'Asia/Beirut' }).format(d);
}

function fmtTime(iso: string): string {
  return fmt(new Date(iso), { hour: '2-digit', minute: '2-digit', hour12: false });
}

function bucketSessions(sessions: StudioSessionRow[], days: DayBucket[]): DayBucket[] {
  const byIso = new Map(days.map((d) => [d.iso, d]));
  for (const s of sessions) {
    const localDate = new Date(s.startsAt);
    const yyyyMmDd = fmt(localDate, { year: 'numeric', month: '2-digit', day: '2-digit' })
      .split('/')
      .reverse()
      .join('-');
    const bucket = byIso.get(yyyyMmDd);
    if (bucket) bucket.sessions.push(s);
  }
  for (const d of days) {
    d.sessions.sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));
  }
  return days;
}

export function EditSchedule({ goto }: { goto: (id: ScreenId) => void }) {
  const signedIn = !!authStore.accessToken();
  const meQuery = useQuery({
    queryKey: ['auth.me'],
    queryFn: () => api.auth.me(),
    enabled: signedIn,
  });
  const isStaff =
    !!meQuery.data &&
    meQuery.data.role !== 'CUSTOMER' &&
    meQuery.data.studioId !== null;

  // 7-day window starting today (Beirut local).
  const { fromIso, toIso, dayBuckets } = useMemo(() => {
    const start = startOfDayBeirut(new Date());
    const days: DayBucket[] = Array.from({ length: DAYS_AHEAD }).map((_, i) => {
      const d = new Date(start.getTime() + i * 86_400_000);
      const iso = fmt(d, { year: 'numeric', month: '2-digit', day: '2-digit' })
        .split('/')
        .reverse()
        .join('-');
      return {
        iso,
        weekday: fmt(d, { weekday: 'short' }),
        date: fmt(d, { day: '2-digit' }),
        isToday: i === 0,
        isTomorrow: i === 1,
        sessions: [],
      };
    });
    return {
      fromIso: start.toISOString(),
      toIso: new Date(start.getTime() + DAYS_AHEAD * 86_400_000).toISOString(),
      dayBuckets: days,
    };
  }, []);

  const sessionsQuery = useQuery({
    queryKey: ['classes.studioList', fromIso, toIso],
    queryFn: () => api.staff.classes.studioList({ from: fromIso, to: toIso }),
    enabled: isStaff,
  });

  const templatesQuery = useQuery({
    queryKey: ['class-templates.list'],
    queryFn: () => api.staff.classTemplates.list(),
    enabled: isStaff,
  });

  const [activeIdx, setActiveIdx] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<StudioSessionRow | null>(null);

  const days = useMemo(
    () => bucketSessions(sessionsQuery.data ?? [], dayBuckets),
    [sessionsQuery.data, dayBuckets],
  );
  const day = days[activeIdx]!;

  const qc = useQueryClient();
  const toast = useToast();
  const cancel = useMutation({
    mutationFn: (input: { id: string; reason: string }) =>
      api.staff.classes.studioCancel(input),
    onSuccess: () => {
      toast.show('Class cancelled. Booked customers will be notified.');
      void qc.invalidateQueries({ queryKey: ['classes.studioList'] });
      setCancelTarget(null);
    },
    onError: (err) => {
      toast.show(
        err instanceof ApiError ? err.message : "Couldn't cancel — try again.",
        'warn',
      );
    },
  });

  if (!signedIn || (meQuery.data && !isStaff)) {
    return (
      <SignedOutOrCustomerWall
        goto={goto}
        message={
          meQuery.data && !isStaff
            ? "You're signed in as a customer. Sign in with a studio-staff phone (e.g. +96170100001) to manage the schedule."
            : 'Sign in with your studio-staff phone to manage the schedule.'
        }
      />
    );
  }

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
          <p className="mt-1 text-[13px] text-ink-60">
            Tap a day to manage classes, add a new one, or cancel a session.
          </p>
        </header>

        {/* Week strip */}
        <div className="mt-6">
          <div className="flex gap-2 overflow-x-auto px-5 scrollbar-none">
            {days.map((d, i) => {
              const sel = i === activeIdx;
              const live = d.sessions.filter((s) => s.status === 'SCHEDULED').length;
              return (
                <button
                  key={d.iso}
                  onClick={() => setActiveIdx(i)}
                  className={[
                    'press-soft flex flex-col items-center justify-center rounded-2xl border px-3 py-3 transition-colors',
                    sel
                      ? 'border-ink bg-ink text-bone'
                      : 'border-stone bg-bone text-ink hover:bg-stone-soft',
                  ].join(' ')}
                  style={{ minWidth: 64 }}
                >
                  <span
                    className={[
                      'text-[10px] font-medium uppercase tracking-wide',
                      sel ? 'text-bone/70' : 'text-ink-60',
                    ].join(' ')}
                  >
                    {d.weekday}
                  </span>
                  <span className="font-display num mt-0.5 text-[20px] leading-none">{d.date}</span>
                  <span
                    className={[
                      'mt-1.5 h-1.5 w-1.5 rounded-full',
                      live > 0 ? (sel ? 'bg-bone' : 'bg-clay') : 'bg-stone',
                    ].join(' ')}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Day content */}
        <section className="mt-6 px-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[22px]">
              {day.weekday}, {day.date}
              {day.isToday ? ' · Today' : day.isTomorrow ? ' · Tomorrow' : ''}
            </h2>
          </div>

          {sessionsQuery.isLoading ? (
            <div className="mt-5 rounded-2xl border border-dashed border-stone p-6 text-center text-[13px] text-ink-60">
              Loading…
            </div>
          ) : day.sessions.length === 0 ? (
            <EmptyDay />
          ) : (
            <ul className="mt-4 space-y-2">
              {day.sessions.map((c) => {
                const cancelled = c.status === 'CANCELLED';
                const completed = c.status === 'COMPLETED';
                const full = c.bookedCount >= c.capacity;
                return (
                  <li
                    key={c.id}
                    className={[
                      'flex items-center gap-4 rounded-2xl bg-bone p-4 hairline-b',
                      cancelled ? 'opacity-50' : '',
                    ].join(' ')}
                  >
                    <div className="num text-[18px] font-display">{fmtTime(c.startsAt)}</div>
                    <div className="flex-1">
                      <div className="text-[14.5px] font-medium">
                        {c.className ?? 'Class'} · {c.type ?? 'OTHER'}
                      </div>
                      <div className="mt-0.5 text-[12px] text-ink-60 num">
                        {c.bookedCount}/{c.capacity} booked
                        {c.instructorName ? ` · ${c.instructorName}` : ''}
                      </div>
                    </div>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        cancelled
                          ? 'bg-stone text-ink-60'
                          : completed
                            ? 'bg-stone-soft text-ink-60'
                            : full
                              ? 'bg-rose/60 text-ink'
                              : 'bg-sand text-ink-60',
                      ].join(' ')}
                    >
                      {cancelled ? 'Cancelled' : completed ? 'Done' : full ? 'Full' : 'Open'}
                    </span>
                    {!cancelled && !completed && (
                      <button
                        className="press-soft text-[12px] font-medium text-ink-60 underline underline-offset-4"
                        onClick={() => setCancelTarget(c)}
                      >
                        Cancel
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-9 px-5 text-center font-display italic text-[12px] text-ink-60">
          Changes apply to the studio's public schedule. Cancellations notify booked customers.
        </p>
      </div>

      <StickyCTA info={<>{(day.sessions ?? []).filter((s) => s.status === 'SCHEDULED').length} live · {day.weekday} {day.date}</>}>
        <Button block size="md" leading={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          Add class
        </Button>
      </StickyCTA>

      <AddClassSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultDayIso={day.iso}
        templates={templatesQuery.data ?? []}
      />

      <CancelClassSheet
        target={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={(reason) => cancelTarget && cancel.mutate({ id: cancelTarget.id, reason })}
        pending={cancel.isPending}
      />
    </div>
  );
}

function EmptyDay() {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-stone p-6 text-center">
      <div className="font-display text-[18px]">No classes scheduled.</div>
      <p className="mt-1 text-[13px] text-ink-60">
        Add a class from a template to get started — tap the button below.
      </p>
    </div>
  );
}

function SignedOutOrCustomerWall({
  goto,
  message,
}: {
  goto: (id: ScreenId) => void;
  message: string;
}) {
  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-32 scrollbar-none">
        <div className="px-4 pt-12">
          <button
            onClick={() => goto('instructor-dashboard')}
            className="press-soft -ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-stone-soft"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
        <header className="px-5 pt-2">
          <div className="label-eyebrow">Schedule</div>
          <h1 className="font-display mt-1 text-[28px] leading-tight">Staff sign-in needed</h1>
        </header>
        <div className="mx-5 mt-8 rounded-2xl border border-dashed border-stone p-6 text-center">
          <p className="text-[14px] text-ink/85 leading-relaxed">{message}</p>
          <Button size="md" className="mt-5" onClick={() => goto('onboarding')}>
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddClassSheet({
  open,
  onClose,
  defaultDayIso,
  templates,
}: {
  open: boolean;
  onClose: () => void;
  defaultDayIso: string;
  templates: ClassTemplateSummary[];
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [templateId, setTemplateId] = useState<string>('');
  const [time, setTime] = useState<string>('09:00');
  const [capacityOverride, setCapacityOverride] = useState<string>('');
  const tmpl = templates.find((t) => t.id === templateId);

  const create = useMutation({
    mutationFn: (input: Parameters<typeof api.staff.classes.studioCreate>[0]) =>
      api.staff.classes.studioCreate(input),
    onSuccess: () => {
      toast.show('Class added.');
      void qc.invalidateQueries({ queryKey: ['classes.studioList'] });
      onClose();
      // reset
      setTemplateId('');
      setTime('09:00');
      setCapacityOverride('');
    },
    onError: (err) => {
      toast.show(
        err instanceof ApiError ? err.message : "Couldn't add class — try again.",
        'warn',
      );
    },
  });

  const submit = () => {
    if (!tmpl) {
      toast.show('Pick a template first.', 'warn');
      return;
    }
    // Asia/Beirut local time → UTC ISO. Backend stores tz-aware UTC.
    // Beirut = UTC+3 (no DST modelled — same posture as the backend reports).
    const [hh, mm] = time.split(':').map(Number);
    const startsLocal = new Date(`${defaultDayIso}T${time}:00.000+03:00`);
    void hh; void mm;
    const startsAt = startsLocal.toISOString();
    const endsAt = new Date(
      startsLocal.getTime() + tmpl.durationMinutes * 60_000,
    ).toISOString();
    const capacity = capacityOverride
      ? Math.max(1, Math.min(200, parseInt(capacityOverride, 10) || tmpl.defaultCapacity))
      : tmpl.defaultCapacity;
    create.mutate({
      classTemplateId: tmpl.id,
      startsAt,
      endsAt,
      capacity,
      waitlistCap: tmpl.defaultWaitlistCap,
      price: tmpl.price,
    });
  };

  return (
    <Sheet
      open={open}
      title="Add a class"
      onClose={onClose}
      footer={
        <Button block size="md" onClick={submit} disabled={create.isPending || !tmpl}>
          {create.isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Adding…
            </>
          ) : (
            'Add class'
          )}
        </Button>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="label-eyebrow mb-2">Template</div>
          {templates.length === 0 ? (
            <p className="text-[13px] text-ink-60">
              No class templates configured. Create one in the dashboard's Templates screen first.
            </p>
          ) : (
            <div className="relative">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="appearance-none w-full rounded-xl border border-stone bg-bone px-4 py-3 pr-10 text-[14px] focus:border-ink focus:outline-none"
              >
                <option value="">Pick a template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.durationMinutes}m · {t.defaultCapacity} seats
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-60"
              />
            </div>
          )}
        </div>

        <div>
          <div className="label-eyebrow mb-2">Day</div>
          <div className="rounded-xl bg-sand px-4 py-3 text-[14px]">
            {new Intl.DateTimeFormat('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              timeZone: 'Asia/Beirut',
            }).format(new Date(`${defaultDayIso}T12:00:00.000+03:00`))}
          </div>
        </div>

        <div>
          <div className="label-eyebrow mb-2">Start time</div>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="num w-full rounded-xl border border-stone bg-bone px-4 py-3 text-[14px] focus:border-ink focus:outline-none"
          />
        </div>

        <div>
          <div className="label-eyebrow mb-2">
            Capacity {tmpl ? <span className="text-ink-60">· template default {tmpl.defaultCapacity}</span> : null}
          </div>
          <input
            type="number"
            min={1}
            max={200}
            value={capacityOverride}
            onChange={(e) => setCapacityOverride(e.target.value)}
            placeholder={tmpl ? String(tmpl.defaultCapacity) : 'e.g. 8'}
            className="num w-full rounded-xl border border-stone bg-bone px-4 py-3 text-[14px] focus:border-ink focus:outline-none"
          />
        </div>
      </div>
    </Sheet>
  );
}

function CancelClassSheet({
  target,
  onClose,
  onConfirm,
  pending,
}: {
  target: StudioSessionRow | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  pending: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <Sheet
      open={!!target}
      title="Cancel this class?"
      onClose={() => {
        setReason('');
        onClose();
      }}
      footer={
        <div className="flex gap-2">
          <Button variant="tertiary" size="md" onClick={onClose}>
            Keep it
          </Button>
          <Button
            block
            size="md"
            onClick={() => {
              onConfirm(reason.trim() || 'No reason given');
              setReason('');
            }}
            disabled={pending}
            leading={pending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          >
            {pending ? 'Cancelling…' : 'Cancel class'}
          </Button>
        </div>
      }
    >
      {target && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-sand p-4">
            <div className="text-[14.5px] font-medium">{target.className ?? 'Class'}</div>
            <div className="mt-1 text-[12px] text-ink-60">
              {fmtTime(target.startsAt)} · {target.bookedCount} booked
            </div>
          </div>
          <div>
            <div className="label-eyebrow mb-2">Reason</div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Instructor sick · Power outage"
              className="w-full rounded-xl border border-stone bg-bone px-4 py-3 text-[14px] focus:border-ink focus:outline-none"
              rows={3}
            />
            <p className="mt-2 text-[12px] text-ink-60">
              Booked customers see this in the cancellation notification — keep it brief.
            </p>
          </div>
        </div>
      )}
    </Sheet>
  );
}
