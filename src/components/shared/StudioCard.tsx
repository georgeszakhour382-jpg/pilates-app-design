import { Star } from 'lucide-react';
import type { Studio } from '../../data/mock';

export function StudioCard({
  studio,
  size = 'md',
  onClick,
}: {
  studio: Studio;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  const dims =
    size === 'sm' ? 'w-[230px] h-[300px]' : size === 'lg' ? 'w-full h-[420px]' : 'w-[280px] h-[360px]';
  return (
    <button
      onClick={onClick}
      className={['press-soft group relative flex-shrink-0 overflow-hidden rounded-[var(--radius-card)] text-start', dims].join(' ')}
      style={{ boxShadow: 'var(--shadow-soft)' }}
    >
      <img
        src={studio.hero}
        alt={studio.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            'linear-gradient(to top, rgba(31,27,22,0.7) 0%, rgba(31,27,22,0.3) 50%, rgba(31,27,22,0) 100%)',
        }}
      />
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-bone/95 px-2.5 py-1 text-[12px] font-medium text-ink num">
        <Star size={12} className="fill-ink stroke-ink" />
        {studio.rating.toFixed(2)}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-bone">
        <div className="label-eyebrow !text-bone/70">{studio.neighborhood} · {studio.city}</div>
        <h3 className="font-display mt-1 text-[24px] leading-tight">{studio.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[13px] text-bone/80">{studio.classTypes.slice(0, 2).join(' · ')}</span>
          <span className="num text-[13px] font-medium">from ${studio.priceFrom}</span>
        </div>
      </div>
    </button>
  );
}
