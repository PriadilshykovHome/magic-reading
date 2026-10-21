import { m } from 'motion/react';
import './fx.css';

export interface Flight {
  id: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  golden: boolean;
  delay?: number;
}

/** Іскорки flying on a curve from the tap point into the jar; the jar counts each one on arrival. */
export function SparkFlights({ flights, onArrive }: { flights: Flight[]; onArrive: (id: number) => void }) {
  return (
    <div className="spark-flights" aria-hidden="true">
      {flights.map((f) => {
        const lift = Math.min(160, Math.abs(f.to.x - f.from.x) * 0.4 + 60);
        const midX = (f.from.x + f.to.x) / 2 + (f.to.x > f.from.x ? -30 : 30);
        const midY = Math.min(f.from.y, f.to.y) - lift;
        return (
          <m.span
            key={f.id}
            className={`spark-flight ${f.golden ? 'is-golden' : ''}`}
            initial={{ x: f.from.x, y: f.from.y, scale: 0.4, opacity: 0 }}
            animate={{
              x: [f.from.x, midX, f.to.x],
              y: [f.from.y, midY, f.to.y],
              scale: [0.4, f.golden ? 1.6 : 1.2, 0.5],
              opacity: [0, 1, 1],
            }}
            transition={{ duration: 0.8, delay: f.delay ?? 0, ease: [0.45, 0, 0.25, 1], times: [0, 0.45, 1] }}
            onAnimationComplete={() => onArrive(f.id)}
          />
        );
      })}
    </div>
  );
}
