import type { Difficulty } from '@/lib/types';

const DOTS: Record<Difficulty, string> = {
  EASY: '●○○',
  MEDIUM: '●●○',
  HARD: '●●●',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className="badge">
      {difficulty} <i>{DOTS[difficulty]}</i>
    </span>
  );
}
