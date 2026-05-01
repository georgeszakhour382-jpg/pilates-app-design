import type { Instructor } from '../../data/mock';

export function InstructorBadge({
  instructor,
  size = 'md',
  onClick,
}: {
  instructor: Instructor;
  size?: 'sm' | 'md';
  onClick?: () => void;
}) {
  const ring = size === 'sm' ? 'h-10 w-10' : 'h-14 w-14';
  return (
    <button
      onClick={onClick}
      className="press-soft flex items-center gap-3 text-start"
    >
      <img
        src={instructor.portrait}
        alt={instructor.fullName}
        className={[ring, 'rounded-full object-cover ring-1 ring-stone'].join(' ')}
      />
      <div>
        <div className="text-[14px] font-medium leading-tight">{instructor.fullName}</div>
        <div className="text-[12px] text-ink-60">
          {instructor.specialties.join(' · ')}
        </div>
      </div>
    </button>
  );
}
