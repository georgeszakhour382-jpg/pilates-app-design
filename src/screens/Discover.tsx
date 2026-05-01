import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Chip } from '../components/ui/Chip';
import { StudioCard } from '../components/shared/StudioCard';
import { InstructorBadge } from '../components/shared/InstructorBadge';
import type { ClassType } from '../data/mock';
import type { ScreenId } from '../App';
import { BottomNav } from '../components/ui/BottomNav';
import { api, type InstructorSummary } from '../lib/api';
import { enrichInstructor, enrichStudio } from '../lib/displayAdapters';
import { useLocale, useT } from '../lib/i18n';

const categories: ClassType[] = ['Reformer', 'Mat', 'Pre/postnatal', 'Contemporary', 'Clinical'];

export function Discover({
  goto,
  setActiveStudioSlug,
}: {
  goto: (id: ScreenId) => void;
  setActiveStudioSlug?: (slug: string) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [cat, setCat] = useState<ClassType | 'All'>('All');

  const studiosQuery = useQuery({
    queryKey: ['studios.list'],
    queryFn: () => api.studios.list(),
  });

  // Fetch instructors per studio in parallel. With ~3 studios this is fine;
  // a dedicated `instructorsPublic.featured()` would be cleaner at scale.
  const studioIds = studiosQuery.data?.items.map((s) => s.id) ?? [];
  const instructorQueries = useQueries({
    queries: studioIds.map((id) => ({
      queryKey: ['instructors.list', id],
      queryFn: () => api.instructors.list(id),
      staleTime: 60_000,
    })),
  });
  const allInstructors: InstructorSummary[] = instructorQueries.flatMap(
    (q) => q.data ?? [],
  );

  // Real studios first, enriched with mock cosmetic fields. Filter is purely
  // visual — the backend doesn't expose `classTypes` on Studio yet, so the
  // chip applies to the mock-derived `classTypes` array.
  const studios = useMemo(() => {
    const items = studiosQuery.data?.items ?? [];
    const enriched = items.map(enrichStudio);
    if (cat === 'All') return enriched;
    return enriched.filter((s) => s.classTypes.includes(cat));
  }, [studiosQuery.data, cat]);

  const editorial = studios[0];

  const todayLocale = locale === 'ar' ? 'ar-LB' : locale === 'fr' ? 'fr-FR' : 'en-GB';
  const today = new Intl.DateTimeFormat(todayLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Beirut',
  }).format(new Date());

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-[160px] scrollbar-none">
        <header className="px-5 pt-14">
          <div className="label-eyebrow">{t.discover.eyebrow} · {today}</div>
          <h1 className="font-display mt-1 text-[30px] leading-[1.1]">
            {t.discover.headline.replace(t.discover.headlineEm, '⟦HE⟧').split('⟦HE⟧').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <em className="italic">{t.discover.headlineEm}</em>}
              </span>
            ))}
          </h1>
        </header>

        {/* Search */}
        <div className="mt-5 px-5">
          <button
            onClick={() => goto('search')}
            className="press-soft flex h-12 w-full items-center gap-3 rounded-full bg-sand px-4 text-start"
          >
            <Search size={18} className="text-ink-60" />
            <span className="text-[14px] text-ink-60">{t.discover.searchPlaceholder}</span>
            <span className="ml-auto rounded-full bg-bone p-1.5 text-ink">
              <SlidersHorizontal size={14} />
            </span>
          </button>
        </div>

        {/* Categories */}
        <div className="mt-7 px-5">
          <div className="label-eyebrow">{t.discover.practiceLabel}</div>
          <div className="mt-2 -mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none">
            <Chip selected={cat === 'All'} onClick={() => setCat('All')}>
              {t.discover.all}
            </Chip>
            {categories.map((c) => (
              <Chip key={c} selected={cat === c} onClick={() => setCat(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        {/* Near you */}
        <section className="mt-9">
          <div className="flex items-end justify-between px-5">
            <div>
              <div className="label-eyebrow">{t.discover.nearYou}</div>
              <h2 className="font-display mt-1 text-[22px]">{t.discover.nearYouTitle}</h2>
            </div>
            <button className="text-[12px] font-medium text-ink-60">{t.common.seeAll}</button>
          </div>
          <div className="mt-4 -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none">
            {studiosQuery.isLoading && (
              <p className="px-5 text-[13px] text-ink-60">{t.discover.loading}</p>
            )}
            {studiosQuery.error && (
              <p className="px-5 text-[13px] text-terracotta">{t.discover.apiUnreachable}</p>
            )}
            {studios.map((s) => (
              <StudioCard
                key={s.id}
                studio={s}
                size="md"
                onClick={() => {
                  setActiveStudioSlug?.(s.slug);
                  goto('studio');
                }}
              />
            ))}
            {!studiosQuery.isLoading && studios.length === 0 && (
              <p className="px-5 text-[13px] text-ink-60">{t.discover.noMatch}</p>
            )}
          </div>
        </section>

        {/* Top instructors — real, aggregated across studios. Rating /
            reviewCount come from the merged mock until backend exposes them. */}
        {allInstructors.length > 0 && (
          <section className="mt-9 px-5">
            <div className="label-eyebrow">{t.discover.instructorsEyebrow}</div>
            <h2 className="font-display mt-1 text-[22px]">{t.discover.instructorsTitle}</h2>
            <ul className="mt-4 space-y-4">
              {allInstructors.slice(0, 4).map((i) => {
                const enriched = enrichInstructor(i);
                return (
                  <li key={i.id} className="flex items-center justify-between">
                    <InstructorBadge
                      instructor={enriched}
                      onClick={() => goto('instructor')}
                    />
                    <span className="num text-[13px] font-medium text-ink-60">
                      {enriched.rating.toFixed(2)} · {enriched.reviewCount}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Editorial */}
        {editorial && (
          <section
            className="mt-12 mx-5 overflow-hidden rounded-[20px]"
            style={{ boxShadow: 'var(--shadow-soft)' }}
          >
            <div className="relative aspect-[4/5] w-full">
              <img
                src={editorial.hero}
                alt={editorial.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-2/3"
                style={{
                  background:
                    'linear-gradient(to top, rgba(31,27,22,0.75) 0%, transparent 60%)',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-5 text-bone">
                <div className="label-eyebrow !text-bone/70">{t.discover.editorialEyebrow}</div>
                <h3 className="font-display mt-1 text-[26px] leading-tight">{editorial.name}</h3>
                <p className="mt-2 text-[14px] leading-[1.55] text-bone/85">{editorial.loved}</p>
                <button
                  onClick={() => {
                    setActiveStudioSlug?.(editorial.slug);
                    goto('studio');
                  }}
                  className="press-soft mt-5 inline-flex h-10 items-center rounded-full bg-bone px-5 text-[13px] font-medium text-ink"
                >
                  {t.discover.readMore}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Editorial postscript in serif italic */}
        <p className="mt-5 px-5 text-center font-display italic text-[14px] text-ink-60">
          {t.discover.photoCredit}
        </p>
      </div>

      <BottomNav active="discover" onSelect={goto} />
    </div>
  );
}
