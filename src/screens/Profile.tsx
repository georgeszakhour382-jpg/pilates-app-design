import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ChevronRight,
  Bell,
  CreditCard,
  Globe,
  HelpCircle,
  Languages,
  ShieldCheck,
  LogOut,
  UserPlus,
} from 'lucide-react';
import type { ScreenId } from '../App';
import { BottomNav } from '../components/ui/BottomNav';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { authStore } from '../lib/auth';

interface Row {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Bell;
}

const account: Row[] = [
  { id: 'pay', label: 'Payment methods', hint: 'Visa · Apple Pay', icon: CreditCard },
  { id: 'lang', label: 'Language', hint: 'English', icon: Languages },
  { id: 'city', label: 'City', hint: 'Beirut', icon: Globe },
  { id: 'notif', label: 'Notifications', hint: 'WhatsApp + Push', icon: Bell },
];

const support: Row[] = [
  { id: 'priv', label: 'Privacy & data', icon: ShieldCheck },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export function Profile({ goto }: { goto: (id: ScreenId) => void }) {
  const signedIn = !!authStore.accessToken();

  const meQuery = useQuery({
    queryKey: ['auth.me'],
    queryFn: () => api.auth.me(),
    enabled: signedIn,
  });

  const upcomingQuery = useQuery({
    queryKey: ['bookings.listMine', 'UPCOMING'],
    queryFn: () => api.bookings.listMine('UPCOMING'),
    enabled: signedIn,
  });

  const pastQuery = useQuery({
    queryKey: ['bookings.listMine', 'PAST'],
    queryFn: () => api.bookings.listMine('PAST'),
    enabled: signedIn,
  });

  const signOutMutation = useMutation({
    mutationFn: () => api.auth.signOut(),
    onSettled: () => {
      authStore.clear();
      goto('onboarding');
    },
  });

  if (!signedIn) {
    return (
      <div className="fade-in relative h-full bg-bone">
        <div className="absolute inset-0 overflow-y-auto pb-[160px] scrollbar-none">
          <header className="px-5 pt-14">
            <div className="label-eyebrow">Account</div>
            <h1 className="font-display mt-1 text-[30px] leading-[1.1]">Profile</h1>
          </header>
          <div className="mt-10 px-5">
            <div className="rounded-2xl border border-dashed border-stone bg-bone px-5 py-10 text-center">
              <UserPlus size={20} className="mx-auto text-ink-60" />
              <h3 className="font-display mt-3 text-[20px]">Sign in to see your profile</h3>
              <p className="mt-1.5 text-[13px] text-ink-60">
                Onboarding takes 30 seconds. We&apos;ll text you a code.
              </p>
              <Button size="md" className="mt-5" onClick={() => goto('onboarding')}>
                Sign in
              </Button>
            </div>
          </div>
        </div>
        <BottomNav active="profile" onSelect={goto} />
      </div>
    );
  }

  const me = meQuery.data;
  const fullName = me?.fullName ?? 'You';
  const phone = me?.phone ?? '';
  const initials = fullName
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const upcomingCount = upcomingQuery.data?.items.length ?? 0;
  const pastCount = pastQuery.data?.items.length ?? 0;
  const totalSessions = upcomingCount + pastCount;
  const distinctStudios = new Set(
    [...(upcomingQuery.data?.items ?? []), ...(pastQuery.data?.items ?? [])].map((b) => b.studioId),
  ).size;

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-[160px] scrollbar-none">
        <header className="px-5 pt-14">
          <div className="label-eyebrow">Account</div>
          <h1 className="font-display mt-1 text-[30px] leading-[1.1]">Profile</h1>
        </header>

        {/* Identity card */}
        <section className="mt-6 mx-5 overflow-hidden rounded-[20px] bg-sand p-5">
          <div className="flex items-center gap-4">
            <div
              className="grid h-16 w-16 place-items-center rounded-full bg-ink text-bone font-display text-[22px]"
              aria-hidden
            >
              {initials}
            </div>
            <div className="flex-1">
              <div className="text-[16px] font-medium">{fullName}</div>
              <div className="mt-0.5 text-[12px] text-ink-60 num">{phone}</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <Stat label="Sessions" value={String(totalSessions)} />
            <Stat label="Studios" value={String(distinctStudios)} />
            <Stat label="Upcoming" value={String(upcomingCount)} />
          </div>
        </section>

        {/* Membership — placeholder until backend exposes Subscription self-view */}
        <section className="mt-5 mx-5 rounded-[20px] border border-stone bg-bone p-5">
          <div className="label-eyebrow">Membership</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="font-display text-[20px]">Open Plan</div>
              <p className="mt-0.5 text-[12px] text-ink-60">Pay per class · no commitment</p>
            </div>
            <button
              onClick={() => goto('discover')}
              className="press-soft rounded-full bg-clay px-4 py-2 text-[12px] font-medium text-bone"
            >
              Upgrade
            </button>
          </div>
        </section>

        {/* Account list */}
        <List title="Account" rows={account} />
        <List title="Support" rows={support} />

        <div className="mt-9 px-5">
          <button
            onClick={() => signOutMutation.mutate()}
            disabled={signOutMutation.isPending}
            className="press-soft inline-flex items-center gap-2 text-[14px] text-ink-60 disabled:opacity-50"
          >
            <LogOut size={14} />
            {signOutMutation.isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

        <p className="mt-10 px-5 text-center font-display italic text-[12px] text-ink-60">
          Take care of your knees. They have to last you the rest of your life.
        </p>
      </div>

      <BottomNav active="profile" onSelect={goto} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-[24px] num leading-none">{value}</div>
      <div className="mt-1 text-[11px] text-ink-60">{label}</div>
    </div>
  );
}

function List({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="mt-7 px-5">
      <div className="label-eyebrow mb-2">{title}</div>
      <ul className="overflow-hidden rounded-2xl border border-stone bg-bone">
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <li key={r.id}>
              <button
                className={[
                  'press-soft flex w-full items-center gap-3 px-4 py-3.5 text-start',
                  i !== rows.length - 1 ? 'border-b border-stone/70' : '',
                ].join(' ')}
              >
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-sand text-ink-60">
                  <Icon size={16} />
                </span>
                <span className="flex-1 text-[14.5px]">{r.label}</span>
                {r.hint && <span className="text-[12.5px] text-ink-60">{r.hint}</span>}
                <ChevronRight size={16} className="text-ink-60" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
