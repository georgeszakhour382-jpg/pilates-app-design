// Adapters between the marketplace API's data shapes and the design
// prototype's richer "DisplayStudio" / "DisplayBooking" types.
//
// The backend's `Studio` model intentionally only carries slug / name / city /
// neighborhood / address / lat-lng. Visual marketing fields (hero image,
// rating, priceFrom, classTypes, "why we love it" copy) aren't on the backend
// yet. The design prototype's `mock.ts` happens to share slugs with the
// backend seed, so we use it as a curated cosmetic lookup table while those
// fields remain backend-side.
//
// As soon as the backend gains those fields, replace `mockBySlug` with the
// real values and delete the fallbacks.

import type {
  BookingSummary,
  ClassSessionSummary,
  InstructorSummary as BackendInstructor,
  StudioDetail as BackendStudioDetail,
  StudioSummary,
} from './api';
import {
  studios as mockStudios,
  instructors as mockInstructors,
  type Studio as MockStudio,
  type ClassSession as MockSession,
  type Instructor as MockInstructor,
} from '../data/mock';

const mockStudioBySlug: Record<string, MockStudio> = Object.fromEntries(
  mockStudios.map((s) => [s.slug, s] as const),
);

// Generic fallback used when a backend studio has no matching mock entry —
// keeps the UI from breaking on freshly seeded studios with new slugs.
const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&h=1100&q=80';

const FALLBACK_GALLERY = [FALLBACK_HERO];

const FALLBACK_AMENITIES = ['Mats provided', 'Showers', 'Lockers'];

/**
 * Merge a backend `StudioSummary` with the mock cosmetic fields by slug.
 * Returns the prototype's expected `Studio` shape.
 */
export function enrichStudio(backend: StudioSummary | BackendStudioDetail): MockStudio {
  const m = mockStudioBySlug[backend.slug];
  return {
    id: backend.id,
    slug: backend.slug,
    name: backend.name,
    neighborhood: backend.neighborhood ?? m?.neighborhood ?? '',
    city: backend.city,
    address: backend.address,
    blurb: m?.blurb ?? `${backend.name} — Pilates in ${backend.city}.`,
    hero: m?.hero ?? FALLBACK_HERO,
    gallery: m?.gallery ?? FALLBACK_GALLERY,
    rating: m?.rating ?? 4.85,
    reviewCount: m?.reviewCount ?? 0,
    priceFrom: m?.priceFrom ?? 25,
    classTypes: m?.classTypes ?? ['Reformer', 'Mat'],
    loved: m?.loved ?? `Why people love ${backend.name}.`,
    amenities: m?.amenities ?? FALLBACK_AMENITIES,
    cancellationHours:
      'cancellationWindowMinutes' in backend && typeof backend.cancellationWindowMinutes === 'number'
        ? Math.round(backend.cancellationWindowMinutes / 60)
        : (m?.cancellationHours ?? 12),
  };
}

const TYPE_LABEL: Record<NonNullable<ClassSessionSummary['type']>, string> = {
  MAT: 'Mat',
  REFORMER: 'Reformer',
  CONTEMPORARY: 'Contemporary',
  CLINICAL: 'Clinical',
};

export function classTypeLabel(t: ClassSessionSummary['type']): string {
  return t ? TYPE_LABEL[t] : 'Class';
}

/**
 * Convert a backend `MoneyWire` object to a USD whole-dollar number for the
 * design's "price" displays. Backend stores integer minor units as a string;
 * the design assumes USD and shows whole dollars.
 */
export function priceUsd(money: { amount: string; currency: string }): number {
  const n = Number(BigInt(money.amount));
  if (money.currency === 'LBP') return Math.round(n / 100); // LBP has no minors but treat as USD-equivalent for display
  return Math.round(n / 100);
}

const RELATIVE_TIME = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function formatStartsAt(iso: string): { date: string; time: string; countdown: string } {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Beirut',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Beirut',
  }).format(d);

  // Countdown: simple human delta to "now". Negative for past.
  const diffMs = d.getTime() - Date.now();
  const diffH = Math.round(diffMs / 3_600_000);
  const diffD = Math.round(diffH / 24);
  const countdown =
    Math.abs(diffH) < 24
      ? RELATIVE_TIME.format(diffH, 'hour')
      : RELATIVE_TIME.format(diffD, 'day');

  return { date, time, countdown };
}

/**
 * Mock instructor lookup by ID — used by screens that want to render a
 * teacher card. The backend doesn't expose instructors yet on the storefront
 * surface (no public procedure), so we fall back to the prototype's mock
 * instructor list.
 */
export const mockInstructorList = mockInstructors;

/**
 * Convert backend `ClassSessionSummary` to the prototype's `ClassSession`
 * shape so existing components like `ClassRow` keep working unchanged.
 */
export function enrichSession(b: ClassSessionSummary): MockSession {
  const start = new Date(b.startsAt);
  const end = new Date(b.endsAt);
  const durationMin = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60_000));
  const dayLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Beirut',
  }).format(start);
  const timeLabel = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Beirut',
  }).format(start);
  // Backend doesn't carry "level" per-session (it lives on ClassTemplate);
  // until that's exposed, use a friendly default that matches the design.
  return {
    id: b.id,
    studioId: b.studioId,
    instructorId: 'live',
    type: classTypeLabel(b.type) as MockSession['type'],
    startsAt: `${dayLabel} · ${timeLabel}`,
    startIso: b.startsAt,
    durationMin,
    capacity: b.capacity,
    booked: b.bookedCount,
    priceUsd: priceUsd(b.price),
    level: 'All levels',
  };
}

/**
 * Convert a backend `InstructorSummary` to the prototype's `Instructor` shape
 * so the existing `InstructorBadge` component renders unchanged. Backend
 * doesn't carry rating / specialties / yearsTeaching yet, so those fall back
 * to sensible defaults (or merge from the prototype's mock by name when an
 * exact match exists).
 */
export function enrichInstructor(b: BackendInstructor): MockInstructor {
  const m = mockInstructors.find((mi) => mi.fullName === b.fullName);
  return {
    id: b.id,
    fullName: b.fullName,
    studioId: b.studioId,
    portrait:
      b.avatarUrl ??
      m?.portrait ??
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80',
    specialties: m?.specialties ?? ['Mat'],
    bio: b.bio || (m?.bio ?? ''),
    certifications: m?.certifications ?? [],
    yearsTeaching: m?.yearsTeaching ?? 0,
    rating: m?.rating ?? 4.85,
    reviewCount: m?.reviewCount ?? 0,
    languages: (b.languages.length > 0
      ? (b.languages.filter((l) => l === 'EN' || l === 'AR' || l === 'FR') as MockInstructor['languages'])
      : (m?.languages ?? ['EN'])),
  };
}

/**
 * Synthesise a `MockInstructor`-shaped object from a backend session's
 * `instructorName` so the prototype's `ClassRow` and `InstructorBadge`
 * components keep working without a real instructor query.
 */
export function instructorFromSession(b: ClassSessionSummary): MockInstructor {
  const name = b.instructorName ?? 'TBA';
  return {
    id: `live-${b.id}`,
    fullName: name,
    studioId: b.studioId,
    portrait:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80',
    specialties: b.type ? [classTypeLabel(b.type) as MockInstructor['specialties'][number]] : ['Mat'],
    bio: '',
    certifications: [],
    yearsTeaching: 0,
    rating: 4.85,
    reviewCount: 0,
    languages: ['EN'],
  };
}

/** Compute the next N days as Beirut-local "Today / Tomorrow / Thu 4" labels. */
export function nextDayLabels(n = 7): { iso: string; label: string }[] {
  const out: { iso: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    let label: string;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else
      label = new Intl.DateTimeFormat('en-GB', {
        weekday: 'short',
        day: 'numeric',
        timeZone: 'Asia/Beirut',
      }).format(d);
    out.push({ iso, label });
  }
  return out;
}

/**
 * Convert a backend `BookingSummary` to the prototype's `Booking` shape.
 */
export function enrichBooking(b: BookingSummary): {
  id: string;
  studioId: string;
  studioName: string;
  classId: string;
  instructorId: string;
  date: string;
  time: string;
  countdown: string;
  status: 'upcoming' | 'past';
  outcome?: 'completed' | 'no_show' | 'cancelled';
  price: string;
  rawStatus: BookingSummary['status'];
} {
  const fmt = formatStartsAt(b.startsAt);
  const isPast = new Date(b.startsAt).getTime() < Date.now();
  return {
    id: b.id,
    studioId: b.studioId,
    studioName: b.studioName,
    classId: b.classSessionId,
    instructorId: 'live',
    date: fmt.date,
    time: fmt.time,
    countdown: isPast ? '' : fmt.countdown,
    status: isPast ? 'past' : 'upcoming',
    outcome:
      b.status === 'CANCELLED'
        ? 'cancelled'
        : b.status === 'NO_SHOW'
          ? 'no_show'
          : b.status === 'CHECKED_IN'
            ? 'completed'
            : undefined,
    price: priceUsd(b.price).toString(),
    rawStatus: b.status,
  };
}
