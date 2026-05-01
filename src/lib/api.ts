// Thin tRPC-over-fetch client. The marketplace API exposes its routers via
// tRPC's HTTP adapter at `/trpc/<procedure>`. We don't import the AppRouter
// type across repos (different pnpm workspace, different deps) — instead we
// declare just the response shapes we need locally.
//
// Auth: customerProcedure mutations require a Bearer token. After sign-in,
// we store the access token in localStorage and inject it on every call.

import { authStore } from './auth';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4040';

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
  const url = new URL(`${API_URL}/trpc/${name}`);
  if (input !== undefined) {
    url.searchParams.set('input', JSON.stringify(input));
  }
  const res = await fetch(url.toString(), { method: 'GET', headers: buildHeaders() });
  return unwrap<T>(res);
}

async function trpcMutation<T>(name: string, input?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}/trpc/${name}`, {
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
  },
};

export { ApiError };
