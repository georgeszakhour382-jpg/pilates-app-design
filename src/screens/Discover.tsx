import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Chip } from '../components/ui/Chip';
import { StudioCard } from '../components/shared/StudioCard';
import { InstructorBadge } from '../components/shared/InstructorBadge';
import { instructors, studios } from '../data/mock';
import type { ClassType } from '../data/mock';
import type { ScreenId } from '../App';
import { BottomNav } from '../components/ui/BottomNav';

const categories: ClassType[] = ['Reformer', 'Mat', 'Pre/postnatal', 'Contemporary', 'Clinical'];

export function Discover({ goto }: { goto: (id: ScreenId) => void }) {
  const [cat, setCat] = useState<ClassType | 'All'>('All');
  const editorial = studios[0]!;
  return (
    <div className="fade-in relative h-full bg-bone">
      <div className="absolute inset-0 overflow-y-auto pb-[160px] scrollbar-none">
        <header className="px-5 pt-14">
          <div className="label-eyebrow">Beirut · Tuesday, May 1</div>
          <h1 className="font-display mt-1 text-[30px] leading-[1.1]">
            Find your <em className="italic">next</em> class.
          </h1>
        </header>

        {/* Search */}
        <div className="mt-5 px-5">
          <button
            onClick={() => goto('search')}
            className="press-soft flex h-12 w-full items-center gap-3 rounded-full bg-sand px-4 text-start"
          >
            <Search size={18} className="text-ink-60" />
            <span className="text-[14px] text-ink-60">Studio, neighborhood, instructor…</span>
            <span className="ml-auto rounded-full bg-bone p-1.5 text-ink">
              <SlidersHorizontal size={14} />
            </span>
          </button>
        </div>

        {/* Categories */}
        <div className="mt-7 px-5">
          <div className="label-eyebrow">Practice</div>
          <div className="mt-2 -mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none">
            <Chip selected={cat === 'All'} onClick={() => setCat('All')}>
              All
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
              <div className="label-eyebrow">Near you</div>
              <h2 className="font-display mt-1 text-[22px]">Studios within 15 min</h2>
            </div>
            <button className="text-[12px] font-medium text-ink-60">See all</button>
          </div>
          <div className="mt-4 -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none">
            {studios.map((s) => (
              <StudioCard
                key={s.id}
                studio={s}
                size="md"
                onClick={() => goto('studio')}
              />
            ))}
          </div>
        </section>

        {/* Top instructors */}
        <section className="mt-9 px-5">
          <div className="label-eyebrow">This week</div>
          <h2 className="font-display mt-1 text-[22px]">Teachers our regulars rebook</h2>
          <ul className="mt-4 space-y-4">
            {instructors.slice(0, 4).map((i) => (
              <li key={i.id} className="flex items-center justify-between">
                <InstructorBadge instructor={i} onClick={() => goto('instructor')} />
                <span className="num text-[13px] font-medium text-ink-60">
                  {i.rating.toFixed(2)} · {i.reviewCount}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Editorial */}
        <section className="mt-12 mx-5 overflow-hidden rounded-[20px]" style={{ boxShadow: 'var(--shadow-soft)' }}>
          <div className="relative aspect-[4/5] w-full">
            <img src={editorial.hero} alt={editorial.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-2/3" style={{ background: 'linear-gradient(to top, rgba(31,27,22,0.75) 0%, transparent 60%)' }} />
            <div className="absolute inset-x-0 bottom-0 p-5 text-bone">
              <div className="label-eyebrow !text-bone/70">Why we love it</div>
              <h3 className="font-display mt-1 text-[26px] leading-tight">{editorial.name}</h3>
              <p className="mt-2 text-[14px] leading-[1.55] text-bone/85">{editorial.loved}</p>
              <button
                onClick={() => goto('studio')}
                className="press-soft mt-5 inline-flex h-10 items-center rounded-full bg-bone px-5 text-[13px] font-medium text-ink"
              >
                Read more
              </button>
            </div>
          </div>
        </section>

        {/* Editorial postscript in serif italic */}
        <p className="mt-5 px-5 text-center font-display italic text-[14px] text-ink-60">
          Photography by Lara Baladi
        </p>
      </div>

      <BottomNav active="discover" onSelect={goto} />
    </div>
  );
}
