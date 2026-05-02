import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Check,
  Pencil,
} from 'lucide-react';
import type { ScreenId } from '../App';
import { BottomNav } from '../components/ui/BottomNav';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { useToast } from '../components/ui/Toast';
import { api, type CustomerProfileWire, type UpdateProfileInput } from '../lib/api';
import { authStore } from '../lib/auth';
import { useI18n, type Lang } from '../lib/i18n';

type RowId = 'pay' | 'lang' | 'city' | 'notif' | 'priv' | 'help' | 'edit';

interface Row {
  id: RowId;
  label: string;
  hint: string;
  icon: typeof Bell;
}

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
  { value: 'fr', label: 'Français' },
] as const;

const CITY_OPTIONS = ['Beirut', 'Jounieh', 'Tripoli', 'Saida', 'Tyre', 'Zahlé', 'Byblos'];

function readPref<T extends string>(key: string, fallback: T): T {
  const v = window.localStorage.getItem(key);
  return (v as T) || fallback;
}

// Map between i18n UI codes and the backend's enum values.
const LANG_TO_BACKEND: Record<Lang, 'EN' | 'AR' | 'FR'> = { en: 'EN', ar: 'AR', fr: 'FR' };
const LANG_FROM_BACKEND: Record<'EN' | 'AR' | 'FR', Lang> = { EN: 'en', AR: 'ar', FR: 'fr' };

export function Profile({ goto }: { goto: (id: ScreenId) => void }) {
  const signedIn = !!authStore.accessToken();
  const toast = useToast();
  const { lang, setLang, t } = useI18n();
  const queryClient = useQueryClient();

  const [openSheet, setOpenSheet] = useState<RowId | null>(null);
  const [city, setCity] = useState<string>(() => readPref<string>('pilates:city', 'Beirut'));
  const [notifWA, setNotifWA] = useState<boolean>(
    () => (window.localStorage.getItem('pilates:notif:whatsapp') ?? '1') === '1',
  );
  const [notifPush, setNotifPush] = useState<boolean>(
    () => (window.localStorage.getItem('pilates:notif:push') ?? '1') === '1',
  );

  // Persist non-i18n prefs immediately. (Lang is persisted by I18nProvider.)
  useEffect(() => window.localStorage.setItem('pilates:city', city), [city]);
  useEffect(
    () => window.localStorage.setItem('pilates:notif:whatsapp', notifWA ? '1' : '0'),
    [notifWA],
  );
  useEffect(
    () => window.localStorage.setItem('pilates:notif:push', notifPush ? '1' : '0'),
    [notifPush],
  );

  const meQuery = useQuery({
    queryKey: ['auth.me'],
    queryFn: () => api.auth.me(),
    enabled: signedIn,
  });

  const profileQuery = useQuery({
    queryKey: ['customers.getMine'],
    queryFn: () => api.customers.getMine(),
    enabled: signedIn,
  });

  const updateProfile = useMutation({
    mutationFn: (input: UpdateProfileInput) => api.customers.updateMine(input),
    onSuccess: (next) => {
      queryClient.setQueryData(['customers.getMine'], next);
    },
  });

  // Reflect server values into the local UI mirrors so the "city" + "lang"
  // pickers open with the right pre-selection on first load. We only push
  // *down* from the server here; pickers push *up* via updateProfile when
  // changed.
  useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    if (p.city) setCity(p.city);
    const uiLang = LANG_FROM_BACKEND[p.preferredLanguage];
    if (uiLang !== lang) setLang(uiLang);
    // We deliberately don't depend on `lang`/`setLang` so we don't fight the
    // user mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data?.id]);

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
            <div className="label-eyebrow">{t('profile.account_eyebrow')}</div>
            <h1 className="font-display mt-1 text-[30px] leading-[1.1]">{t('profile.title')}</h1>
          </header>
          <div className="mt-10 px-5">
            <div className="rounded-2xl border border-dashed border-stone bg-bone px-5 py-10 text-center">
              <UserPlus size={20} className="mx-auto text-ink-60" />
              <h3 className="font-display mt-3 text-[20px]">{t('profile.sign_in_title')}</h3>
              <p className="mt-1.5 text-[13px] text-ink-60">{t('profile.sign_in_sub')}</p>
              <Button size="md" className="mt-5" onClick={() => goto('onboarding')}>
                {t('common.sign_in')}
              </Button>
            </div>
          </div>
        </div>
        <BottomNav active="profile" onSelect={goto} />
      </div>
    );
  }

  const me = meQuery.data;
  const profile = profileQuery.data;
  const fullName = profile?.fullName ?? me?.fullName ?? 'You';
  const phone = profile?.phone ?? me?.phone ?? '';
  const avatarUrl = profile?.avatarUrl ?? null;
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

  const langLabel = LANG_OPTIONS.find((o) => o.value === lang)?.label ?? 'English';
  const notifChannels = [notifWA && 'WhatsApp', notifPush && 'Push'].filter(Boolean).join(' + ') ||
    'Off';

  const account: Row[] = [
    { id: 'pay', label: t('profile.payment_methods'), hint: 'Cash · card', icon: CreditCard },
    { id: 'lang', label: t('profile.language'), hint: langLabel, icon: Languages },
    { id: 'city', label: t('profile.city'), hint: city, icon: Globe },
    { id: 'notif', label: t('profile.notifications'), hint: notifChannels, icon: Bell },
  ];
  const support: Row[] = [
    { id: 'priv', label: t('profile.privacy'), hint: '', icon: ShieldCheck },
    { id: 'help', label: t('profile.help'), hint: '', icon: HelpCircle },
  ];

  const exportMine = async () => {
    try {
      const data = (await fetch('/api/trpc/privacy.exportMine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.accessToken() ?? ''}`,
        },
        body: '{}',
      }).then((r) => r.json())) as { result?: { data?: unknown } };
      const blob = new Blob([JSON.stringify(data.result?.data ?? data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pilates-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.show(t('profile.download_started'));
    } catch {
      toast.show(t('profile.download_failed'), 'warn');
    }
  };

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-[160px] scrollbar-none">
        <header className="px-5 pt-14">
          <div className="label-eyebrow">{t('profile.account_eyebrow')}</div>
          <h1 className="font-display mt-1 text-[30px] leading-[1.1]">{t('profile.title')}</h1>
        </header>

        {/* Identity card */}
        <section className="mt-6 mx-5 overflow-hidden rounded-[20px] bg-sand p-5">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-16 w-16 flex-shrink-0 rounded-full object-cover ring-2 ring-bone"
              />
            ) : (
              <div
                className="grid h-16 w-16 place-items-center rounded-full bg-ink text-bone font-display text-[22px]"
                aria-hidden
              >
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-medium truncate">{fullName}</div>
              <div className="mt-0.5 text-[12px] text-ink-60 num">{phone}</div>
              {profile?.city && (
                <div className="mt-0.5 text-[12px] text-ink-60">{profile.city}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpenSheet('edit')}
              aria-label={t('profile.edit')}
              className="press-soft grid h-9 w-9 place-items-center rounded-full bg-bone text-ink"
            >
              <Pencil size={15} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <Stat label={t('profile.sessions')} value={String(totalSessions)} />
            <Stat label={t('profile.studios')} value={String(distinctStudios)} />
            <Stat label={t('profile.upcoming')} value={String(upcomingCount)} />
          </div>
        </section>

        {/* Membership — placeholder until backend exposes Subscription self-view */}
        <section className="mt-5 mx-5 rounded-[20px] border border-stone bg-bone p-5">
          <div className="label-eyebrow">{t('profile.membership')}</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="font-display text-[20px]">{t('profile.open_plan')}</div>
              <p className="mt-0.5 text-[12px] text-ink-60">{t('profile.open_plan_sub')}</p>
            </div>
            <button
              onClick={() => goto('discover')}
              className="press-soft rounded-full bg-clay px-4 py-2 text-[12px] font-medium text-bone"
            >
              {t('profile.upgrade')}
            </button>
          </div>
        </section>

        {/* Account list */}
        <List title={t('profile.account')} rows={account} onOpen={(id) => setOpenSheet(id)} />
        <List title={t('profile.support')} rows={support} onOpen={(id) => setOpenSheet(id)} />

        <div className="mt-9 px-5">
          <button
            onClick={() => signOutMutation.mutate()}
            disabled={signOutMutation.isPending}
            className="press-soft inline-flex items-center gap-2 text-[14px] text-ink-60 disabled:opacity-50"
          >
            <LogOut size={14} />
            {signOutMutation.isPending ? t('common.loading') : t('common.sign_out')}
          </button>
        </div>

        <p className="mt-10 px-5 text-center font-display italic text-[12px] text-ink-60">
          Take care of your knees. They have to last you the rest of your life.
        </p>
      </div>

      <BottomNav active="profile" onSelect={goto} />

      {/* Sheets — one per setting row. Kept inside the screen so the phone-frame
          containment styling applies. */}
      <Sheet
        open={openSheet === 'edit'}
        title={t('profile.edit_profile_title')}
        onClose={() => setOpenSheet(null)}
      >
        {profile && (
          <EditProfileForm
            profile={profile}
            saving={updateProfile.isPending}
            onCancel={() => setOpenSheet(null)}
            onSave={async (patch) => {
              try {
                await updateProfile.mutateAsync(patch);
                if (patch.city !== undefined && patch.city) setCity(patch.city);
                setOpenSheet(null);
                toast.show(t('profile.profile_saved_toast'));
              } catch (e) {
                toast.show(
                  e instanceof Error && e.message ? e.message : t('profile.profile_save_failed'),
                  'warn',
                );
              }
            }}
            t={t}
          />
        )}
      </Sheet>

      <Sheet
        open={openSheet === 'lang'}
        title={t('profile.language')}
        onClose={() => setOpenSheet(null)}
      >
        <ul className="space-y-2">
          {LANG_OPTIONS.map((opt) => {
            const sel = lang === opt.value;
            return (
              <li key={opt.value}>
                <button
                  onClick={() => {
                    setLang(opt.value as Lang);
                    setOpenSheet(null);
                    toast.show(t('profile.lang_set', { lang: opt.label }));
                    if (signedIn) {
                      updateProfile.mutate({
                        preferredLanguage: LANG_TO_BACKEND[opt.value as Lang],
                      });
                    }
                  }}
                  className={[
                    'press-soft flex w-full items-center justify-between rounded-2xl border bg-bone px-4 py-3 text-start',
                    sel ? 'border-ink' : 'border-stone',
                  ].join(' ')}
                >
                  <span className="text-[15px] font-medium">{opt.label}</span>
                  {sel && <Check size={16} />}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-[12px] text-ink-60">
          Saved on this device. UI translation arrives in a follow-up — currently changes the
          stored preference only.
        </p>
      </Sheet>

      <Sheet open={openSheet === 'city'} title={t('profile.city')} onClose={() => setOpenSheet(null)}>
        <ul className="space-y-2">
          {CITY_OPTIONS.map((c) => {
            const sel = city === c;
            return (
              <li key={c}>
                <button
                  onClick={() => {
                    setCity(c);
                    setOpenSheet(null);
                    toast.show(t('profile.city_set', { city: c }));
                    if (signedIn) updateProfile.mutate({ city: c });
                  }}
                  className={[
                    'press-soft flex w-full items-center justify-between rounded-2xl border bg-bone px-4 py-3 text-start',
                    sel ? 'border-ink' : 'border-stone',
                  ].join(' ')}
                >
                  <span className="text-[15px] font-medium">{c}</span>
                  {sel && <Check size={16} />}
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>

      <Sheet
        open={openSheet === 'notif'}
        title={t('profile.notifications')}
        onClose={() => setOpenSheet(null)}
      >
        <ul className="space-y-3">
          <li>
            <ToggleRow
              label="WhatsApp"
              hint="Class reminders, confirmations"
              on={notifWA}
              onToggle={() => setNotifWA((v) => !v)}
            />
          </li>
          <li>
            <ToggleRow
              label="Push"
              hint="Last-minute changes, waitlist updates"
              on={notifPush}
              onToggle={() => setNotifPush((v) => !v)}
            />
          </li>
        </ul>
        <p className="mt-4 text-[12px] text-ink-60">
          Channel preferences saved locally. Backend sync arrives once the
          <code className="num"> notifications.preferences </code>
          procedure lands.
        </p>
      </Sheet>

      <Sheet open={openSheet === 'pay'} title={t('profile.payment_methods')} onClose={() => setOpenSheet(null)}>
        <div className="rounded-2xl border border-stone bg-bone p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sand">
              <CreditCard size={18} />
            </span>
            <div>
              <div className="text-[15px] font-medium">Cash at the studio</div>
              <div className="text-[12px] text-ink-60">Always available — pay on arrival</div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-ink-60">
          Card payments via Stripe / Whish / OMT are wired on the backend in stub mode for dev. The
          real card-on-file flow lands once the marketplace surfaces a customer-facing payment-
          methods procedure.
        </p>
      </Sheet>

      <Sheet open={openSheet === 'priv'} title={t('profile.privacy')} onClose={() => setOpenSheet(null)}>
        <div className="space-y-3">
          <div className="rounded-2xl border border-stone bg-bone p-4">
            <div className="text-[15px] font-medium">Download my data</div>
            <p className="mt-1 text-[13px] text-ink-60">
              JSON export of your profile, bookings, and preferences. Honors Lebanese Law 81/2018
              data-portability rights.
            </p>
            <Button size="md" className="mt-3" onClick={exportMine}>
              Download
            </Button>
          </div>
          <div className="rounded-2xl border border-clay/40 bg-bone p-4">
            <div className="text-[15px] font-medium">Delete my account</div>
            <p className="mt-1 text-[13px] text-ink-60">
              Removes your name, phone, and personal data per our retention policy. Booking
              history kept anonymously for tax compliance.
            </p>
            <Button
              variant="tertiary"
              size="md"
              className="mt-3"
              onClick={() => toast.show('Deletion confirm flow lands in a follow-up.', 'info')}
            >
              Request deletion
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet open={openSheet === 'help'} title={t('profile.help')} onClose={() => setOpenSheet(null)}>
        <ul className="space-y-3 text-[14px]">
          <li className="rounded-2xl border border-stone bg-bone p-4">
            <div className="font-medium">Booking didn&apos;t go through?</div>
            <p className="mt-1 text-[13px] text-ink-60">
              Most class-full and duplicate-booking errors resolve themselves — refresh the studio
              page and try a different time slot.
            </p>
          </li>
          <li className="rounded-2xl border border-stone bg-bone p-4">
            <div className="font-medium">Reach a real human</div>
            <p className="mt-1 text-[13px] text-ink-60">
              WhatsApp <span className="num font-medium">+961 70 200 014</span>. We aim to reply
              within an hour during business hours (9–18 Asia/Beirut, Mon–Sat).
            </p>
          </li>
          <li className="rounded-2xl border border-stone bg-bone p-4">
            <div className="font-medium">Studio-specific issues</div>
            <p className="mt-1 text-[13px] text-ink-60">
              For mat allergies, accessibility, or instructor preferences, contact the studio
              directly — their phone is on the StudioDetail page.
            </p>
          </li>
        </ul>
      </Sheet>
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

function List({
  title,
  rows,
  onOpen,
}: {
  title: string;
  rows: Row[];
  onOpen: (id: RowId) => void;
}) {
  return (
    <section className="mt-7 px-5">
      <div className="label-eyebrow mb-2">{title}</div>
      <ul className="overflow-hidden rounded-2xl border border-stone bg-bone">
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <li key={r.id}>
              <button
                onClick={() => onOpen(r.id)}
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

function ToggleRow({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="press-soft flex w-full items-center justify-between rounded-2xl border border-stone bg-bone p-4 text-start"
    >
      <div>
        <div className="text-[15px] font-medium">{label}</div>
        <div className="mt-0.5 text-[12px] text-ink-60">{hint}</div>
      </div>
      <span
        className={[
          'inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
          on ? 'bg-ink' : 'bg-stone',
        ].join(' ')}
        aria-hidden
      >
        <span
          className={[
            'h-5 w-5 rounded-full bg-bone transition-transform',
            on ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </span>
    </button>
  );
}

// =============================================================================
// EditProfileForm — backed by customers.updateMine
// =============================================================================

const AVATAR_GALLERY = [
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&h=240&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&h=240&q=80',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&h=240&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&h=240&q=80',
  'https://images.unsplash.com/photo-1517363898874-737b62a7db91?auto=format&fit=crop&w=240&h=240&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&h=240&q=80',
];

function EditProfileForm({
  profile,
  saving,
  onCancel,
  onSave,
  t,
}: {
  profile: CustomerProfileWire;
  saving: boolean;
  onCancel: () => void;
  onSave: (patch: UpdateProfileInput) => void | Promise<void>;
  t: ReturnType<typeof useI18n>['t'];
}) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [neighborhood, setNeighborhood] = useState(profile.neighborhood ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const patch: UpdateProfileInput = {};
    if (fullName.trim() && fullName.trim() !== profile.fullName) patch.fullName = fullName.trim();
    const emailNext = email.trim() || null;
    if (emailNext !== (profile.email ?? null)) patch.email = emailNext;
    const cityNext = city.trim() || null;
    if (cityNext !== (profile.city ?? null)) patch.city = cityNext;
    const nbNext = neighborhood.trim() || null;
    if (nbNext !== (profile.neighborhood ?? null)) patch.neighborhood = nbNext;
    const avatarNext = avatarUrl.trim() || null;
    if (avatarNext !== (profile.avatarUrl ?? null)) patch.avatarUrl = avatarNext;
    const bioNext = bio.trim() || null;
    if (bioNext !== (profile.bio ?? null)) patch.bio = bioNext;
    if (Object.keys(patch).length === 0) {
      onCancel();
      return;
    }
    void onSave(patch);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-[13px] text-ink-60">{t('profile.edit_profile_sub')}</p>

      {/* Avatar picker */}
      <div>
        <div className="label-eyebrow mb-2">{t('profile.field_avatar')}</div>
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover ring-2 ring-stone"
            />
          ) : (
            <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-full bg-ink text-bone font-display text-[20px]">
              {fullName
                .split(/\s+/)
                .map((p) => p.charAt(0))
                .slice(0, 2)
                .join('')
                .toUpperCase() || '·'}
            </div>
          )}
          <div className="-mr-1 flex flex-1 gap-2 overflow-x-auto pr-1 scrollbar-none">
            {AVATAR_GALLERY.map((url) => {
              const sel = avatarUrl === url;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={[
                    'press-soft h-12 w-12 flex-shrink-0 overflow-hidden rounded-full',
                    sel ? 'ring-2 ring-ink' : 'ring-1 ring-stone',
                  ].join(' ')}
                  aria-label="Pick avatar"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
        <input
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
          className="mt-3 h-11 w-full rounded-xl border border-stone bg-bone px-3 text-[14px] focus:border-ink focus:outline-none"
        />
      </div>

      <Field label={t('profile.field_name')}>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          maxLength={120}
          className="h-11 w-full rounded-xl border border-stone bg-bone px-3 text-[15px] focus:border-ink focus:outline-none"
        />
      </Field>

      <Field
        label={t('profile.field_phone')}
        hint={t('profile.field_phone_hint')}
      >
        <input
          value={profile.phone}
          readOnly
          disabled
          className="num h-11 w-full rounded-xl border border-stone bg-sand px-3 text-[15px] text-ink-60"
        />
      </Field>

      <Field label={t('profile.field_email')}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          placeholder="you@example.com"
          className="h-11 w-full rounded-xl border border-stone bg-bone px-3 text-[15px] focus:border-ink focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('profile.field_city')}>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={120}
            className="h-11 w-full rounded-xl border border-stone bg-bone px-3 text-[15px] focus:border-ink focus:outline-none"
          />
        </Field>
        <Field label={t('profile.field_neighborhood')}>
          <input
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            maxLength={120}
            className="h-11 w-full rounded-xl border border-stone bg-bone px-3 text-[15px] focus:border-ink focus:outline-none"
          />
        </Field>
      </div>

      <Field label={t('profile.field_bio')}>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={t('profile.field_bio_placeholder')}
          className="w-full rounded-xl border border-stone bg-bone p-3 text-[15px] leading-snug focus:border-ink focus:outline-none"
        />
      </Field>

      <div className="flex gap-3 pt-1">
        <Button variant="tertiary" size="md" onClick={onCancel} disabled={saving}>
          {t('common.cancel') ?? 'Cancel'}
        </Button>
        <Button block size="md" disabled={saving || fullName.trim().length === 0} type="submit">
          {saving ? t('common.loading') : t('profile.save')}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-eyebrow">{label}</span>
      <span className="mt-2 block">{children}</span>
      {hint && <span className="mt-1 block text-[12px] text-ink-60">{hint}</span>}
    </label>
  );
}
