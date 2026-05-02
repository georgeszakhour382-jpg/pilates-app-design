import type { SessionUser } from './api';

const ACCESS_KEY = 'pilates:access';
const REFRESH_KEY = 'pilates:refresh';
const USER_KEY = 'pilates:user';

export interface SavedSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: SessionUser;
}

// Lightweight client-side store. Browser-only by design (Vite SPA, no SSR).
// No httpOnly cookies — the design prototype is a public client app, the
// marketplace API enforces auth posture server-side.
export const authStore = {
  save(s: SavedSession): void {
    window.localStorage.setItem(ACCESS_KEY, s.accessToken);
    window.localStorage.setItem(REFRESH_KEY, s.refreshToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(s.user));
  },
  clear(): void {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
  accessToken(): string | null {
    return window.localStorage.getItem(ACCESS_KEY);
  },
  user(): SessionUser | null {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  },
};
