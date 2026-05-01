import { useState } from 'react';
import { ArrowRight, MapPin, User, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

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

export function Onboarding() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [role, setRole] = useState<Role | null>(null);

  if (step === 0 || step === 1) {
    const slide = slides[step]!;
    return (
      <div className="fade-in relative h-full bg-bone">
        <img
          src={slide.image}
          alt=""
          className="absolute inset-0 h-[62%] w-full object-cover"
        />
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
              onClick={() => setStep(((step + 1) as 0 | 1 | 2))}
              trailing={<ArrowRight size={18} />}
            >
              {step === 0 ? 'Continue' : 'Sounds good'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="fade-in flex h-full flex-col bg-bone px-6 pt-16 pb-10">
        <div className="label-eyebrow">Welcome</div>
        <h1 className="font-display mt-3 text-[32px] leading-[1.1]">
          Are you here to <em className="italic">practice</em>, or to <em className="italic">teach</em>?
        </h1>
        <p className="mt-3 text-[14px] text-ink-60">
          You can switch later. We just want to show you the right thing first.
        </p>
        <div className="mt-8 space-y-3">
          {([
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
          ]).map((opt) => {
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
                  <div className={['mt-0.5 text-[13px]', selected ? 'text-bone/70' : 'text-ink-60'].join(' ')}>
                    {opt.body}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-auto pt-6">
          <Button block disabled={!role} onClick={() => setStep(3)}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // step === 3 — location permission
  return (
    <div className="fade-in flex h-full flex-col bg-bone px-6 pt-16 pb-10">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-sand">
        <MapPin size={26} strokeWidth={1.6} />
      </div>
      <h1 className="font-display mt-7 text-[30px] leading-[1.1]">
        Show studios near you?
      </h1>
      <p className="mt-3 text-[15px] leading-[1.55] text-ink-60">
        We use your location only to surface studios within 15 minutes of you, and to estimate travel time.
        Nothing is shared with studios or instructors.
      </p>

      <div className="mt-6 space-y-2 text-[13px] text-ink-60">
        <div className="flex gap-2">
          <span className="mt-2 h-1 w-1 rounded-full bg-ink-30" />
          <span>You can change this any time in Settings.</span>
        </div>
        <div className="flex gap-2">
          <span className="mt-2 h-1 w-1 rounded-full bg-ink-30" />
          <span>We never share precise location with anyone.</span>
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <Button block>Allow while using the app</Button>
        <Button block variant="ghost">
          Choose city manually
        </Button>
      </div>
    </div>
  );
}
