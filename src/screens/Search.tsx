import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Map as MapIcon, List as ListIcon, Search as SearchIcon, X } from 'lucide-react';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { MultiStudioMap, type MapStudio } from '../components/shared/MultiStudioMap';
import type { ClassType } from '../data/mock';
import type { ScreenId } from '../App';
import { BottomNav } from '../components/ui/BottomNav';
import { api } from '../lib/api';
import { enrichStudio, studioCoords } from '../lib/displayAdapters';

const classTypes: ClassType[] = ['Reformer', 'Mat', 'Contemporary', 'Clinical', 'Pre/postnatal'];
const levels = ['Beginner', 'All levels', 'Intermediate', 'Advanced'];
const timeBuckets = ['Mornings', 'Midday', 'Evenings'];

const RECENT_SEARCHES = ['Achrafieh reformer', 'Mar Mikhael', 'Pilates Beirut'];

export function Search({
  goto,
  setActiveStudioSlug,
  openFiltersOnMount = false,
  clearFiltersOpenOnMount,
}: {
  goto: (id: ScreenId) => void;
  setActiveStudioSlug?: (slug: string | null) => void;
  openFiltersOnMount?: boolean;
  clearFiltersOpenOnMount?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filtersOpen, setFiltersOpen] = useState(openFiltersOnMount);

  // Consume the cross-screen "open filters" handoff so a subsequent visit
  // to Search (without re-clicking the filter icon) starts in list mode.
  useEffect(() => {
    if (openFiltersOnMount) clearFiltersOpenOnMount?.();
  }, [openFiltersOnMount, clearFiltersOpenOnMount]);
  const [selTypes, setSelTypes] = useState<Set<ClassType>>(new Set());
  const [distance, setDistance] = useState(30);
  const [price, setPrice] = useState<[number, number]>([15, 50]);
  const [level, setLevel] = useState('All levels');
  const [time, setTime] = useState<Set<string>>(new Set());
  const [genderPref, setGenderPref] = useState<'any' | 'female' | 'male'>('any');

  // Debounce the query — backend hit on each keystroke would be wasteful and
  // makes the input feel laggy.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const studiosQuery = useQuery({
    queryKey: ['studios.list', debouncedQuery],
    queryFn: () =>
      api.studios.list(debouncedQuery.length > 0 ? { q: debouncedQuery } : {}),
  });

  // Backend `studios.list` filters by name + address. Class-type / price
  // filters are applied client-side using the merged mock cosmetic fields,
  // until the backend exposes those columns on Studio.
  const results = useMemo(() => {
    const items = (studiosQuery.data?.items ?? []).map(enrichStudio);
    const byClassType =
      selTypes.size === 0
        ? items
        : items.filter((s) => s.classTypes.some((c) => selTypes.has(c)));
    const byPrice = byClassType.filter(
      (s) => s.priceFrom >= price[0] && s.priceFrom <= price[1],
    );
    return byPrice;
  }, [studiosQuery.data, selTypes, price]);

  // Studios projected to the map's expected shape — only the ones for which
  // we have coords (real or fallback by slug).
  const mapStudios: MapStudio[] = useMemo(() => {
    const items = studiosQuery.data?.items ?? [];
    const out: MapStudio[] = [];
    for (let i = 0; i < results.length; i += 1) {
      const s = results[i]!;
      const backend = items[i];
      if (!backend) continue;
      const coords = studioCoords(backend);
      if (!coords) continue;
      out.push({
        id: s.id,
        slug: s.slug,
        name: s.name,
        neighborhood: s.neighborhood,
        city: s.city,
        rating: s.rating,
        priceFrom: s.priceFrom,
        hero: s.hero,
        lat: coords.lat,
        lng: coords.lng,
      });
    }
    return out;
  }, [results, studiosQuery.data]);

  const activeFilterCount =
    (selTypes.size > 0 ? 1 : 0) +
    (distance < 30 ? 1 : 0) +
    (level !== 'All levels' ? 1 : 0) +
    (time.size > 0 ? 1 : 0) +
    (genderPref !== 'any' ? 1 : 0) +
    (price[0] !== 15 || price[1] !== 50 ? 1 : 0);

  const resetAllFilters = (): void => {
    setSelTypes(new Set());
    setDistance(30);
    setPrice([15, 50]);
    setLevel('All levels');
    setTime(new Set());
    setGenderPref('any');
  };

  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-[160px] scrollbar-none">
        <header className="px-5 pt-12">
          <div className="flex items-center gap-2">
            <div className="flex h-12 flex-1 items-center gap-3 rounded-full bg-sand px-4">
              <SearchIcon size={18} className="text-ink-60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Studio, address, neighborhood…"
                className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-60"
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery('')} aria-label="Clear" className="text-ink-60">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => goto('discover')}
              className="press-soft text-[13px] font-medium text-ink-60"
            >
              Cancel
            </button>
          </div>

          <div className="mt-5 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none">
            <Chip selected={activeFilterCount > 0} onClick={() => setFiltersOpen(true)}>
              Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
            </Chip>
            {classTypes.map((c) => {
              const sel = selTypes.has(c);
              return (
                <Chip
                  key={c}
                  selected={sel}
                  onClick={() => {
                    const next = new Set(selTypes);
                    if (sel) next.delete(c);
                    else next.add(c);
                    setSelTypes(next);
                  }}
                >
                  {c}
                </Chip>
              );
            })}
          </div>

          {/* List / Map view toggle */}
          <div
            role="tablist"
            aria-label="View mode"
            className="mt-3 inline-flex rounded-full bg-sand p-1"
          >
            {(
              [
                { id: 'list' as const, label: 'List', icon: ListIcon },
                { id: 'map' as const, label: 'Map', icon: MapIcon },
              ]
            ).map((v) => {
              const Icon = v.icon;
              const sel = view === v.id;
              return (
                <button
                  key={v.id}
                  role="tab"
                  aria-selected={sel}
                  onClick={() => setView(v.id)}
                  className={[
                    'press-soft inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
                    sel ? 'bg-ink text-bone' : 'text-ink-60',
                  ].join(' ')}
                >
                  <Icon size={13} />
                  {v.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Map view — shows all current results pinned. */}
        {view === 'map' && (
          <section className="mt-5 px-5">
            <div className="label-eyebrow">{mapStudios.length} on the map</div>
            <MultiStudioMap
              studios={mapStudios}
              onSelect={(s) => {
                setActiveStudioSlug?.(s.slug);
                goto('studio');
              }}
              className="mt-3 h-[440px]"
            />
            {!studiosQuery.isLoading && mapStudios.length === 0 && (
              <p className="mt-3 text-[13px] text-ink-60">
                No studios with coordinates match these filters.
              </p>
            )}
          </section>
        )}

        {/* Recents — shown when input is empty AND list view */}
        {view === 'list' && !query && (
          <section className="mt-7 px-5">
            <div className="label-eyebrow">Suggested</div>
            <ul className="mt-3 space-y-3">
              {RECENT_SEARCHES.map((q) => (
                <li key={q}>
                  <button
                    onClick={() => setQuery(q)}
                    className="press-soft flex w-full items-center justify-between rounded-xl bg-bone px-3 py-2 text-start hairline-b"
                  >
                    <span className="flex items-center gap-3 text-[14px]">
                      <SearchIcon size={14} className="text-ink-60" />
                      {q}
                    </span>
                    <X size={14} className="text-ink-60" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Results — list view */}
        {view === 'list' && (
        <section className="mt-7 px-5">
          {studiosQuery.isLoading && (
            <p className="text-[13px] text-ink-60">Searching…</p>
          )}
          {studiosQuery.error && (
            <p className="text-[13px] text-terracotta">Could not search studios.</p>
          )}
          {!studiosQuery.isLoading && (
            <div className="label-eyebrow">{results.length} studios</div>
          )}
          <ul className="mt-3 space-y-3">
            {results.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setActiveStudioSlug?.(s.slug);
                    goto('studio');
                  }}
                  className="press-soft flex w-full items-center gap-3 rounded-2xl bg-bone p-3 text-start"
                  style={{ boxShadow: 'var(--shadow-soft)' }}
                >
                  <img
                    src={s.hero}
                    alt={s.name}
                    className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <div className="text-[15px] font-medium leading-tight">{s.name}</div>
                    <div className="mt-0.5 text-[12px] text-ink-60">
                      {s.neighborhood} · {s.classTypes.slice(0, 2).join(', ')}
                    </div>
                    <div className="mt-2 flex items-center gap-3 num text-[12px] text-ink-60">
                      <span className="font-medium text-ink">{s.rating.toFixed(2)}</span>
                      <span>· {s.reviewCount} reviews</span>
                      <span>· from ${s.priceFrom}</span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {!studiosQuery.isLoading && results.length === 0 && query && (
              <li className="text-[13px] text-ink-60">No studios match.</li>
            )}
          </ul>
        </section>
        )}
      </div>

      <Sheet
        open={filtersOpen}
        title="Filters"
        onClose={() => setFiltersOpen(false)}
        footer={
          <div className="flex gap-3">
            <Button
              variant="tertiary"
              size="md"
              onClick={resetAllFilters}
            >
              Reset
            </Button>
            <Button block size="md" onClick={() => setFiltersOpen(false)}>
              Show {results.length} results
            </Button>
          </div>
        }
      >
        {/* Always-visible Reset row at the top of the sheet so users don't
            have to scroll all the way down to find it. Becomes active only
            when at least one filter has been applied. */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] text-ink-60">
            {activeFilterCount === 0
              ? 'No filters applied'
              : `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} active`}
          </span>
          <button
            type="button"
            onClick={resetAllFilters}
            disabled={activeFilterCount === 0}
            className="press-soft text-[13px] font-medium text-clay underline underline-offset-4 disabled:cursor-not-allowed disabled:text-ink-60 disabled:no-underline"
          >
            Reset all
          </button>
        </div>
        <FilterGroup label="Distance">
          <input
            type="range"
            min={1}
            max={30}
            value={distance}
            onChange={(e) => setDistance(parseInt(e.target.value))}
            className="w-full accent-[color:var(--color-ink)]"
          />
          <div className="mt-1 flex justify-between text-[12px] text-ink-60 num">
            <span>1 min</span>
            <span className="font-medium text-ink">Within {distance} min</span>
            <span>30+ min</span>
          </div>
        </FilterGroup>

        <FilterGroup label="Class type">
          <div className="flex flex-wrap gap-2">
            {classTypes.map((c) => {
              const sel = selTypes.has(c);
              return (
                <Chip
                  key={c}
                  selected={sel}
                  onClick={() => {
                    const next = new Set(selTypes);
                    if (sel) next.delete(c);
                    else next.add(c);
                    setSelTypes(next);
                  }}
                >
                  {c}
                </Chip>
              );
            })}
          </div>
        </FilterGroup>

        <FilterGroup label="Level">
          <div className="flex flex-wrap gap-2">
            {levels.map((l) => (
              <Chip key={l} selected={level === l} onClick={() => setLevel(l)}>
                {l}
              </Chip>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Price (USD)">
          <div className="flex items-center justify-between text-[14px]">
            <span className="num">${price[0]}</span>
            <span className="text-ink-60">to</span>
            <span className="num">${price[1]}</span>
          </div>
          <input
            type="range"
            min={10}
            max={50}
            value={price[1]}
            onChange={(e) => setPrice([price[0], parseInt(e.target.value)])}
            className="mt-2 w-full accent-[color:var(--color-ink)]"
          />
        </FilterGroup>

        <FilterGroup label="Time of day">
          <div className="flex gap-2">
            {timeBuckets.map((t) => {
              const sel = time.has(t);
              return (
                <Chip
                  key={t}
                  selected={sel}
                  onClick={() => {
                    const next = new Set(time);
                    if (sel) next.delete(t);
                    else next.add(t);
                    setTime(next);
                  }}
                >
                  {t}
                </Chip>
              );
            })}
          </div>
        </FilterGroup>

        <FilterGroup label="Instructor preference">
          <p className="mb-3 text-[12px] text-ink-60">
            Some clients prefer female-only or male-only classes for personal or religious reasons.
          </p>
          <div className="flex gap-2">
            {(['any', 'female', 'male'] as const).map((g) => (
              <Chip key={g} selected={genderPref === g} onClick={() => setGenderPref(g)}>
                {g === 'any'
                  ? 'No preference'
                  : g === 'female'
                    ? 'Female instructors'
                    : 'Male instructors'}
              </Chip>
            ))}
          </div>
        </FilterGroup>

        <div className="h-2" />
      </Sheet>

      <BottomNav active="search" onSelect={goto} />
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-stone/70 py-5 first:pt-2 last:border-b-0">
      <div className="label-eyebrow mb-3">{label}</div>
      {children}
    </div>
  );
}
