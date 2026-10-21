import { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;
const COLOR = '255,156,72';

type Ember = {
  x: number;
  y: number;
  size: number;
  rise: number;
  sway: number;
  freq: number;
  phase: number;
  life: number;
  maxLife: number;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// One soft round glow, drawn once and stamped for every ember.
function makeSprite(): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const c = sprite.getContext('2d')!;
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, `rgba(${COLOR},1)`);
  g.addColorStop(0.2, `rgba(${COLOR},0.6)`);
  g.addColorStop(1, `rgba(${COLOR},0)`);
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  return sprite;
}

/** Warm embers drifting slowly upward on one canvas. Off under reduced motion. */
export function Embers() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sprite = makeSprite();
    let width = 0;
    let height = 0;
    const embers: Ember[] = [];
    let frame = 0;
    let last = performance.now();

    const make = (anywhere: boolean): Ember => ({
      x: rand(0, width),
      y: anywhere ? rand(0, height) : height + rand(10, 60),
      size: rand(0.8, 2.2),
      rise: rand(10, 28),
      sway: rand(6, 16),
      freq: rand(0.3, 0.9),
      phase: rand(0, TAU),
      life: anywhere ? rand(0, 6) : 0,
      maxLife: rand(8, 15),
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // fewer on phones and weak devices
      const weak = (navigator.hardwareConcurrency || 4) <= 2;
      const count = Math.round(Math.min(56, Math.max(16, (width * height) / 26000)) * (weak ? 0.5 : 1));
      while (embers.length < count) embers.push(make(true));
      embers.length = count;
    }

    function tick(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = now / 1000;
      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = 'lighter';
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i]!;
        e.life += dt;
        e.x += Math.cos(time * e.freq + e.phase) * e.sway * dt;
        e.y -= e.rise * dt;
        if (e.life > e.maxLife || e.y < -30) {
          embers[i] = make(false);
          continue;
        }
        const fade = Math.max(0, Math.min(1, e.life / 1.5, (e.maxLife - e.life) / 1.5));
        ctx!.globalAlpha = fade * 0.55;
        const r = e.size * 4;
        ctx!.drawImage(sprite, e.x - r, e.y - r, r * 2, r * 2);
      }
      ctx!.globalAlpha = 1;
      frame = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="scene-embers" />;
}
