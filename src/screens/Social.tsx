import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Share2,
  X,
} from 'lucide-react';
import type { ScreenId } from '../App';
import { BottomNav } from '../components/ui/BottomNav';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { useToast } from '../components/ui/Toast';
import { useT } from '../lib/i18n';
type TFunc = ReturnType<typeof useT>;
import { api, type PostWire, type PostCommentWire } from '../lib/api';

// Saves are persisted client-side until the backend models them — feed/likes/
// comments/posts go through the marketplace API.
const SAVES_KEY = 'pilates:social:saves';

interface UiAuthor {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  role: 'student' | 'instructor' | 'studio';
  studioName?: string;
  city: string | null;
}

interface UiComment {
  id: string;
  author: UiAuthor;
  body: string;
  createdAt: string;
}

interface UiPost {
  id: string;
  author: UiAuthor;
  media: { kind: 'image' | 'video'; url: string };
  caption: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  saved: boolean;
  commentCount: number;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&h=160&q=80';

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return new Date(iso).toLocaleDateString();
}

function adaptAuthor(a: PostWire['author']): UiAuthor {
  const handle = (a.fullName.split(' ')[0] ?? a.fullName)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return {
    id: a.id,
    name: a.fullName,
    handle: handle || 'member',
    avatar: DEFAULT_AVATAR,
    role: 'student',
    city: a.city,
  };
}

function adaptPost(p: PostWire, savedSet: Set<string>): UiPost {
  return {
    id: p.id,
    author: adaptAuthor(p.author),
    media: { kind: p.mediaKind === 'video' ? 'video' : 'image', url: p.mediaUrl },
    caption: p.caption,
    createdAt: relTime(p.createdAt),
    likes: p.likeCount,
    liked: p.liked,
    saved: savedSet.has(p.id),
    commentCount: p.commentCount,
  };
}

function adaptComment(c: PostCommentWire): UiComment {
  return {
    id: c.id,
    author: adaptAuthor(c.author),
    body: c.body,
    createdAt: relTime(c.createdAt),
  };
}

function readSaves(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SAVES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeSaves(s: Set<string>): void {
  window.localStorage.setItem(SAVES_KEY, JSON.stringify(Array.from(s)));
}

export function Social({
  goto,
  setActiveStudioSlug,
}: {
  goto: (id: ScreenId) => void;
  setActiveStudioSlug?: (slug: string | null) => void;
}) {
  const t = useT();
  const toast = useToast();

  const [posts, setPosts] = useState<UiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const savesRef = useRef<Set<string>>(readSaves());

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await api.posts.feed();
      setPosts(res.items.map((p) => adaptPost(p, savesRef.current)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = activeIndex;
        let bestRatio = 0;
        for (const e of entries) {
          if (e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio;
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) bestIdx = idx;
          }
        }
        setActiveIndex(bestIdx);
      },
      { root: el, threshold: [0.5, 0.75, 0.9] },
    );
    Array.from(el.querySelectorAll('[data-post]')).forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [posts.length, activeIndex]);

  const [tab, setTab] = useState<'community' | 'following'>('community');
  const visible = useMemo<UiPost[]>(() => {
    if (tab === 'community') return posts;
    return posts.filter((p) => p.author.role !== 'student');
  }, [posts, tab]);

  const [openComments, setOpenComments] = useState<UiPost | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openMenu, setOpenMenu] = useState<UiPost | null>(null);

  const toggleLike = useCallback(
    async (p: UiPost) => {
      // Optimistic
      setPosts((cur) =>
        cur.map((q) =>
          q.id === p.id
            ? { ...q, liked: !q.liked, likes: q.likes + (q.liked ? -1 : 1) }
            : q,
        ),
      );
      toast.show(p.liked ? t('social.unliked_toast') : t('social.liked_toast'));
      try {
        const res = await api.posts.toggleLike(p.id);
        setPosts((cur) =>
          cur.map((q) =>
            q.id === p.id ? { ...q, liked: res.liked, likes: res.likeCount } : q,
          ),
        );
      } catch {
        // Revert
        setPosts((cur) =>
          cur.map((q) =>
            q.id === p.id
              ? { ...q, liked: p.liked, likes: p.likes }
              : q,
          ),
        );
        toast.show('Could not save like', 'warn');
      }
    },
    [toast, t],
  );

  const toggleSave = useCallback(
    (p: UiPost) => {
      const next = !p.saved;
      const s = savesRef.current;
      if (next) s.add(p.id);
      else s.delete(p.id);
      writeSaves(s);
      setPosts((cur) => cur.map((q) => (q.id === p.id ? { ...q, saved: next } : q)));
      toast.show(p.saved ? t('social.unsaved_toast') : t('social.saved_toast'));
    },
    [toast, t],
  );

  const sharePost = useCallback(
    async (p: UiPost) => {
      const url = `${window.location.origin}/p/${p.id}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // ignore
      }
      toast.show(t('social.shared_toast'));
    },
    [toast, t],
  );

  const publishPost = useCallback(
    async (caption: string, imageUrl: string) => {
      const trimmed = caption.trim();
      if (!trimmed) return;
      try {
        const created = await api.posts.create({
          caption: trimmed,
          mediaUrl: imageUrl,
          mediaKind: 'image',
        });
        setPosts((cur) => [adaptPost(created, savesRef.current), ...cur]);
        setOpenCreate(false);
        toast.show(t('social.published_toast'));
      } catch (e) {
        toast.show(
          e instanceof Error && e.message ? e.message : 'Could not publish',
          'warn',
        );
      }
    },
    [toast, t],
  );

  return (
    <div className="fade-in relative h-full bg-ink">
      {/* Header chrome */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-12">
        <div className="flex items-center gap-1">
          {(['community', 'following'] as const).map((id) => {
            const sel = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={[
                  'press-soft rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                  sel ? 'bg-bone text-ink' : 'bg-ink/60 text-bone backdrop-blur-sm',
                ].join(' ')}
              >
                {id === 'community' ? t('social.feed') : t('social.following')}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setOpenCreate(true)}
          aria-label={t('social.add_post')}
          className="press-soft grid h-10 w-10 place-items-center rounded-full bg-bone text-ink"
        >
          <Plus size={18} strokeWidth={2.2} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="absolute inset-0 snap-y snap-mandatory overflow-y-scroll scrollbar-none"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {loading ? (
          <div className="grid h-full place-items-center text-bone/70 text-[13px]">
            Loading…
          </div>
        ) : error ? (
          <div className="grid h-full place-items-center px-8 text-center text-bone">
            <div>
              <p className="text-[14px] text-bone/80">{error}</p>
              <Button className="mt-4" onClick={() => void refresh()}>
                Retry
              </Button>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="grid h-full place-items-center px-8 text-center text-bone">
            <div>
              <p className="font-display text-[24px] leading-tight">{t('social.empty')}</p>
              <Button className="mt-6" onClick={() => setOpenCreate(true)}>
                {t('social.add_post')}
              </Button>
            </div>
          </div>
        ) : (
          visible.map((p, idx) => (
            <PostCard
              key={p.id}
              post={p}
              idx={idx}
              isActive={idx === activeIndex}
              onToggleLike={() => void toggleLike(p)}
              onToggleSave={() => toggleSave(p)}
              onShare={() => void sharePost(p)}
              onOpenComments={() => setOpenComments(p)}
              onOpenMenu={() => setOpenMenu(p)}
              onAuthorTap={() => {
                if (p.author.role === 'studio' && p.author.studioName) {
                  setActiveStudioSlug?.(
                    p.author.studioName.toLowerCase().replace(/[^a-z]+/g, '-'),
                  );
                  goto('studio');
                }
              }}
              t={t}
            />
          ))
        )}
      </div>

      <BottomNav active="social" onSelect={goto} />

      <Sheet
        open={!!openComments}
        title={t('social.comments_title')}
        onClose={() => setOpenComments(null)}
      >
        {openComments && (
          <CommentsContent
            postId={openComments.id}
            onCommentAdded={() => {
              setPosts((cur) =>
                cur.map((q) =>
                  q.id === openComments.id
                    ? { ...q, commentCount: q.commentCount + 1 }
                    : q,
                ),
              );
            }}
            t={t}
          />
        )}
      </Sheet>

      <Sheet
        open={openCreate}
        title={t('social.add_post_title')}
        onClose={() => setOpenCreate(false)}
      >
        <CreatePostContent
          onPublish={(c, u) => void publishPost(c, u)}
          onCancel={() => setOpenCreate(false)}
          t={t}
        />
      </Sheet>

      <Sheet open={!!openMenu} title=" " onClose={() => setOpenMenu(null)}>
        {openMenu && (
          <ul className="space-y-2">
            <MenuRow
              icon={<Share2 size={16} />}
              label={t('social.menu_share')}
              onClick={() => {
                void sharePost(openMenu);
                setOpenMenu(null);
              }}
            />
            <MenuRow
              icon={<Bookmark size={16} />}
              label={openMenu.saved ? t('social.menu_unsave') : t('social.menu_save')}
              onClick={() => {
                toggleSave(openMenu);
                setOpenMenu(null);
              }}
            />
            <MenuRow
              icon={<X size={16} />}
              label={t('social.menu_mute')}
              onClick={() => {
                toast.show(`Muted @${openMenu.author.handle}`, 'info');
                setOpenMenu(null);
              }}
            />
            <MenuRow
              icon={<MoreHorizontal size={16} />}
              label={t('social.menu_report')}
              onClick={() => {
                toast.show(t('social.reported_toast'), 'info');
                setOpenMenu(null);
              }}
            />
          </ul>
        )}
      </Sheet>
    </div>
  );
}

// =============================================================================
// PostCard — one full-bleed reel, snap-aligned to the viewport
// =============================================================================

function PostCard({
  post,
  idx,
  isActive,
  onToggleLike,
  onToggleSave,
  onShare,
  onOpenComments,
  onOpenMenu,
  onAuthorTap,
  t,
}: {
  post: UiPost;
  idx: number;
  isActive: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  onOpenComments: () => void;
  onOpenMenu: () => void;
  onAuthorTap: () => void;
  t: TFunc;
}) {
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null);
  const lastTap = useRef<number>(0);
  const onMediaTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const point =
        'changedTouches' in e
          ? (e as React.TouchEvent).changedTouches[0]
          : (e as React.MouseEvent);
      if (point) {
        setBurst({ x: point.clientX - rect.left, y: point.clientY - rect.top, key: now });
        if (!post.liked) onToggleLike();
        window.setTimeout(() => setBurst(null), 700);
      }
    }
    lastTap.current = now;
  };

  return (
    <article
      data-post
      data-idx={idx}
      className="relative h-full w-full snap-start"
      style={{ minHeight: '100%' }}
    >
      <img
        src={post.media.url}
        alt=""
        className={[
          'pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-700',
          isActive ? 'scale-100' : 'scale-[1.02]',
        ].join(' ')}
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{ background: 'linear-gradient(to bottom, rgba(31,27,22,0.45), transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            'linear-gradient(to top, rgba(31,27,22,0.85) 0%, rgba(31,27,22,0.4) 50%, transparent 100%)',
        }}
      />

      <button
        onClick={onMediaTap as unknown as React.MouseEventHandler<HTMLButtonElement>}
        className="absolute inset-x-0 top-0 block cursor-default bg-transparent"
        style={{ bottom: 88 }}
        aria-label={`Post by ${post.author.name}`}
      >
        {burst && (
          <span
            key={burst.key}
            aria-hidden
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: burst.x,
              top: burst.y,
              animation: 'heartBurst 0.7s ease-out forwards',
              color: '#C97B5B',
            }}
          >
            <Heart size={84} fill="currentColor" strokeWidth={0} />
          </span>
        )}
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end gap-3 p-5 pb-[110px]">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAuthorTap();
            }}
            className="press-soft pointer-events-auto flex items-center gap-2.5 text-start text-bone"
          >
            <img
              src={post.author.avatar}
              alt=""
              className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2 ring-bone/70"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[14px] font-medium">{post.author.name}</span>
                <RoleChip role={post.author.role} t={t} />
              </div>
              <div className="text-[12px] text-bone/80">
                @{post.author.handle} · {post.createdAt}
              </div>
            </div>
          </button>
          <p
            className="mt-3 max-w-[78%] font-display text-[16px] italic leading-snug text-bone"
            style={{ textWrap: 'balance' as CSSProperties['textWrap'] }}
          >
            {post.caption}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-[110px] right-3 z-10 flex flex-col items-center gap-5 text-bone">
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike();
          }}
          icon={
            <Heart
              size={26}
              fill={post.liked ? '#C97B5B' : 'transparent'}
              color={post.liked ? '#C97B5B' : 'currentColor'}
              strokeWidth={1.6}
            />
          }
          count={post.likes}
        />
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            onOpenComments();
          }}
          icon={<MessageCircle size={26} strokeWidth={1.6} />}
          count={post.commentCount}
        />
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          icon={
            <Bookmark
              size={26}
              fill={post.saved ? '#8A9A7B' : 'transparent'}
              color={post.saved ? '#8A9A7B' : 'currentColor'}
              strokeWidth={1.6}
            />
          }
        />
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          icon={<Send size={24} strokeWidth={1.6} />}
        />
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu();
          }}
          icon={<MoreHorizontal size={26} strokeWidth={1.6} />}
        />
      </div>
    </article>
  );
}

function ActionButton({
  onClick,
  icon,
  count,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="press-soft pointer-events-auto flex flex-col items-center gap-1 text-bone drop-shadow-md"
    >
      <span
        className="grid h-12 w-12 place-items-center rounded-full bg-ink/30 backdrop-blur-md"
        style={{ boxShadow: '0 4px 20px rgba(31,27,22,0.35)' }}
      >
        {icon}
      </span>
      {count !== undefined && (
        <span className="num text-[11px] font-medium tabular-nums">
          {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </button>
  );
}

function RoleChip({ role, t }: { role: UiAuthor['role']; t: TFunc }) {
  const palette: Record<UiAuthor['role'], string> = {
    student: 'bg-bone/85 text-ink',
    instructor: 'bg-clay text-bone',
    studio: 'bg-sage text-bone',
  };
  const label =
    role === 'student'
      ? t('social.author_role_student')
      : role === 'instructor'
        ? t('social.author_role_instructor')
        : t('social.author_role_studio');
  return (
    <span
      className={[
        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        palette[role],
      ].join(' ')}
    >
      {label}
    </span>
  );
}

// =============================================================================
// Comments sheet content — fetches comments live from the backend
// =============================================================================

function CommentsContent({
  postId,
  onCommentAdded,
  t,
}: {
  postId: string;
  onCommentAdded: () => void;
  t: TFunc;
}) {
  const [comments, setComments] = useState<UiComment[] | null>(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api.posts
      .comments({ postId })
      .then((res) => {
        if (!cancelled) setComments(res.items.map(adaptComment));
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const created = await api.posts.comment({ postId, body: trimmed });
      setComments((cur) => [...(cur ?? []), adaptComment(created)]);
      setBody('');
      onCommentAdded();
    } catch {
      // toast handled at parent if needed
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {comments === null ? (
        <p className="py-6 text-center text-[13px] text-ink-60">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-60">{t('social.no_comments')}</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3">
              <img
                src={c.author.avatar}
                alt=""
                className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium">{c.author.name}</span>
                  <span className="text-[11px] text-ink-60">{c.createdAt}</span>
                </div>
                <p className="mt-0.5 text-[14px] leading-snug text-ink">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={submit}
        className="mt-6 flex items-center gap-2 rounded-full bg-sand px-3 py-2"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('social.comment_placeholder')}
          className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-60"
        />
        <button
          type="submit"
          disabled={body.trim().length === 0 || submitting}
          className="press-soft grid h-9 w-9 place-items-center rounded-full bg-ink text-bone disabled:opacity-40"
          aria-label={t('social.send')}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// =============================================================================
// Create post sheet
// =============================================================================

const SAMPLE_GALLERY = [
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&h=1600&q=80',
  'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&h=1600&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&h=1600&q=80',
  'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=900&h=1600&q=80',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&h=1600&q=80',
  'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=900&h=1600&q=80',
];

function CreatePostContent({
  onPublish,
  onCancel,
  t,
}: {
  onPublish: (caption: string, imageUrl: string) => void;
  onCancel: () => void;
  t: TFunc;
}) {
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState(SAMPLE_GALLERY[0]!);

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink-60">{t('social.add_post_sub')}</p>

      <div>
        <div className="label-eyebrow mb-2">Cover image</div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 scrollbar-none">
          {SAMPLE_GALLERY.map((url) => {
            const sel = imageUrl === url;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setImageUrl(url)}
                className={[
                  'press-soft relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-xl',
                  sel ? 'ring-2 ring-ink' : '',
                ].join(' ')}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="label-eyebrow">{t('social.image_label')}</span>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          className="mt-2 h-11 w-full rounded-xl border border-stone bg-bone px-3 text-[14px] focus:border-ink focus:outline-none"
        />
        <span className="mt-1 block text-[12px] text-ink-60">{t('social.image_help')}</span>
      </label>

      <label className="block">
        <span className="label-eyebrow">{t('social.caption_label')}</span>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t('social.compose_placeholder')}
          rows={4}
          className="mt-2 w-full rounded-xl border border-stone bg-bone p-3 text-[15px] leading-snug focus:border-ink focus:outline-none"
        />
      </label>

      <div className="flex gap-3 pt-2">
        <Button variant="tertiary" size="md" onClick={onCancel}>
          {t('common.cancel') ?? 'Cancel'}
        </Button>
        <Button
          block
          size="md"
          disabled={caption.trim().length === 0}
          onClick={() => onPublish(caption, imageUrl)}
        >
          {t('social.post')}
        </Button>
      </div>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="press-soft flex w-full items-center gap-3 rounded-xl border border-stone bg-bone px-4 py-3 text-start"
      >
        <span className="text-ink-60">{icon}</span>
        <span className="text-[14.5px]">{label}</span>
      </button>
    </li>
  );
}
