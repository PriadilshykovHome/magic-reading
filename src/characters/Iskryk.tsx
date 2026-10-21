import './characters.css';

// Placeholder stages until Phase 6 draws Іскрик: egg → hatchling → young dragon → big dragon.
const STAGES = ['🥚', '🐣', '🦎', '🐉'] as const;

export function Iskryk({ stage, className = '' }: { stage: number; className?: string }) {
  return (
    <div className={`iskryk iskryk-stage-${stage} ${className}`} aria-hidden="true">
      <span className="iskryk-glow" />
      <span className="iskryk-body">{STAGES[Math.min(Math.max(stage, 0), 3)]}</span>
    </div>
  );
}
