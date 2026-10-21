import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * A button that only fires after being held (a ring fills up), so accidental taps by small
 * hands don't exit a level.
 */
export function HoldButton({
  holdMs,
  onHold,
  label,
  children,
  className = '',
}: {
  holdMs: number;
  onHold: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const cancel = () => {
    window.clearTimeout(timer.current);
    setHolding(false);
  };
  const start = () => {
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      onHold();
    }, holdMs);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      aria-label={label}
      className={`icon-button hold-button ${holding ? 'is-holding' : ''} ${className}`}
      style={{ '--hold-ms': `${holdMs}ms` } as CSSProperties}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => e.key === 'Enter' && onHold()}
    >
      <svg className="hold-ring" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" />
      </svg>
      {children}
    </button>
  );
}
