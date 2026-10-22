import { m } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { game } from '@game';
import { sfx } from '../../audio/sfx';
import { useMusic } from '../../audio/useMusic';
import { voice } from '../../audio/voice';
import { Iskryk } from '../../characters/Iskryk';
import { creatureStage, sparkBalance, type Progress } from '../../engine/progress';
import { timeOfDay } from '../../engine/calendar';
import { hiddenPysanky } from '../../engine/eggs';
import { castleWindows, isLevelUnlocked, warmupDue } from '../../engine/rewards';
import { Scene, type CandleSpot } from '../../fx/ambient/Scene';
import { particles } from '../../fx/particles';
import { PropLayer } from '../../fx/props/Props';
import { useProps } from '../../fx/props/useProps';
import { today } from '../../fx/today';
import { lookOf } from '../../fx/regions/looks';
import { useGame } from '../../store/game';
import { useProgress } from '../../store/progress';
import { fmt, t } from '../../strings';
import { SparkJar } from '../../ui/Candles';
import { HomeButton } from '../../ui/HomeButton';
import { BookIcon, CardsIcon, CauldronIcon, LockIcon, MyDoorIcon, StarIcon } from '../../ui/Icons';
import { levelPath } from '../useLevel';
import { CastleWindows } from './CastleWindows';
import { journeyLayout, roadSegments, samplesBetween, SIGN_H, type JourneyLayout, type NodeKind, type Point } from './journeyLayout';
import '../../fx/regions/regions.css';
import './journey.css';

const CANDLES: CandleSpot[] = [
  { x: 3, y: 34, scale: 0.55 },
  { x: 95, y: 58, scale: 0.6, wide: true },
];

export type NodeState = 'done' | 'next' | 'open' | 'locked';

export interface JourneyWorld {
  id: string;
  title: string;
  look: string;
  levels: { id: string; kind: NodeKind; state: NodeState; stars: number }[];
  /** Signposts he can already read. */
  signs: { id: string; text: string }[];
}

/** Іскрик walks from a finished door to the one it opened. */
export interface Walk {
  from: string;
  to: string;
}

/** Соня announces the pysanky hunt once per visit to the app. */
let pysankyAnnounced = false;

function nextLevelToPlay(progress: Progress): string | undefined {
  const { levels, levelOrder } = game.content;
  return levelOrder.find((id) => isLevelUnlocked(progress, levels.get(id)!) && !progress.levels[id]?.bestStars);
}

/** The map: one road through every world, opening on his next door. */
export function JourneyScreen() {
  const navigate = useNavigate();
  const { world: worldParam } = useParams();
  const progress = useProgress((s) => s.progress);
  const { greeted, setGreeted, walk, takeWalk } = useGame();
  const [shaking, setShaking] = useState<string | null>(null);
  const [pendingWalk] = useState(() => walk);
  useMusic('map');
  const props = useProps('map');
  useEffect(() => {
    if (pendingWalk) takeWalk();
  }, [pendingWalk, takeWalk]);

  useEffect(() => {
    if (greeted) return;
    setGreeted();
    const timer = window.setTimeout(() => void voice.say('greeting'), 600);
    return () => window.clearTimeout(timer);
  }, [greeted, setGreeted]);

  const nextId = nextLevelToPlay(progress);

  // Around Великдень the pysanky hide along his road; Соня mentions it once per visit.
  const { config } = game.content;
  const hidden = hiddenPysanky(progress, today(), config);
  const huntOn = hidden.length > 0;
  useEffect(() => {
    if (huntOn && !pysankyAnnounced) {
      pysankyAnnounced = true;
      void voice.say('eggs.pysankyStart');
    }
  }, [huntOn]);
  const findPysanka = (index: number, at: Point) => {
    particles.sparkle(at.x, at.y);
    sfx.pop();
    if (useProgress.getState().findPysanka(index, today())) {
      sfx.fanfare();
      particles.confettiRain();
      void voice.say('eggs.pysankyDone', 'interrupt');
    }
  };

  const worlds = useMemo<JourneyWorld[]>(
    () => {
      const canRead = game.canRead(progress);
      return game.content.worlds.map(({ world, levels }) => ({
        id: world.id,
        title: world.title,
        look: world.look,
        signs: world.signs.filter(canRead).map((id) => ({ id, text: game.item(id).text })),
        levels: levels.map((level) => {
          const stars = progress.levels[level.id]?.bestStars ?? 0;
          const state: NodeState = !isLevelUnlocked(progress, level) ? 'locked' : level.id === nextId ? 'next' : stars > 0 ? 'done' : 'open';
          return { id: level.id, kind: game.nodeKind(level), state, stars };
        }),
      }));
    },
    [progress, nextId],
  );

  // /map/<world>: open on that world's first unfinished door (or its first door).
  const focus = worldParam
    ? (() => {
        const w = worlds.find((x) => x.id === worldParam);
        return w?.levels.find((l) => l.state === 'next' || l.state === 'open')?.id ?? w?.levels[0]?.id;
      })()
    : undefined;

  const open = useCallback(
    (levelId: string) => {
      const level = game.content.levels.get(levelId);
      if (!level || !isLevelUnlocked(useProgress.getState().progress, level)) {
        sfx.wrong();
        setShaking(levelId);
        window.setTimeout(() => setShaking(null), 400);
        return;
      }
      sfx.tap();
      navigate(levelPath(levelId));
    },
    [navigate],
  );

  // On a laptop, Enter opens his next door.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.target === document.body && nextId) open(nextId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nextId, open]);

  // Once a day, after a few levels: the cauldron of «Чарівна розминка».
  const warmup = warmupDue(progress, new Date()) && game.warmup(progress) !== null;

  return (
    <JourneyView
      worlds={worlds}
      actions={
        warmup && (
          <button
            type="button"
            className="icon-button journey-warmup"
            aria-label={t.map.warmup}
            onClick={() => {
              sfx.tap();
              navigate('/warmup');
            }}
            data-warmup
          >
            <CauldronIcon />
          </button>
        )
      }
      focus={focus}
      walk={pendingWalk}
      shaking={shaking}
      onOpen={open}
      onSign={(id) => {
        sfx.tap();
        void voice.item(id, 'interrupt');
      }}
      creature={creatureStage(progress, game.content.config)}
      props={<PropLayer ids={props} slots={['sky', 'moon']} />}
      pysanky={{ total: config.eggs.pysankyCount, hidden }}
      onPysanka={findPysanka}
      onSneeze={(at) => {
        sfx.sneeze();
        particles.sparkle(at.x, at.y);
        void voice.say('eggs.sneeze', 'interrupt');
      }}
      onCorners={() => {
        void voice.say('eggs.fireworks', 'interrupt');
        [
          [25, 30],
          [70, 22],
          [50, 45],
          [32, 55],
          [75, 50],
        ].forEach(([x, y], i) =>
          window.setTimeout(() => {
            sfx.fireworkBurst();
            particles.firework(x!, y!, i);
          }, i * 450),
        );
      }}
      shelf={
        <>
          <button
            type="button"
            className="icon-button journey-book"
            aria-label={t.book.open}
            onClick={() => {
              sfx.tap();
              navigate('/book');
            }}
            data-book
          >
            <BookIcon />
          </button>
          <CastleWindows
            lit={castleWindows(progress.rewards.litWindows, new Date(), game.content.config)}
            evening={['evening', 'night'].includes(timeOfDay(today(), game.content.config.eggs))}
            cat={props.includes('cat')}
          />
          <button
            type="button"
            className="icon-button journey-album"
            aria-label={t.album.open}
            onClick={() => {
              sfx.tap();
              navigate('/album');
            }}
            data-album
          >
            <CardsIcon />
          </button>
        </>
      }
      jar={<SparkJar count={sparkBalance(progress)} label={fmt(t.map.sparks, { n: sparkBalance(progress) })} />}
    />
  );
}

interface ViewProps {
  worlds: JourneyWorld[];
  /** Open centred on this level (default: his next one). */
  focus?: string;
  walk?: Walk | null;
  shaking?: string | null;
  onOpen(levelId: string): void;
  /** He tapped a signpost: Соня reads it to him. */
  onSign?(id: string): void;
  creature: number;
  jar: ReactNode;
  /** Extra buttons in the bar (the daily warm-up). */
  actions?: ReactNode;
  /** Ambient details in the sky behind the road. */
  props?: ReactNode;
  /** The Book of Spells, the album and the castle windows: below the road in portrait, in the bar in landscape. */
  shelf?: ReactNode;
  /** Around Великдень: the pysanky still hidden (indices of `total`), on free spots along his road. */
  pysanky?: { total: number; hidden: number[] };
  onPysanka?(index: number, at: Point): void;
  /** Hidden surprises: a long press on Іскрик, and the four corners tapped clockwise. */
  onSneeze?(at: Point): void;
  onCorners?(): void;
}

/** Where a tap landed, as a corner of the screen (0 top-left, then clockwise), if it did. */
function cornerOf(x: number, y: number): number | null {
  const zone = 72;
  const right = x > window.innerWidth - zone;
  const bottom = y > window.innerHeight - zone;
  if ((x >= zone && !right) || (y >= zone && !bottom)) return null;
  return bottom ? (right ? 2 : 3) : right ? 1 : 0;
}

type SegmentState = 'lit' | 'active' | 'dim';

interface PlacedSign extends Point {
  id: string;
  text: string;
  w: number;
  region: number;
}

/** A signpost's width for its word at the reading size (48 px, see .journey-sign). */
let measure: CanvasRenderingContext2D | null = null;
function signWidth(text: string): number {
  measure ??= document.createElement('canvas').getContext('2d');
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-reading') || 'sans-serif';
  if (measure) measure.font = `800 48px ${family}`;
  const glyphs = measure ? measure.measureText(text).width : text.length * 36;
  // letter-spacing 0.04em, the board's padding and border, and a little slack for font fallback
  return Math.max(SIGN_H, Math.ceil(glyphs * 1.06 + text.length * 48 * 0.04 + 2 * 14 + 4));
}

/** The road: every world's gate then its doors, as points; one smooth segment between each pair. */
interface Road {
  points: Point[];
  /** Index in `points` of each door, in play order. */
  doorPoint: number[];
  /** Index in `points` of each world's gate. */
  gatePoint: number[];
  paths: string[];
  /** Segment i runs from points[i] to points[i + 1]. */
  state: SegmentState[];
  /** The stretch leading to his next door, where the sparks travel. */
  active?: number;
}

/** The journey itself: also rendered by the test-build route with hundreds of levels. */
export function JourneyView({ worlds, focus, walk, shaking, onOpen, onSign, creature, jar, actions, props, shelf, pysanky, onPysanka, onSneeze, onCorners }: ViewProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const corners = useRef<{ next: number; at: number }>({ next: 0, at: 0 });
  const press = useRef(0);
  const [sneezing, setSneezing] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [scroll, setScroll] = useState(0);
  const [nextInView, setNextInView] = useState(true);
  const [walked, setWalked] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useLayoutEffect(() => {
    const el = scroller.current!;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(
    () => (size ? journeyLayout(worlds.map((w) => ({ id: w.id, levels: w.levels.map((l) => ({ id: l.id, kind: l.kind })) })), size) : null),
    [worlds, size],
  );
  const flat = useMemo(() => worlds.flatMap((w) => w.levels), [worlds]);
  const nextId = flat.find((l) => l.state === 'next')?.id;

  // The road's points in order: each world's gate, then its doors. A stretch is lit up to the
  // doors he has finished, sparkles on the way to his next one, and dim beyond.
  const road = useMemo<Road | null>(() => {
    if (!layout) return null;
    const points: Point[] = [];
    const doorPoint: number[] = [];
    const gatePoint: number[] = [];
    const doorOfPoint = new Map<number, number>();
    let k = 0;
    layout.regions.forEach((region, r) => {
      gatePoint.push(points.length);
      points.push(region.gate);
      for (; k < layout.nodes.length && layout.nodes[k]!.region === r; k++) {
        doorOfPoint.set(points.length, k);
        doorPoint.push(points.length);
        points.push(layout.nodes[k]!);
      }
    });
    const toward = (i: number): SegmentState => {
      const level = flat[doorOfPoint.get(i) ?? -1];
      return level?.state === 'done' ? 'lit' : level?.state === 'next' ? 'active' : 'dim';
    };
    const state = points.slice(1).map((_, i): SegmentState => {
      if (doorOfPoint.has(i + 1)) return toward(i + 1);
      const beyond = toward(i + 2); // into a gate: like the stretch after it, sparks only after the gate
      return beyond === 'active' ? 'lit' : beyond;
    });
    const active = state.indexOf('active');
    return { points, doorPoint, gatePoint, paths: roadSegments(points), state, active: active >= 0 ? active : undefined };
  }, [layout, flat]);

  // Each world's readable signposts, spread over its free spots wide enough for the word.
  const signs = useMemo(() => {
    if (!layout) return [];
    const out: PlacedSign[] = [];
    worlds.forEach((world, r) => {
      const spots = layout.spots.filter((s) => s.region === r);
      const used = new Set<number>();
      world.signs.forEach((sign, k) => {
        const w = signWidth(sign.text);
        const ideal = Math.floor(((k + 0.5) * spots.length) / world.signs.length);
        const order = spots.map((_, i) => i).sort((a, b) => Math.abs(a - ideal) - Math.abs(b - ideal));
        const at = order.find((i) => !used.has(i) && spots[i]!.maxW >= w);
        if (at === undefined) return;
        used.add(at);
        out.push({ ...sign, x: spots[at]!.x, y: spots[at]!.y, w, region: r });
      });
    });
    return out;
  }, [layout, worlds]);

  // The pysanky: on free spots (no signpost there) up to the world he has reached, spread evenly,
  // each egg always on the same spot so finding one doesn't move the others.
  const eggs = useMemo(() => {
    if (!layout || !pysanky?.hidden.length) return [];
    const taken = new Set(signs.map((s) => `${s.x},${s.y}`));
    const reach = layout.nodes.find((n) => n.id === nextId)?.region ?? layout.regions.length - 1;
    const free = layout.spots.filter((s) => !taken.has(`${s.x},${s.y}`) && s.region <= reach);
    const pool = free.length >= pysanky.total ? free : layout.spots.filter((s) => !taken.has(`${s.x},${s.y}`));
    return pysanky.hidden.flatMap((i) => {
      const spot = pool[Math.floor(((i + 0.5) * pool.length) / pysanky.total)];
      return spot ? [{ i, x: spot.x, y: spot.y }] : [];
    });
  }, [layout, signs, pysanky, nextId]);

  const along = (p: Point) => (layout?.orientation === 'portrait' ? p.y : p.x);
  const viewLen = layout ? (layout.orientation === 'portrait' ? size!.height : size!.width) : 0;

  const scrollToLevel = useCallback(
    (levelId: string | undefined, smooth: boolean) => {
      const el = scroller.current;
      if (!el || !layout || !levelId) return;
      const node = layout.nodes.find((n) => n.id === levelId);
      if (!node) return;
      const behavior = smooth && !reduced ? 'smooth' : 'instant';
      if (layout.orientation === 'portrait') el.scrollTo({ top: node.y - el.clientHeight / 2, behavior });
      else el.scrollTo({ left: node.x - el.clientWidth / 2, behavior });
    },
    [layout, reduced],
  );

  // After a level opened a new door, Іскрик walks the road from the finished door to it.
  const walkPath = useMemo(() => {
    if (!walk || !road || reduced) return null;
    const from = road.doorPoint[flat.findIndex((l) => l.id === walk.from)];
    const to = road.doorPoint[flat.findIndex((l) => l.id === walk.to)];
    if (from === undefined || to === undefined || to <= from) return null;
    const steps: Point[] = [];
    for (let i = from; i < to; i++) {
      const pts = samplesBetween(road.points, i, 14);
      if (i < to - 1) steps.push(...pts);
      else {
        const door = road.points[to]!;
        steps.push(...pts.filter((p) => Math.hypot(p.x - door.x, p.y - door.y) >= layout!.door * 1.1));
      }
    }
    return steps;
  }, [walk, road, flat, reduced, layout]);
  const walking = walkPath && !walked ? walkPath : null;

  // Open on his door (or where Іскрик starts walking from), then follow him.
  const opened = useRef(false);
  useLayoutEffect(() => {
    if (!layout || !road || opened.current) return;
    opened.current = true;
    scrollToLevel(walk?.from ?? focus ?? nextId ?? flat.at(-1)?.id, false);
    if (walkPath) window.setTimeout(() => scrollToLevel(walk!.to, true), 350);
  }, [layout, road, walk, walkPath, focus, nextId, flat, scrollToLevel]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el || !layout) return;
    const pos = layout.orientation === 'portrait' ? el.scrollTop : el.scrollLeft;
    // Only re-render when it changes which worlds are drawn or whether his door is in view.
    setScroll((prev) => (Math.abs(prev - pos) > viewLen / 3 ? pos : prev));
    const next = layout.nodes.find((n) => n.id === nextId);
    if (next) {
      const at = along(next);
      setNextInView(at > pos + 24 && at < pos + viewLen - 24);
    }
  };

  // In landscape the wheel scrolls the road sideways.
  useEffect(() => {
    const el = scroller.current;
    if (!el || layout?.orientation !== 'landscape') return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => el.removeEventListener('wheel', onWheel);
  }, [layout?.orientation]);

  // Draw only the worlds near what he sees.
  const shown = layout
    ? new Set(layout.regions.filter((r) => r.end >= scroll - viewLen && r.start <= scroll + 2 * viewLen).map((r) => r.index))
    : new Set<number>();

  // Іскрик rests on the road just before his next door.
  const rest = useMemo(() => {
    if (!road || !layout) return null;
    const target = nextId ? flat.findIndex((l) => l.id === nextId) : flat.length - 1;
    const at = road.doorPoint[target];
    if (at === undefined) return null;
    const door = road.points[at]!;
    if (!nextId) return door;
    // A world's first door comes straight after its gate: he waits at the door's side.
    if (road.gatePoint.includes(at - 1)) {
      const side = layout.orientation === 'portrait' && door.x < layout.width / 2 ? 1 : -1;
      return { x: door.x + side * layout.door * 0.95, y: door.y + layout.door * 0.35 };
    }
    // Otherwise on the road, just outside the door: the last point a door's width away from it.
    const pts = samplesBetween(road.points, at - 1, 30);
    const away = pts.filter((p) => Math.hypot(p.x - door.x, p.y - door.y) >= layout.door * 1.1);
    return away.at(-1) ?? pts[0]!;
  }, [road, layout, nextId, flat]);

  return (
    <main
      className={`screen journey-screen ${shelf ? 'has-shelf' : ''}`}
      onPointerDown={(e) => {
        // A parent's secret: the four corners, clockwise from top-left, within 5 seconds.
        if (!onCorners || (e.target as Element).closest('button')) return;
        const corner = cornerOf(e.clientX, e.clientY);
        const c = corners.current;
        if (corner === null) return;
        if (corner === c.next && (corner === 0 || performance.now() - c.at < 5000)) {
          corners.current = { next: (corner + 1) % 4, at: corner === 0 ? performance.now() : c.at };
          if (corner === 3) onCorners();
        } else corners.current = { next: corner === 0 ? 1 : 0, at: performance.now() };
      }}
    >
      <Scene candles={CANDLES} />
      {props}
      <header className="journey-bar">
        <HomeButton />
        <div className="journey-bar-end">
          {actions}
          {!nextInView && nextId && (
            <button type="button" className="icon-button" aria-label={t.map.toMyDoor} onClick={() => scrollToLevel(nextId, true)} data-to-my-door>
              <MyDoorIcon />
            </button>
          )}
          {jar}
        </div>
      </header>
      {shelf && <nav className="journey-shelf">{shelf}</nav>}

      <div
        ref={scroller}
        className={`journey-scroll is-${layout?.orientation ?? 'portrait'}`}
        onScroll={onScroll}
        data-scroll-region
      >
        {layout && road && (
          <div className="journey-track" style={{ width: layout.width, height: layout.height, '--door-w': `${layout.door}px` } as CSSProperties}>
            {/* In layers across the worlds in view: scenery, the road, then gates and doors. */}
            {(['scenery', 'road', 'doors'] as const).map((layer) =>
              layout.regions
                .filter((region) => shown.has(region.index))
                .map((region) => (
                  <Region
                    key={`${layer}-${region.id}`}
                    layer={layer}
                    layout={layout}
                    region={region.index}
                    world={worlds[region.index]!}
                    road={road}
                    signs={signs}
                    shaking={shaking}
                    onOpen={onOpen}
                    onSign={onSign}
                  />
                )),
            )}
            {eggs.map((egg) => (
              <button
                key={egg.i}
                type="button"
                className="journey-pysanka"
                style={{ left: egg.x, top: egg.y }}
                aria-label={t.map.pysanka}
                onClick={(e) => onPysanka?.(egg.i, { x: e.clientX, y: e.clientY })}
                data-pysanka={egg.i}
              >
                <Pysanka index={egg.i} />
              </button>
            ))}
            {rest && (
              <m.div
                className={`journey-iskryk ${onSneeze ? 'is-pressable' : ''} ${sneezing ? 'is-sneezing' : ''}`}
                aria-hidden="true"
                onPointerDown={(e) => {
                  if (!onSneeze) return;
                  const at = { x: e.clientX, y: e.clientY };
                  window.clearTimeout(press.current);
                  // A long press: he sneezes a puff of glitter.
                  press.current = window.setTimeout(() => {
                    setSneezing(true);
                    onSneeze(at);
                    window.setTimeout(() => setSneezing(false), 900);
                  }, 600);
                }}
                onPointerUp={() => window.clearTimeout(press.current)}
                onPointerLeave={() => window.clearTimeout(press.current)}
                onPointerCancel={() => window.clearTimeout(press.current)}
                onContextMenu={(e) => e.preventDefault()}
                initial={walking ? { x: walking[0]!.x, y: walking[0]!.y } : false}
                animate={walking ? { x: walking.map((p) => p.x), y: walking.map((p) => p.y) } : { x: rest.x, y: rest.y }}
                transition={walking ? { duration: 1.8, ease: 'easeInOut' } : { duration: 0 }}
                onAnimationComplete={() => walking && setWalked(true)}
              >
                <Iskryk stage={creature} mood={walking ? 'dance' : 'idle'} />
              </m.div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Region({
  layer,
  layout,
  region: r,
  world,
  road,
  signs,
  shaking,
  onOpen,
  onSign,
}: {
  layer: 'scenery' | 'road' | 'doors';
  layout: JourneyLayout;
  region: number;
  world: JourneyWorld;
  road: Road;
  signs: PlacedSign[];
  shaking?: string | null;
  onOpen(levelId: string): void;
  onSign?(id: string): void;
}) {
  const region = layout.regions[r]!;
  const look = lookOf(world.look);
  const portrait = layout.orientation === 'portrait';
  const band = portrait
    ? { top: region.start, left: 0, width: layout.width, height: region.end - region.start }
    : { left: region.start, top: 0, width: region.end - region.start, height: layout.height };
  const length = portrait ? band.height : band.width;
  const motifs = Array.from({ length: Math.max(1, Math.floor(length / 380)) }, (_, i) => i);
  const nodes = layout.nodes.filter((n) => n.region === r);
  const levels = new Map(world.levels.map((l) => [l.id, l]));
  // This world draws the road from the previous world's last door, through its gate, to its last door.
  const first = Math.max(0, road.gatePoint[r]! - 1);
  const end = (road.gatePoint[r + 1] ?? road.points.length) - 1;
  const segments = Array.from({ length: end - first }, (_, k) => first + k);

  if (layer === 'scenery') {
    return (
      <div className={`journey-region look-${world.look}`} style={{ ...band, '--accent': look.accent } as CSSProperties} aria-hidden="true">
        {motifs.map((i) => {
          const Motif = look.motifs[i % look.motifs.length]!;
          const offset = 120 + i * 380;
          const side = i % 2 === 0 ? 'is-start' : 'is-end';
          const far = i % 3 === 2 ? 'is-far' : '';
          return (
            <div key={i} className={`region-motif ${side} ${far}`} style={portrait ? { bottom: offset } : { left: offset }}>
              <Motif />
            </div>
          );
        })}
      </div>
    );
  }

  if (layer === 'road') {
    return (
      <>
        <svg className="journey-road" style={{ width: layout.width, height: layout.height }} aria-hidden="true">
          {segments.map((i) => (
            <path key={i} d={road.paths[i]} className={`road-base is-${road.state[i]}`} />
          ))}
          {segments.map((i) => (
            <path key={`s${i}`} d={road.paths[i]} className={`road-stones is-${road.state[i]}`} />
          ))}
        </svg>
        {road.active !== undefined && segments.includes(road.active) && <Sparkles points={samplesBetween(road.points, road.active, 24)} />}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className="journey-gate"
        style={{ left: region.gate.x, top: region.gate.y, width: region.gate.w, height: region.gate.h, '--accent': look.accent } as CSSProperties}
        onClick={() => {
          sfx.tap();
          void voice.text(world.title, 'interrupt');
        }}
      >
        <span className="journey-gate-title">{world.title}</span>
      </button>

      {signs
        .filter((s) => s.region === r)
        .map((sign) => (
          <button
            key={sign.id}
            type="button"
            className="journey-sign"
            style={{ left: sign.x, top: sign.y, width: sign.w, height: SIGN_H }}
            onClick={() => onSign?.(sign.id)}
            data-sign={sign.id}
          >
            <span className="read-word">{sign.text}</span>
          </button>
        ))}

      {nodes.map((node) => {
        const level = levels.get(node.id)!;
        return (
          <button
            key={node.id}
            type="button"
            className={`journey-node is-${level.state} is-${node.kind} ${shaking === node.id ? 'is-shaking' : ''}`}
            style={{ left: node.x, top: node.y, '--w': `${node.w}px` } as CSSProperties}
            aria-label={`${fmt(t.map.level, { n: node.n })}. ${level.state === 'locked' ? t.map.locked : fmt(t.map.stars, { n: level.stars })}`}
            onClick={() => onOpen(node.id)}
            data-level={node.id}
          >
            <span className="journey-door">
              <span className="journey-door-light" />
              {level.state === 'locked' ? (
                <span className="journey-lock">
                  <LockIcon />
                </span>
              ) : (
                <span className="journey-door-number">{node.n}</span>
              )}
              {node.kind === 'review' && (
                <span className="journey-door-badge">
                  <BookIcon />
                </span>
              )}
            </span>
            <span className="journey-stars">
              {[0, 1, 2].map((s) => (
                <StarIcon key={s} filled={s < level.stars} />
              ))}
            </span>
          </button>
        );
      })}
    </>
  );
}

/** Three sparks travelling up the stretch of road to his next door. */
function Sparkles({ points }: { points: Point[] }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <m.span
          key={i}
          className="road-spark"
          aria-hidden="true"
          initial={{ x: points[0]!.x, y: points[0]!.y, opacity: 0 }}
          animate={{ x: points.map((p) => p.x), y: points.map((p) => p.y), opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.6, ease: 'linear', repeat: Infinity, delay: i * 0.85, opacity: { duration: 2.6, times: [0, 0.15, 0.8, 1], repeat: Infinity, delay: i * 0.85 } }}
        />
      ))}
    </>
  );
}

const EGG_COLOURS = [
  ['#9b4a3c', '#e0bf6a'],
  ['#c9a24a', '#5b3a6e'],
  ['#4f7f78', '#f0d68a'],
  ['#7c3a34', '#7cc4bd'],
  ['#2b1d10', '#d9a05a'],
];

/** A pysanka: an egg with a band, waves and dots, in the palette's muted reds, golds and teals. */
function Pysanka({ index }: { index: number }) {
  const [base, line] = EGG_COLOURS[index % EGG_COLOURS.length]!;
  return (
    <svg viewBox="0 0 40 50" aria-hidden="true">
      <ellipse cx="20" cy="27" rx="15" ry="20" fill={base} />
      <path d="M6 24h28M6 31h28" stroke={line} strokeWidth="1.6" />
      <path d="M7 27.5q3.3-3 6.5 0t6.5 0 6.5 0 6.5 0" fill="none" stroke={line} strokeWidth="1.4" />
      <path d="M20 9l3 5-3 5-3-5zM20 36l3 4-3 4-3-4z" fill={line} />
      <ellipse cx="14" cy="17" rx="3" ry="5" fill="#fff" opacity=".18" transform="rotate(-20 14 17)" />
    </svg>
  );
}
