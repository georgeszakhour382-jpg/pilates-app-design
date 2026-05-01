import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronLeft, Check, CreditCard, Wallet, Clock, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StickyCTA } from '../components/ui/StickyCTA';
import type { ScreenId } from '../App';
import { api, ApiError } from '../lib/api';
import {
  classTypeLabel,
  enrichSession,
  formatStartsAt,
  priceUsd,
} from '../lib/displayAdapters';
import { authStore } from '../lib/auth';

type Step = 'class' | 'time' | 'addons' | 'payment' | 'confirm';

export function Booking({
  goto,
  sessionId,
}: {
  goto: (id: ScreenId) => void;
  sessionId: string | null;
}) {
  const [step, setStep] = useState<Step>('class');
  const [addMat, setAddMat] = useState(false);
  const [pay, setPay] = useState<'card' | 'cash'>('card');
  // Stable idempotency key for the whole booking session — protects against
  // double-tap on the Confirm button. Backend dedups by (user, key).
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const sessionQuery = useQuery({
    queryKey: ['classes.get', sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error('No class selected');
      return api.classes.get(sessionId);
    },
    enabled: !!sessionId,
  });

  // Studio detail for cancellation policy + address. Fetched by id (not slug)
  // because the session response carries studioId, not slug.
  const studioId = sessionQuery.data?.studioId;
  const studioQuery = useQuery({
    queryKey: ['studios.get', studioId],
    // The list query already returns the address/neighborhood. Cheap fallback
    // is to scan the list rather than add a new procedure call.
    queryFn: () =>
      api.studios.list().then((r) => r.items.find((s) => s.id === studioId) ?? null),
    enabled: !!studioId,
  });

  const createBooking = useMutation({
    mutationFn: () => {
      if (!authStore.accessToken()) {
        throw new ApiError('Sign in via Onboarding first.', 'UNAUTHORIZED', 401);
      }
      if (!sessionId) {
        throw new ApiError('No class selected.', 'BAD_REQUEST', 400);
      }
      return api.bookings.create(sessionId, idempotencyKey);
    },
    onSuccess: () => setStep('confirm'),
  });

  if (!sessionId) {
    return (
      <div className="grid h-full place-items-center bg-bone p-6 text-center">
        <div>
          <p className="font-display text-[20px]">Pick a class first</p>
          <button
            onClick={() => goto('discover')}
            className="mt-3 text-[13px] font-medium text-clay underline"
          >
            Browse studios
          </button>
        </div>
      </div>
    );
  }

  if (sessionQuery.isLoading || !sessionQuery.data) {
    return (
      <div className="grid h-full place-items-center bg-bone p-6 text-center">
        <p className="text-[14px] text-ink-60">Loading class…</p>
      </div>
    );
  }

  const sess = sessionQuery.data;
  const display = enrichSession(sess);
  const startFmt = formatStartsAt(sess.startsAt);
  const studio = studioQuery.data;

  const stepIndex: Record<Step, number> = { class: 1, time: 2, addons: 3, payment: 4, confirm: 5 };
  const total = priceUsd(sess.price) + (addMat ? 3 : 0);
  const cancellationHours = 12; // backend's default; surfaced via studios.get when present

  const next = () => {
    const order: Step[] = ['class', 'time', 'addons', 'payment', 'confirm'];
    const i = order.indexOf(step);
    if (step === 'payment') {
      // Real backend call. Step advances to 'confirm' only if it succeeds.
      createBooking.mutate();
      return;
    }
    if (i < order.length - 1) setStep(order[i + 1]!);
  };
  const back = () => {
    const order: Step[] = ['class', 'time', 'addons', 'payment', 'confirm'];
    const i = order.indexOf(step);
    if (i > 0) setStep(order[i - 1]!);
    else goto('studio');
  };

  const errorMessage = (() => {
    const e = createBooking.error;
    if (!e) return null;
    if (e instanceof ApiError) {
      if (e.code === 'CONFLICT') return 'This class just filled up. Try another time.';
      if (e.code === 'UNAUTHORIZED') return 'Sign in via Onboarding to confirm a booking.';
      return e.message;
    }
    return 'Something went wrong. Please try again.';
  })();

  return (
    <div className="fade-in relative h-full bg-bone">
      {step !== 'confirm' && (
        <div className="absolute inset-x-0 top-0 z-10 bg-bone px-4 pt-12 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={back}
              className="press-soft -ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-stone-soft"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1">
              <div className="label-eyebrow">Step {stepIndex[step]} of 4</div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-stone">
                <div
                  className="h-full bg-ink transition-all duration-300"
                  style={{ width: `${(stepIndex[step] / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 overflow-y-auto pt-[88px] pb-32 scrollbar-none">
        {step === 'class' && (
          <div className="fade-in px-5">
            <h1 className="font-display text-[28px] leading-tight">Confirm your class</h1>
            <p className="mt-2 text-[13px] text-ink-60">
              {sess.studioName}
              {studio?.neighborhood ? ` · ${studio.neighborhood}` : ''}
            </p>
            <div className="mt-6 rounded-2xl border border-ink bg-bone p-4">
              <div className="text-[15px] font-medium">
                {classTypeLabel(sess.type)} · {display.durationMin}m
              </div>
              <div className="mt-0.5 text-[12px] text-ink-60">
                {display.startsAt} · {sess.instructorName ?? 'TBA'}
              </div>
              <div className="mt-3 flex items-center justify-between text-[13px]">
                <span className="text-ink-60">
                  {Math.max(0, sess.capacity - sess.bookedCount)} of {sess.capacity} seats left
                </span>
                <span className="num font-medium">${priceUsd(sess.price)}</span>
              </div>
            </div>
          </div>
        )}

        {step === 'time' && (
          <div className="fade-in px-5">
            <h1 className="font-display text-[28px] leading-tight">Confirm the time</h1>
            <p className="mt-2 text-[13px] text-ink-60">
              {classTypeLabel(sess.type)} with {sess.instructorName ?? 'TBA'}
            </p>

            <div className="mt-6 rounded-2xl border border-ink bg-bone p-5 text-center">
              <div className="font-display text-[26px]">{startFmt.time}</div>
              <div className="mt-1 text-[13px] text-ink-60">{startFmt.date}</div>
            </div>

            <div className="mt-7 rounded-2xl border border-stone bg-bone p-4">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <Clock size={14} />
                Cancellation policy
              </div>
              <p className="mt-1 text-[13px] leading-[1.55] text-ink-60">
                Free cancellation up to {cancellationHours} hours before class. After that the
                session counts toward your monthly cap and isn&apos;t refundable.
              </p>
            </div>
          </div>
        )}

        {step === 'addons' && (
          <div className="fade-in px-5">
            <h1 className="font-display text-[28px] leading-tight">Anything else?</h1>
            <p className="mt-2 text-[13px] text-ink-60">Add-ons are optional.</p>

            <ul className="mt-6 space-y-3">
              <li>
                <button
                  onClick={() => setAddMat((v) => !v)}
                  className={[
                    'press-soft flex w-full items-start gap-4 rounded-2xl border bg-bone p-5 text-start transition-colors',
                    addMat ? 'border-ink' : 'border-stone',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'mt-0.5 grid h-6 w-6 place-items-center rounded-md border',
                      addMat ? 'border-ink bg-ink text-bone' : 'border-stone',
                    ].join(' ')}
                  >
                    {addMat ? <Check size={14} /> : null}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-medium">Mat rental</span>
                      <span className="num text-[14px]">+$3</span>
                    </div>
                    <p className="mt-1 text-[13px] text-ink-60">
                      Bring a friend? Add a mat for them. Reserved at the desk.
                    </p>
                  </div>
                </button>
              </li>
              <li>
                <div className="flex items-start gap-4 rounded-2xl border border-stone bg-sand/40 p-5 opacity-70">
                  <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-md border border-stone bg-bone" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-medium">Towel service</span>
                      <span className="text-[13px] text-ink-60">Included</span>
                    </div>
                    <p className="mt-1 text-[13px] text-ink-60">
                      Already part of your booking at {sess.studioName}.
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        )}

        {step === 'payment' && (
          <div className="fade-in px-5">
            <h1 className="font-display text-[28px] leading-tight">How would you like to pay?</h1>

            <ul className="mt-6 space-y-3">
              {(
                [
                  { id: 'card', icon: CreditCard, title: 'Card', sub: 'Visa ending 4242' },
                  { id: 'cash', icon: Wallet, title: 'Cash at the studio', sub: 'Pay when you arrive' },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const sel = pay === opt.id;
                return (
                  <li key={opt.id}>
                    <button
                      onClick={() => setPay(opt.id)}
                      className={[
                        'press-soft flex w-full items-center gap-4 rounded-2xl border bg-bone p-4 text-start transition-colors',
                        sel ? 'border-ink' : 'border-stone',
                      ].join(' ')}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-sand">
                        <Icon size={18} />
                      </span>
                      <div className="flex-1">
                        <div className="text-[15px] font-medium">{opt.title}</div>
                        <div className="text-[12px] text-ink-60">{opt.sub}</div>
                      </div>
                      <span
                        className={[
                          'h-5 w-5 rounded-full border-2',
                          sel ? 'border-ink bg-ink' : 'border-stone',
                        ].join(' ')}
                      >
                        {sel ? (
                          <span className="block h-full w-full rounded-full ring-2 ring-bone ring-inset" />
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <section className="mt-7 rounded-2xl bg-sand/60 p-5">
              <div className="label-eyebrow">Order</div>
              <ul className="mt-3 space-y-2.5 text-[14px]">
                <li className="flex justify-between">
                  <span>
                    {classTypeLabel(sess.type)} · {display.durationMin}m
                  </span>
                  <span className="num">${priceUsd(sess.price)}.00</span>
                </li>
                {addMat && (
                  <li className="flex justify-between">
                    <span>Mat rental</span>
                    <span className="num">$3.00</span>
                  </li>
                )}
                <li className="hairline-t pt-3 flex justify-between text-[15px] font-medium">
                  <span>Total</span>
                  <span className="num">${total}.00</span>
                </li>
              </ul>
              <p className="mt-4 text-[12px] leading-[1.5] text-ink-60">
                Charged on confirmation. Free to cancel up to {cancellationHours} hours before class
                — full refund.
              </p>
              {errorMessage && (
                <p
                  role="alert"
                  className="mt-3 rounded-md border border-terracotta/40 bg-terracotta/10 p-3 text-[13px] text-terracotta"
                >
                  {errorMessage}
                </p>
              )}
            </section>
          </div>
        )}

        {step === 'confirm' && (
          <div className="fade-in flex h-full flex-col px-5 pt-2">
            <div className="flex justify-end pt-4">
              <button
                onClick={() => goto('discover')}
                className="text-[13px] font-medium text-ink-60 underline underline-offset-4"
              >
                Done
              </button>
            </div>
            <div className="flex flex-col items-center pt-10">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-sage text-bone">
                <Check size={28} strokeWidth={2} />
              </div>
              <h1 className="font-display mt-7 text-center text-[30px] leading-tight">
                You&apos;re booked.
              </h1>
              <p className="mt-2 text-center text-[14px] text-ink-60">
                We&apos;ll send the details to your phone shortly.
              </p>
            </div>

            <div className="mt-9 rounded-2xl bg-sand p-5">
              <div className="label-eyebrow">Confirmed</div>
              <h3 className="font-display mt-1 text-[22px]">
                {classTypeLabel(sess.type)} with {(sess.instructorName ?? 'TBA').split(' ')[0]}
              </h3>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                <li className="flex items-start gap-3">
                  <Clock size={14} className="mt-1 text-ink-60" />
                  <span>
                    {startFmt.date} · <span className="num font-medium">{startFmt.time}</span> —{' '}
                    {display.durationMin} min
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={14} className="mt-1 text-ink-60" />
                  <span>
                    {sess.studioName}
                    {studio?.address ? (
                      <>
                        {' '}
                        · <span className="text-ink-60">{studio.address}</span>
                      </>
                    ) : null}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CreditCard size={14} className="mt-1 text-ink-60" />
                  <span>
                    {pay === 'card' ? 'Charged $' : 'To pay at studio: $'}
                    <span className="num">{total}.00</span>
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex gap-2">
              <Button variant="tertiary" block onClick={() => goto('bookings')}>
                See my bookings
              </Button>
              <Button block onClick={() => goto('discover')}>
                Book another
              </Button>
            </div>
            <div className="h-8" />
          </div>
        )}
      </div>

      {step !== 'confirm' && (
        <StickyCTA
          info={
            step === 'payment' ? (
              <span>
                Total <span className="num font-medium text-ink">${total}.00</span> ·{' '}
                {pay === 'card' ? 'Card' : 'Pay at studio'}
              </span>
            ) : (
              <span>
                {classTypeLabel(sess.type)} ·{' '}
                <span className="num">{step === 'time' ? startFmt.time : display.startsAt}</span> · $
                {priceUsd(sess.price)}
              </span>
            )
          }
        >
          <Button block onClick={next} disabled={createBooking.isPending}>
            {createBooking.isPending
              ? 'Confirming…'
              : step === 'payment'
                ? 'Confirm and pay'
                : 'Continue'}
          </Button>
        </StickyCTA>
      )}
    </div>
  );
}
