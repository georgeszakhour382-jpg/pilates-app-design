// Thin tRPC-over-fetch client. The marketplace API exposes its routers via
// tRPC's HTTP adapter at `/trpc/<procedure>`. We don't import the AppRouter
// type across repos (different pnpm workspace, different deps) — instead we
// declare just the response shapes we need locally.
//
// Auth: customerProcedure mutations require a Bearer token. After sign-in,
// we store the access token in localStorage and inject it on every call.

import { authStore } from './auth';

// Default to the same-origin Vite proxy (`/api/trpc/*` → `localhost:4040/trpc`).
// Override with VITE_API_URL=http://localhost:4040 to bypass the proxy and hit
// the backend directly (useful when running the API on a different host).
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const TRPC_PATH = API_URL ? '/trpc' : '/api/trpc';

class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildHeaders(): Record<string, string> {
  const token = authStore.accessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const code = body.error?.data?.code as string | undefined;
    const msg = (body.error?.message as string | undefined) ?? `HTTP ${res.status}`;
    throw new ApiError(msg, code, res.status);
  }
  return body.result?.data as T;
}

async function trpcQuery<T>(name: string, input?: unknown): Promise<T> {
  // `new URL` requires an absolute URL — use the current origin as base when
  // we're going same-origin (proxy mode).
  const base = API_URL || window.location.origin;
  const url = new URL(`${TRPC_PATH}/${name}`, base);
  if (input !== undefined) {
    url.searchParams.set('input', JSON.stringify(input));
  }
  const res = await fetch(url.toString(), { method: 'GET', headers: buildHeaders() });
  return unwrap<T>(res);
}

async function trpcMutation<T>(name: string, input?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${TRPC_PATH}/${name}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(input ?? {}),
  });
  return unwrap<T>(res);
}

// ──────────────────────────────────────────────────────────────────────────
// Type-safe wrappers per backend procedure. Mirrors the Zod schemas in the
// marketplace's `@pilates/schemas` package — keep these in sync if the
// backend shape changes (the design app and the marketplace are decoupled
// repos by design).
// ──────────────────────────────────────────────────────────────────────────

export interface StudioSummary {
  id: string;
  slug: string;
  name: string;
  city: string;
  neighborhood: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface StudioDetail extends StudioSummary {
  cancellationWindowMinutes: number;
}

export interface InstructorSummary {
  id: string;
  studioId: string;
  fullName: string;
  bio: string;
  avatarUrl: string | null;
  languages: string[];
}

export interface MoneyWire {
  amount: string; // integer minor units as string
  currency: 'USD' | 'LBP' | 'EUR';
}

export type ClassType = 'MAT' | 'REFORMER' | 'CONTEMPORARY' | 'CLINICAL';

export type ClassSessionStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

export interface ClassSessionSummary {
  id: string;
  studioId: string;
  studioName: string;
  startsAt: string;
  endsAt: string;
  status: ClassSessionStatus;
  capacity: number;
  bookedCount: number;
  waitlistCap: number;
  waitlistCount: number;
  price: MoneyWire;
  className: string | null;
  type: ClassType | null;
  instructorName: string | null;
}

export type BookingStatus =
  | 'REQUESTED'
  | 'WAITLISTED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'NO_SHOW'
  | 'CANCELLED'
  | 'REFUNDED';

export interface BookingSummary {
  id: string;
  status: BookingStatus;
  classSessionId: string;
  studioId: string;
  studioName: string;
  startsAt: string;
  endsAt: string;
  price: MoneyWire;
  waitlistPosition: number | null;
}

export interface SessionUser {
  id: string;
  role: 'CUSTOMER' | 'INSTRUCTOR' | 'STUDIO_MANAGER' | 'STUDIO_OWNER' | 'ADMIN';
  phone: string;
  fullName: string;
  studioId: string | null;
}

export interface SignInResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: SessionUser;
}

export interface CreateBookingResult {
  kind: 'CONFIRMED' | 'WAITLISTED';
  bookingId: string;
  classSessionId: string;
  price?: MoneyWire;
  position?: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Staff-facing types (instructor / manager / owner).
// ──────────────────────────────────────────────────────────────────────────

export interface ClassTemplateSummary {
  id: string;
  studioId: string;
  name: string;
  type: ClassType;
  durationMinutes: number;
  defaultCapacity: number;
  defaultWaitlistCap: number;
  rrule: string | null;
  price: MoneyWire;
  cancellationWindowMinutes: number | null;
  introClass: boolean;
}

export interface RosterEntry {
  bookingId: string;
  customerId: string;
  customerFullName: string;
  customerPhone: string;
  status: BookingStatus;
  waitlistPosition: number | null;
  checkedInAt: string | null;
  cancelledAt: string | null;
  price: MoneyWire;
  paidVia: 'ONLINE' | 'CASH_AT_STUDIO' | 'PACKAGE_CREDIT' | 'UNPAID';
}

export interface StudioSessionRow extends ClassSessionSummary {
  classTemplateId: string | null;
  instructorId: string | null;
}

export interface ReportsSummary {
  range: 'TODAY' | 'WEEK' | 'MONTH';
  windowStart: string;
  windowEnd: string;
  bookings: {
    confirmed: number;
    cancelled: number;
    checkedIn: number;
    noShow: number;
    fillRatePct: number;
  };
  revenue: {
    online: MoneyWire;
    cash: MoneyWire;
    refunded: MoneyWire;
    net: MoneyWire;
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Procedures grouped by router for ergonomic call sites.
// ──────────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    sendOtp: (phone: string) =>
      trpcMutation<{ resendAvailableAt: string }>('auth.sendOtp', { phone }),
    verifyOtp: (phone: string, code: string) =>
      trpcMutation<SignInResponse>('auth.verifyOtp', { phone, code }),
    me: () => trpcQuery<SessionUser>('auth.me'),
    signOut: () => trpcMutation<{ ok: true }>('auth.signOut'),
  },
  studios: {
    list: (input: { q?: string; city?: string; limit?: number } = {}) =>
      trpcQuery<{ items: StudioSummary[]; nextCursor: string | null }>('studios.list', {
        limit: 24,
        ...input,
      }),
    getBySlug: (slug: string) => trpcQuery<StudioDetail>('studios.getBySlug', { slug }),
    cities: () => trpcQuery<string[]>('studiosPublic.cities'),
  },
  instructors: {
    list: (studioId: string) =>
      trpcQuery<InstructorSummary[]>('instructors.list', { studioId }),
  },
  classes: {
    list: (input: { studioId?: string; from: string; to: string; type?: ClassType }) =>
      trpcQuery<ClassSessionSummary[]>('classes.list', input),
    get: (id: string) => trpcQuery<ClassSessionSummary>('classes.get', { id }),
  },
  bookings: {
    create: (classSessionId: string, idempotencyKey: string) =>
      trpcMutation<CreateBookingResult>('bookings.create', { classSessionId, idempotencyKey }),
    listMine: (scope: 'UPCOMING' | 'PAST' = 'UPCOMING') =>
      trpcQuery<{ items: BookingSummary[]; nextCursor: string | null }>('bookings.listMine', {
        scope,
        limit: 20,
      }),
    cancel: (bookingId: string) =>
      trpcMutation<BookingSummary>('bookings.cancel', { bookingId }),
    // Staff-only — JWT must be a STUDIO_OWNER / MANAGER / INSTRUCTOR.
    studioRoster: (classSessionId: string) =>
      trpcQuery<RosterEntry[]>('bookings.studioRoster', { classSessionId }),
    checkIn: (bookingId: string) =>
      trpcMutation<{ id: string; status: string }>('bookings.checkIn', { bookingId }),
    markNoShow: (bookingId: string) =>
      trpcMutation<{ id: string; status: string }>('bookings.markNoShow', { bookingId }),
    studioWalkin: (input: {
      classSessionId: string;
      fullName: string;
      phone: string;
      cashCollected?: boolean;
    }) => trpcMutation<{ kind: string; bookingId: string }>('bookings.studioWalkin', input),
  },

  // ────────────────────────────────────────────────────────────────────────
  // Staff-side. Every procedure here requires a STUDIO_OWNER / MANAGER /
  // INSTRUCTOR JWT. Sign in with a staff phone (the seed plants
  // +96170100001 / +96170100002 / +96170100003) to exercise these. The
  // OTP magic code in LOCAL_DEV mode is 123456.
  // ────────────────────────────────────────────────────────────────────────
  staff: {
    classes: {
      // Backend's `classes.studioList` takes a `from`/`to` ISO window plus
      // an `includeCancelled` flag. The week-strip in EditSchedule passes
      // a 7-day window centered on today.
      studioList: (input: { from: string; to: string; includeCancelled?: boolean }) =>
        trpcQuery<StudioSessionRow[]>('classes.studioList', {
          includeCancelled: true,
          ...input,
        }),
      studioCreate: (input: {
        classTemplateId?: string;
        instructorId?: string;
        startsAt: string;
        endsAt: string;
        capacity: number;
        waitlistCap?: number;
        price: MoneyWire;
      }) => trpcMutation<StudioSessionRow>('classes.studioCreate', input),
      studioUpdate: (input: {
        id: string;
        instructorId?: string | null;
        startsAt?: string;
        endsAt?: string;
        capacity?: number;
        waitlistCap?: number;
        price?: MoneyWire;
      }) => trpcMutation<StudioSessionRow>('classes.studioUpdate', input),
      studioCancel: (input: { id: string; reason: string }) =>
        trpcMutation<{ id: string; status: ClassSessionStatus }>('classes.studioCancel', input),
    },
    classTemplates: {
      list: () => trpcQuery<ClassTemplateSummary[]>('class-templates.list'),
    },
    reports: {
      summary: (range: 'TODAY' | 'WEEK' | 'MONTH') =>
        trpcQuery<ReportsSummary>('reports.summary', { range }),
    },
  },
};

export { ApiError };
