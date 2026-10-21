import { seededRandom } from '../random';
import './ambient.css';

type Star = { x: number; y: number; size: number; dur: number; delay: number };

function makeStars(count: number): Star[] {
  const rnd = seededRandom(20261021);
  return Array.from({ length: count }, () => ({
    x: rnd() * 100,
    y: rnd() * 78,
    size: 1 + rnd() * 1.6,
    dur: 3.5 + rnd() * 4,
    delay: -rnd() * 8,
  }));
}

const STARS = makeStars(42);

// Static night backdrop (gradient, moon, mist) plus the one "sky" motion: twinkling stars and
// an occasional shooting star.
export function NightSky({ moon = true }: { moon?: boolean }) {
  return (
    <div className="night-sky" aria-hidden="true">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      <span className="shooting-star" />
      {moon && (
        <div className="moon">
          <span className="moon-halo" />
          <svg viewBox="0 0 100 100">
            <defs>
              <mask id="moon-crescent">
                <rect width="100" height="100" fill="#fff" />
                <circle cx="66" cy="38" r="38" fill="#000" />
              </mask>
            </defs>
            <circle cx="50" cy="50" r="40" fill="#fff4d2" mask="url(#moon-crescent)" />
          </svg>
        </div>
      )}
      <span className="mist" />
    </div>
  );
}
