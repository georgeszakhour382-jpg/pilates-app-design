import { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { studios } from '../data/mock';
import type { ClassType } from '../data/mock';
import type { ScreenId } from '../App';
import { BottomNav } from '../components/ui/BottomNav';

const classTypes: ClassType[] = ['Reformer', 'Mat', 'Contemporary', 'Clinical', 'Pre/postnatal'];
const levels = ['Beginner', 'All levels', 'Intermediate', 'Advanced'];
const timeBuckets = ['Mornings', 'Midday', 'Evenings'];

export function Search({ goto }: { goto: (id: ScreenId) => void }) {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selTypes, setSelTypes] = useState<Set<ClassType>>(new Set(['Reformer']));
  const [distance, setDistance] = useState(15);
  const [price, setPrice] = useState<[number, number]>([15, 35]);
  const [level, setLevel] = useState('All levels');
  const [time, setTime] = useState<Set<string>>(new Set(['Mornings']));
  const [genderPref, setGenderPref] = useState<'any' | 'female' | 'male'>('any');

  const results = studios.filter((s) =>
    selTypes.size === 0 ? true : s.classTypes.some((c) => selTypes.has(c)),
  );

  const activeFilterCount =
    (selTypes.size > 0 ? 1 : 0) +
    (distance < 30 ? 1 : 0) +
    (level !== 'All levels' ? 1 : 0) +
    (time.size > 0 ? 1 : 0) +
    (genderPref !== 'any' ? 1 : 0);

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
                placeholder="Studio, instructor, neighborhood…"
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
            <Chip
              selected={activeFilterCount > 0}
              onClick={() => setFiltersOpen(true)}
            >
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
                    sel ? next.delete(c) : next.add(c);
                    setSelTypes(next);
                  }}
                >
                  {c}
                </Chip>
              );
            })}
          </div>
        </header>

        {/* Recents */}
        {!query && (
          <section className="mt-7 px-5">
            <div className="label-eyebrow">Recent</div>
            <ul className="mt-3 space-y-3">
              {['Achrafieh reformer', 'Yara Saad', 'pre/postnatal Beirut'].map((q) => (
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

        {/* Results */}
        <section className="mt-7 px-5">
          <div className="label-eyebrow">{results.length} studios</div>
          <ul className="mt-3 space-y-3">
            {results.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => goto('studio')}
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
          </ul>
        </section>
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
              onClick={() => {
                setSelTypes(new Set());
                setDistance(30);
                setPrice([15, 50]);
                setLevel('All levels');
                setTime(new Set());
                setGenderPref('any');
              }}
            >
              Reset
            </Button>
            <Button block size="md" onClick={() => setFiltersOpen(false)}>
              Show {results.length} results
            </Button>
          </div>
        }
      >
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
                    sel ? next.delete(c) : next.add(c);
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
                    sel ? next.delete(t) : next.add(t);
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
                {g === 'any' ? 'No preference' : g === 'female' ? 'Female instructors' : 'Male instructors'}
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
