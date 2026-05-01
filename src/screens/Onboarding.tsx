import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Phone, User, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { ScreenId } from '../App';
import { api, ApiError } from '../lib/api';
import { authStore } from '../lib/auth';

const slides = [
  {
    eyebrow: 'A pilates studio in your pocket',
    headline: 'Book a class in three taps. Skip the spreadsheet.',
    body:
      'Beirut’s reformer studios, mat practices and clinical sessions — searchable, bookable, in one place.',
    image:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&h=1400&q=80',
  },
  {
    eyebrow: 'Why people stay',
    headline: 'Real studios. Real instructors. Honest reviews.',
    body:
      'Six-mat reformer floors. Physiotherapists who teach pre-natal. The kind of teacher who remembers your knee.',
    image:
      'https://images.unsplash.com/photo-1591291621164-2c6367723315?auto=format&fit=crop&w=900&h=1400&q=80',
  },
];

type Role = 'client' | 'instructor';
type Step = 0 | 1 | 2 | 'phone' | 'code';

const PHONE_RE = /^\+961\d{7,8}$/;

export function Onboarding({ goto }: { goto: (id: ScreenId) => void }) {
  const [step, setStep] = useState<Step>(0);
  const [role, setRole] = useState<Role | null>(null);
  const [phone, setPhone] = useState('+96170000001');
  const [code, setCode] = useState('');

  const sendOtp = useMutation({
    mutationFn: (p: string) => api.auth.sendOtp(p),
    onSuccess: () => setStep('code'),
  });

  const verifyOtp = useMutation({
    mutationFn: ({ p, c }: { p: string; c: string }) => api.auth.verifyOtp(p, c),
    onSuccess: (session) => {
      authStore.save(session);
      // If the user was bounced here mid-flow (e.g. tried to confirm a
      // booking while signed-out), return them to that screen instead of
      // dropping them on Discover.
      const redirect = window.localStorage.getItem('pilates:postAuthRedirect');
      if (redirect === 'booking') {
        window.localStorage.removeItem('pilates:postAuthRedirect');
        goto('booking');
        return;
      }
      goto('discover');
    },
  });

  // Marketing slides
  if (step === 0 || step === 1) {
    const slide = slides[step]!;
    return (
      <div className="fade-in relative h-full bg-bone">
        <img src={slide.image} alt="" className="absolute inset-0 h-[62%] w-full object-cover" />
        <div
          className="absolute inset-x-0 top-[55%] h-[12%]"
          style={{
            background: 'linear-gradient(to bottom, rgba(250,247,242,0) 0%, var(--color-bone) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 top-[58%] flex flex-col px-6 pb-10">
          <div className="flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={[
                  'h-1 rounded-full transition-all',
                  i === step ? 'w-8 bg-ink' : 'w-2 bg-stone',
                ].join(' ')}
              />
            ))}
          </div>
          <div className="label-eyebrow mt-7 text-center">{slide.eyebrow}</div>
          <h1 className="font-display mt-3 text-center text-[34px] leading-[1.05]">
            {slide.headline}
          </h1>
          <p className="mt-4 text-center text-[15px] leading-[1.55] text-ink-60">{slide.body}</p>
          <div className="mt-auto pt-6">
            <Button
              block
              onClick={() => setStep(step === 0 ? 1 : 2)}
              trailing={<ArrowRight size={18} />}
            >
              {step === 0 ? 'Continue' : 'Sounds good'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Role choice
  if (step === 2) {
    return (
      <div className="fade-in flex h-full flex-col bg-bone px-6 pt-16 pb-10">
        <div className="label-eyebrow">Welcome</div>
        <h1 className="font-display mt-3 text-[32px] leading-[1.1]">
          Are you here to <em className="italic">practice</em>, or to{' '}
          <em className="italic">teach</em>?
        </h1>
        <p className="mt-3 text-[14px] text-ink-60">
          You can switch later. We just want to show you the right thing first.
        </p>
        <div className="mt-8 space-y-3">
          {(
            [
              {
                id: 'client' as const,
                icon: User,
                title: 'Practising',
                body: 'Find studios, book classes, track sessions.',
              },
              {
                id: 'instructor' as const,
                icon: Sparkles,
                title: 'Teaching',
                body: 'Manage your schedule, students and earnings.',
              },
            ]
          ).map((opt) => {
            const Icon = opt.icon;
            const selected = role === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setRole(opt.id)}
                className={[
                  'press-soft flex w-full items-center gap-4 rounded-2xl border p-5 text-start transition-colors',
                  selected
                    ? 'border-ink bg-ink text-bone'
                    : 'border-stone bg-bone hover:bg-stone-soft',
                ].join(' ')}
              >
                <div
                  className={[
                    'grid h-11 w-11 place-items-center rounded-full',
                    selected ? 'bg-bone/15 text-bone' : 'bg-sand text-ink',
                  ].join(' ')}
                >
                  <Icon size={20} strokeWidth={1.6} />
                </div>
                <div>
                  <div className="text-[16px] font-medium">{opt.title}</div>
                  <div
                    className={[
                      'mt-0.5 text-[13px]',
                      selected ? 'text-bone/70' : 'text-ink-60',
                    ].join(' ')}
                  >
                    {opt.body}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-auto pt-6">
          <Button block disabled={!role} onClick={() => setStep('phone')}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Phone entry
  if (step === 'phone') {
    const phoneOk = PHONE_RE.test(phone.trim());
    return (
      <div className="fade-in flex h-full flex-col bg-bone px-6 pt-16 pb-10">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-sand">
          <Phone size={26} strokeWidth={1.6} />
        </div>
        <h1 className="font-display mt-7 text-[30px] leading-[1.1]">What&apos;s your number?</h1>
        <p className="mt-3 text-[15px] leading-[1.55] text-ink-60">
          We&apos;ll text you a 6-digit code. No password to remember.
        </p>

        <label className="mt-7 block">
          <span className="label-eyebrow">Mobile</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+96170123456"
            className="num mt-2 h-12 w-full rounded-xl border border-stone bg-bone px-4 text-[16px] focus:border-ink focus:outline-none"
          />
          <span className="mt-1.5 block text-[12px] text-ink-60">
            Lebanon only · format <span className="num">+961…</span>
          </span>
        </label>

        {sendOtp.error && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-terracotta/40 bg-terracotta/10 p-3 text-[13px] text-terracotta"
          >
            {sendOtp.error instanceof ApiError ? sendOtp.error.message : 'Something went wrong.'}
          </p>
        )}

        <div className="mt-auto space-y-3 pt-6">
          <Button
            block
            disabled={!phoneOk || sendOtp.isPending}
            onClick={() => sendOtp.mutate(phone.trim())}
          >
            {sendOtp.isPending ? 'Sending…' : 'Send code'}
          </Button>
          <Button block variant="ghost" onClick={() => goto('discover')}>
            Browse without an account
          </Button>
        </div>
      </div>
    );
  }

  // OTP code entry
  return (
    <div className="fade-in flex h-full flex-col bg-bone px-6 pt-16 pb-10">
      <div className="label-eyebrow">Code sent to</div>
      <div className="num mt-1 text-[14px] font-medium">{phone}</div>
      <h1 className="font-display mt-5 text-[30px] leading-[1.1]">Enter the 6-digit code</h1>
      <p className="mt-3 text-[15px] leading-[1.55] text-ink-60">
        Local-dev mode accepts <span className="num font-medium">123456</span> for any phone.
      </p>

      <label className="mt-7 block">
        <span className="label-eyebrow">Code</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="num mt-2 h-14 w-full rounded-xl border border-stone bg-bone px-4 text-center text-[26px] tracking-[0.6em] focus:border-ink focus:outline-none"
        />
      </label>

      {verifyOtp.error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-terracotta/40 bg-terracotta/10 p-3 text-[13px] text-terracotta"
        >
          {verifyOtp.error instanceof ApiError
            ? verifyOtp.error.message
            : 'Could not verify the code.'}
        </p>
      )}

      <div className="mt-auto space-y-3 pt-6">
        <Button
          block
          disabled={code.length !== 6 || verifyOtp.isPending}
          onClick={() => verifyOtp.mutate({ p: phone.trim(), c: code })}
        >
          {verifyOtp.isPending ? 'Verifying…' : 'Verify and continue'}
        </Button>
        <Button block variant="ghost" onClick={() => setStep('phone')}>
          Use a different number
        </Button>
      </div>
    </div>
  );
}
