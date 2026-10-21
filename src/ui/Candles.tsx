// The row of candles at the top of a level: one lights per finished task.
export function CandleRow({ total, lit, label }: { total: number; lit: number; label: string }) {
  return (
    <div className="candle-row" role="img" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`mini-candle ${i < lit ? 'is-lit' : ''} ${i === total - 1 ? 'is-door' : ''}`} />
      ))}
    </div>
  );
}

/** The glass jar the sparks fly into; bumps when the count changes. */
export function SparkJar({ count, label, golden = false }: { count: number; label: string; golden?: boolean }) {
  return (
    <div className={`spark-jar ${golden ? 'is-golden' : ''}`} role="img" aria-label={label}>
      <svg viewBox="0 0 40 48" aria-hidden="true">
        <path d="M12 4h16v5l5 6v25a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V15l5-6z" fill="rgb(240 214 138 / 0.12)" stroke="#f0d68a" strokeOpacity=".7" strokeWidth="1.6" />
        <rect x="11" y="2" width="18" height="5" rx="1.5" fill="#c9a24a" />
        <circle cx="16" cy="34" r="2.2" fill="#ffd36b" />
        <circle cx="23" cy="30" r="1.8" fill="#ffb347" />
        <circle cx="25" cy="37" r="2.4" fill="#ffd36b" />
        <circle cx="19" cy="25" r="1.4" fill="#fff4c9" />
      </svg>
      <span key={count} className="spark-jar-count">
        {count}
      </span>
    </div>
  );
}
