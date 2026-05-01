import { useState } from 'react';
import { ChevronLeft, Check, CreditCard, Wallet, Clock, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StickyCTA } from '../components/ui/StickyCTA';
import { findInstructor, findStudio, sessions } from '../data/mock';
import type { ClassSession } from '../data/mock';
import type { ScreenId } from '../App';

type Step = 'class' | 'time' | 'addons' | 'payment' | 'confirm';

export function Booking({ goto }: { goto: (id: ScreenId) => void }) {
  const [step, setStep] = useState<Step>('class');
  const [selected, setSelected] = useState<ClassSession>(sessions[0]!);
  const [time, setTime] = useState('09:00');
  const [addMat, setAddMat] = useState(false);
  const [pay, setPay] = useState<'card' | 'cash'>('card');

  const studio = findStudio(selected.studioId);
  const instructor = findInstructor(selected.instructorId);
  const stepIndex: Record<Step, number> = { class: 1, time: 2, addons: 3, payment: 4, confirm: 5 };

  const total = selected.priceUsd + (addMat ? 3 : 0);

  const next = () => {
    const order: Step[] = ['class', 'time', 'addons', 'payment', 'confirm'];
    const i = order.indexOf(step);
    if (i < order.length - 1) setStep(order[i + 1]!);
  };
  const back = () => {
    const order: Step[] = ['class', 'time', 'addons', 'payment', 'confirm'];
    const i = order.indexOf(step);
    if (i > 0) setStep(order[i - 1]!);
    else goto('studio');
  };

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
            <h1 className="font-display text-[28px] leading-tight">Choose a class</h1>
            <p className="mt-2 text-[13px] text-ink-60">
              {studio.name} · {studio.neighborhood}
            </p>
            <ul className="mt-6 space-y-2">
              {sessions.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setSelected(s)}
                    className={[
                      'press-soft flex w-full items-center justify-between rounded-2xl border bg-bone p-4 text-start',
                      selected.id === s.id ? 'border-ink' : 'border-stone',
                    ].join(' ')}
                  >
                    <div>
                      <div className="text-[15px] font-medium">{s.type} · {s.durationMin}m</div>
                      <div className="mt-0.5 text-[12px] text-ink-60">
                        {s.startsAt} · {findInstructor(s.instructorId).fullName}
                      </div>
                    </div>
                    <span className="num text-[15px] font-medium">${s.priceUsd}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 'time' && (
          <div className="fade-in px-5">
            <h1 className="font-display text-[28px] leading-tight">Choose a time</h1>
            <p className="mt-2 text-[13px] text-ink-60">
              {selected.type} with {instructor.fullName}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {['07:30', '09:00', '12:00', '15:30', '18:00', '19:30'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={[
                    'press-soft num h-12 rounded-xl border text-[14px] font-medium transition-colors',
                    time === t ? 'border-ink bg-ink text-bone' : 'border-stone bg-bone text-ink hover:bg-stone-soft',
                  ].join(' ')}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-stone bg-bone p-4">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <Clock size={14} />
                Cancellation policy
              </div>
              <p className="mt-1 text-[13px] leading-[1.55] text-ink-60">
                Free cancellation up to {studio.cancellationHours} hours before class. After that the
                session counts toward your monthly cap and isn’t refundable.
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
                      Already part of your booking at {studio.name}.
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
                        {sel ? <span className="block h-full w-full rounded-full ring-2 ring-bone ring-inset" /> : null}
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
                  <span>{selected.type} · {selected.durationMin}m</span>
                  <span className="num">${selected.priceUsd}.00</span>
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
                Charged on confirmation. Free to cancel up to {studio.cancellationHours} hours before class — full refund.
              </p>
            </section>
          </div>
        )}

        {step === 'confirm' && (
          <div className="fade-in flex h-full flex-col px-5 pt-2">
            <div className="flex justify-end pt-4">
              <button onClick={() => goto('discover')} className="text-[13px] font-medium text-ink-60 underline underline-offset-4">
                Done
              </button>
            </div>
            <div className="flex flex-col items-center pt-10">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-sage text-bone">
                <Check size={28} strokeWidth={2} />
              </div>
              <h1 className="font-display mt-7 text-center text-[30px] leading-tight">
                You’re booked.
              </h1>
              <p className="mt-2 text-center text-[14px] text-ink-60">
                We just sent the details to you on WhatsApp.
              </p>
            </div>

            <div className="mt-9 rounded-2xl bg-sand p-5">
              <div className="label-eyebrow">Confirmed</div>
              <h3 className="font-display mt-1 text-[22px]">{selected.type} with {instructor.fullName.split(' ')[0]}</h3>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                <li className="flex items-start gap-3">
                  <Clock size={14} className="mt-1 text-ink-60" />
                  <span>Tomorrow, May 2 · <span className="num font-medium">{time}</span> — {selected.durationMin} min</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={14} className="mt-1 text-ink-60" />
                  <span>{studio.name} · <span className="text-ink-60">{studio.address}</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <CreditCard size={14} className="mt-1 text-ink-60" />
                  <span>{pay === 'card' ? 'Charged $' : 'To pay at studio: $'}<span className="num">{total}.00</span></span>
                </li>
              </ul>
            </div>

            <section className="mt-7">
              <div className="label-eyebrow">What happens next</div>
              <ul className="mt-3 space-y-3 text-[13px] text-ink/85">
                <Step n="1" title="WhatsApp reminder">
                  We’ll message you 24 hours and 60 minutes before class.
                </Step>
                <Step n="2" title="Arrive 10 minutes early">
                  Your name is on the list. The desk has your mat.
                </Step>
                <Step n="3" title="After class">
                  Rate the session and rebook in one tap.
                </Step>
              </ul>
            </section>

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
              <span>Total <span className="num font-medium text-ink">${total}.00</span> · {pay === 'card' ? 'Card' : 'Pay at studio'}</span>
            ) : (
              <span>{selected.type} · <span className="num">{step === 'time' ? time : selected.startsAt}</span> · ${selected.priceUsd}</span>
            )
          }
        >
          <Button block onClick={next}>
            {step === 'payment' ? 'Confirm and pay' : 'Continue'}
          </Button>
        </StickyCTA>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-sand text-[12px] font-medium num">
        {n}
      </span>
      <div>
        <div className="text-[13.5px] font-medium">{title}</div>
        <div className="text-[13px] text-ink-60">{children}</div>
      </div>
    </li>
  );
}
