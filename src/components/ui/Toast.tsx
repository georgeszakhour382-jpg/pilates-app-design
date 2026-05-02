import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Check, Info, AlertTriangle } from 'lucide-react';

type Tone = 'success' | 'info' | 'warn';

interface ToastEntry {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastApi {
  show: (message: string, tone?: Tone) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastEntry[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, tone: Tone = 'success') => {
    counter.current += 1;
    const id = counter.current;
    setItems((cur) => [...cur, { id, tone, message }]);
    window.setTimeout(() => {
      setItems((cur) => cur.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {/* Viewport — anchored to the bottom of the phone frame, above BottomNav. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[88px] z-50 flex flex-col items-center gap-2 px-5"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={[
              'pointer-events-auto fade-in flex max-w-md items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] font-medium',
              t.tone === 'success'
                ? 'bg-ink text-bone'
                : t.tone === 'warn'
                  ? 'bg-clay text-bone'
                  : 'bg-bone text-ink hairline-b',
            ].join(' ')}
            style={{ boxShadow: '0 10px 30px rgba(31,27,22,0.22)' }}
          >
            {t.tone === 'success' ? (
              <Check size={14} strokeWidth={2} />
            ) : t.tone === 'warn' ? (
              <AlertTriangle size={14} />
            ) : (
              <Info size={14} />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(ToastCtx);
  if (!v) {
    // Soft-fail: a missing provider should never crash a screen. Return a
    // no-op instead so the call site can stay simple.
    return { show: () => {} };
  }
  return v;
}
