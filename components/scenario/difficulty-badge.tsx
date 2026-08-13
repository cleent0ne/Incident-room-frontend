import type { Difficulty } from '@/lib/types';

const DOTS: Record<Difficulty, string> = {
  EASY: '●○○',
  MEDIUM: '●●○',
  HARD: '●●●',
};

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  EASY: 'bg-[#A3E635]/10 text-[#A3E635] border-[#A3E635]/30',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  HARD: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-semibold uppercase tracking-wider ${DIFFICULTY_STYLES[difficulty]}`}
    >
      <span>{difficulty}</span>
      <i className="not-italic text-[10px] tracking-tight opacity-90">{DOTS[difficulty]}</i>
    </span>
  );
}

