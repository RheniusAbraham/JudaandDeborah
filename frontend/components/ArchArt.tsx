'use client';

// The arch, drawn in code in the spirit of the watercolor sketch: wall, bead strings,
// bottom flowers, two curtains, and the rod with its swags and rose cluster.
// Each is its own <svg> layer (same 1536 x 2314 space) so the scroll scene can move them,
// and the curtains are real fabric shapes that bend when tapped.

import { useEffect, useMemo, useRef } from 'react';
import {
  VW, VH, CURTAIN, rng, curtainShape, swagShape, swagHemY, roseShape, leafShape, stem, stemPoints,
  type Disp,
} from '@/lib/arch/geom';
import { Tap, breeze, freedom } from '@/lib/arch/sway';

const INK = '#5a2f2a';
type Tone = 'pink' | 'coral' | 'peach';

// Round every computed coordinate: the server and the browser can differ in the last digits
// of trig results, and the rendered numbers must match exactly for hydration.
const q = (n: number) => Math.round(n * 10) / 10;

/* --------------------------------------------------------------- shared paint */

/** Fine fabric speckle: a fixed scatter of tiny light and dark flecks, tiled. */
function Speckle() {
  const dots = useMemo(() => {
    const rand = rng(99);
    return Array.from({ length: 70 }, () => ({
      x: q(rand() * 90), y: q(rand() * 90), r: q(0.5 + rand() * 1.1), light: rand() > 0.5,
    }));
  }, []);
  return (
    <pattern id="a-speckle" width="90" height="90" patternUnits="userSpaceOnUse">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.light ? '#ffffff' : '#7a2f28'} fillOpacity={d.light ? 0.22 : 0.1} />
      ))}
    </pattern>
  );
}

function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        {/* fabric: each fold panel is lit across its width, so the folds look rounded */}
        {/* three panel tones, so neighboring folds never look stamped from one template */}
        <linearGradient id="a-fab0" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#d97b69" />
          <stop offset=".16" stopColor="#ec9a85" />
          <stop offset=".42" stopColor="#fde3d5" />
          <stop offset=".58" stopColor="#f8c9b5" />
          <stop offset=".85" stopColor="#eea08b" />
          <stop offset="1" stopColor="#d6735f" />
        </linearGradient>
        <linearGradient id="a-fab1" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#cf6d5c" />
          <stop offset=".22" stopColor="#e98f7b" />
          <stop offset=".46" stopColor="#f7c2ad" />
          <stop offset=".7" stopColor="#efa48f" />
          <stop offset="1" stopColor="#cc6a59" />
        </linearGradient>
        <linearGradient id="a-fab2" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#de8371" />
          <stop offset=".3" stopColor="#f3b29c" />
          <stop offset=".45" stopColor="#fee8dc" />
          <stop offset=".62" stopColor="#f5bba6" />
          <stop offset="1" stopColor="#da7c6a" />
        </linearGradient>
        {/* shade toward the outer edge, where the curtain turns away from the light */}
        <linearGradient id="a-edgeShade" gradientUnits="userSpaceOnUse" x1="0" x2="480" y1="0" y2="0">
          <stop offset="0" stopColor="#7a2f28" stopOpacity=".32" />
          <stop offset=".35" stopColor="#7a2f28" stopOpacity="0" />
        </linearGradient>
        {/* woven threads + fine speckle: real-fabric tooth, as patterns (no filters) */}
        <pattern id="a-weave" width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="none" />
          <path d="M0 0V7" stroke="#ffffff" strokeOpacity=".16" strokeWidth="1.3" />
          <path d="M3.5 0V7" stroke="#7a2f28" strokeOpacity=".07" strokeWidth="1" />
          <path d="M0 3.5H7" stroke="#ffffff" strokeOpacity=".05" strokeWidth="1" />
        </pattern>
        <Speckle />
        <linearGradient id="a-curShade" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={CURTAIN.top} y2={CURTAIN.floor + 30}>
          <stop offset="0" stopColor="#a8584a" stopOpacity=".45" />
          <stop offset=".12" stopColor="#a8584a" stopOpacity="0" />
          <stop offset=".48" stopColor="#a8584a" stopOpacity=".28" />
          <stop offset=".6" stopColor="#a8584a" stopOpacity="0" />
          <stop offset=".9" stopColor="#ffffff" stopOpacity=".18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".38" />
        </linearGradient>
        <linearGradient id="a-swagA" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f2ab95" />
          <stop offset=".55" stopColor="#fcd9c8" />
          <stop offset="1" stopColor="#f0a690" />
        </linearGradient>
        <linearGradient id="a-swagB" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e9917e" />
          <stop offset=".5" stopColor="#f7c3ae" />
          <stop offset="1" stopColor="#e88e7b" />
        </linearGradient>
        <linearGradient id="a-wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c49a80" />
          <stop offset=".45" stopColor="#a87b62" />
          <stop offset="1" stopColor="#7d5545" />
        </linearGradient>
        {/* petals: deep at the heart of the rose, paling toward the tips (roses are drawn
            at unit size, so these gradients are in the rose's own space) */}
        {(
          [
            ['pink', ['#8f2238', '#c4405b', '#e46f86', '#f6b4c0', '#fde3e7']],
            ['coral', ['#a33a1f', '#d8643f', '#f08b62', '#f9bf9a', '#feeadb']],
            ['peach', ['#b8513f', '#e07e6b', '#f2a493', '#fbd2c6', '#fff0ea']],
          ] as const
        ).map(([tone, c]) => (
          <radialGradient key={tone} id={`a-rose-${tone}`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1.05">
            <stop offset="0" stopColor={c[0]} />
            <stop offset=".25" stopColor={c[1]} />
            <stop offset=".55" stopColor={c[2]} />
            <stop offset=".85" stopColor={c[3]} />
            <stop offset="1" stopColor={c[4]} />
          </radialGradient>
        ))}
        <linearGradient id="a-leaf" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#4d6b5a" />
          <stop offset=".6" stopColor="#6f8f7c" />
          <stop offset="1" stopColor="#87a593" />
        </linearGradient>
        <linearGradient id="a-leafLit" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#7d9c89" />
          <stop offset=".55" stopColor="#a9c3b2" />
          <stop offset="1" stopColor="#c3d6c9" />
        </linearGradient>
        <radialGradient id="a-euc" cx=".35" cy=".32" r=".75">
          <stop offset="0" stopColor="#d3e1d8" />
          <stop offset=".45" stopColor="#a2b9ab" />
          <stop offset="1" stopColor="#6c8778" />
        </radialGradient>
        {/* the wash fades in from nothing, so its top edge is a soft bloom, not a line */}
        <linearGradient id="a-wash" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f9d8be" stopOpacity="0" />
          <stop offset=".3" stopColor="#f8d0b0" stopOpacity=".55" />
          <stop offset=".7" stopColor="#f5c19c" stopOpacity=".9" />
          <stop offset="1" stopColor="#f3b98e" />
        </linearGradient>
        <radialGradient id="a-bloom">
          <stop offset="0" stopColor="#f2bb92" stopOpacity=".45" />
          <stop offset="1" stopColor="#f2bb92" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* --------------------------------------------------------------- botanicals */

/** A layered rose: outer opened petals, a cupped middle ring, a tight swirled bud. */
export function Rose({ x, y, r, tone, seed, rot = 0 }: { x: number; y: number; r: number; tone: Tone; seed: number; rot?: number }) {
  const s = useMemo(() => roseShape(seed), [seed]);
  const fill = `url(#a-rose-${tone})`;
  return (
    <g transform={`translate(${q(x)} ${q(y)}) rotate(${q(rot)}) scale(${q(r)})`}>
      {/* soft contact shadow so the rose sits on the foliage */}
      <circle r={1.08} cx={0.06} cy={0.1} fill="#5a2f2a" fillOpacity={0.14} />
      {s.petals.map((ring, ri) => (
        <g key={ri}>
          {ring.map((p, i) => (
            <g key={i} transform={p.transform}>
              <path d={p.body} fill={fill} stroke={INK} strokeOpacity={ri === 0 ? 0.6 : 0.45} strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              <path d={p.lip} fill="none" stroke="#ffffff" strokeOpacity={ri === 2 ? 0.35 : 0.55} strokeWidth={1.4} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
            </g>
          ))}
        </g>
      ))}
      <circle r={0.2} fill={fill} />
      <path d={s.swirl} fill="none" stroke="#5e1726" strokeOpacity={0.75} strokeWidth={1.3} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </g>
  );
}

/** A leaf with a lit upper half, a shaded lower half, a midrib and side veins. */
export function Leaf({ x, y, len, a,w = 0.32 }: { x: number; y: number; len: number; a: number; w?: number }) {
  const s = leafShape(len, len * w);
  return (
    <g transform={`translate(${q(x)} ${q(y)}) rotate(${q(a)})`}>
      <path d={s.body} fill="url(#a-leaf)" stroke={INK} strokeWidth={1.3} strokeOpacity={0.55} strokeLinejoin="round" />
      <path d={s.lit} fill="url(#a-leafLit)" />
      <path d={s.veins} fill="none" stroke="#3f5a4b" strokeWidth={0.9} strokeOpacity={0.4} strokeLinecap="round" />
      <path d={s.rib} fill="none" stroke="#e9f1ec" strokeWidth={1.2} strokeOpacity={0.55} strokeLinecap="round" />
    </g>
  );
}

/** A round eucalyptus leaf, lit from the upper left. */
function Euc({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={q(x)} cy={q(y)} r={q(r)} fill="url(#a-euc)" stroke={INK} strokeWidth={1.1} strokeOpacity={0.5} />
      <path d={`M${q(x - r * 0.55)} ${q(y)}Q${q(x)} ${q(y - r * 0.18)} ${q(x + r * 0.55)} ${q(y)}`} fill="none" stroke="#5f7a6b" strokeWidth={0.9} strokeOpacity={0.45} />
    </g>
  );
}

/** A trailing eucalyptus stem with round leaves on alternating sides. */
export function Trail({ a, b, bend, n, r }: { a: [number, number]; b: [number, number]; bend: number; n: number; r: number }) {
  const pts = stemPoints(a, b, bend, n);
  return (
    <g>
      <path d={stem(a, b, bend)} fill="none" stroke="#5e7566" strokeWidth={2.4} strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <Euc key={i} x={x + (i % 2 ? r * 0.9 : -r * 0.9)} y={y} r={r * (1 - i / (n * 2.2))} />
      ))}
    </g>
  );
}

/** Leaves fanned around a center: the greenery behind a rose cluster. */
function Foliage({ cx, cy, n, r0, r1, len, seed }: { cx: number; cy: number; n: number; r0: number; r1: number; len: number; seed: number }) {
  const items = useMemo(() => {
    const rand = rng(seed);
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 360 + rand() * 24;
      const d = r0 + rand() * (r1 - r0);
      const rad = (a * Math.PI) / 180;
      return { x: cx + Math.cos(rad) * d * 0.4, y: cy + Math.sin(rad) * d * 0.4, a, l: len * (0.75 + rand() * 0.5) };
    });
  }, [cx, cy, n, r0, r1, len, seed]);
  return (
    <g>
      {items.map((t, i) => (
        <Leaf key={i} x={t.x} y={t.y} len={t.l} a={t.a} />
      ))}
    </g>
  );
}

/* --------------------------------------------------------------- layers */

function Wall() {
  // the wall stays clean: only a soft warm wash along the bottom (no SVG filters: they
  // render in tiles and leave hairline seams when scaled)
  // a soft, rolling top edge (smooth curves through gentle swells, no jagged segments)
  const washTop = useMemo(() => {
    const ys = (x: number) => Math.round(2060 + 38 * Math.sin(x / 260) + 18 * Math.sin(x / 120 + 1.3));
    const pts: [number, number][] = [];
    for (let x = -200; x <= VW + 200; x += 120) pts.push([x, ys(x)]);
    let d = `M-200 ${VH + 20}L${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1];
      const [x, y] = pts[i];
      d += `Q${px} ${py} ${(px + x) / 2} ${Math.round((py + y) / 2)}`;
    }
    return d + `L${VW + 200} ${VH + 20}Z`;
  }, []);
  return (
    <svg className="layer layer-plate" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width={VW} height={VH} fill="#fdeee5" />
      <ellipse cx={330} cy={2250} rx={420} ry={150} fill="url(#a-bloom)" />
      <ellipse cx={1200} cy={2260} rx={460} ry={140} fill="url(#a-bloom)" />
      <path d={washTop} fill="url(#a-wash)" opacity={0.5} />
    </svg>
  );
}

const STRINGS: [number, number][] = [
  [430, 520], [560, 300], [690, 220], [800, 260], [905, 340], [1010, 240], [1150, 430], [1262, 300],
];

function Beads() {
  return (
    <svg className="layer layer-beads" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {STRINGS.map(([x, len], si) => {
        const top = q(Math.max(swagHemY(300, 880, 44, 250, x), swagHemY(540, 1340, 44, 330, x)) - 6);
        const n = Math.floor(len / 44);
        return (
          <g key={si}>
            <path d={`M${x} ${top}Q${x + 4} ${top + len / 2} ${x} ${top + len}`} stroke={INK} strokeWidth={1.4} strokeOpacity={0.55} fill="none" />
            {Array.from({ length: n }, (_, k) => {
              const y = top + 34 + k * 44;
              return (k + si) % 3 === 1 ? (
                <g key={k} transform={`translate(${x} ${y})`}>
                  {[0, 72, 144, 216, 288].map((a) => (
                    <circle key={a} cx={q(Math.cos((a * Math.PI) / 180) * 7)} cy={q(Math.sin((a * Math.PI) / 180) * 7)} r={6.5} fill="#ef8fa3" stroke={INK} strokeWidth={0.9} strokeOpacity={0.5} />
                  ))}
                  <circle r={3.6} fill="#f4c46e" />
                </g>
              ) : (
                <circle key={k} cx={x} cy={y} r={7.5} fill="#f8dcc6" stroke={INK} strokeWidth={1.2} strokeOpacity={0.6} />
              );
            })}
            <path
              d={`M${x} ${top + len}c-9 6-11 18-5 25 4 4 7 4 10 0 6-7 4-19-5-25z`}
              transform={`translate(0 2)`}
              fill="#f5c7a7"
              stroke={INK}
              strokeWidth={1.2}
              strokeOpacity={0.6}
            />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * The flower bed along the whole bottom: greenery fanned upward, eucalyptus rising at the
 * corners, a back row of smaller roses and a front row of fuller ones. It is fuller and taller
 * at the corners and dips in the middle, so the date and venue above it stay clear.
 */
function FlowerBed() {
  const bed = useMemo(() => {
    const rand = rng(303);
    const tones: Tone[] = ['pink', 'coral', 'peach', 'pink', 'peach', 'coral'];
    // how tall the bed is at x: 1 at the corners, about 0.4 in the middle
    const lift = (x: number) => 1 - 0.6 * Math.sin(Math.PI * Math.min(1, Math.max(0, x / VW)));
    const H = (x: number) => 80 + 190 * lift(x);
    const leaves = [];
    for (let x = -30; x <= VW + 30; x += 30) {
      leaves.push({
        x: q(x + (rand() - 0.5) * 16),
        y: q(VH + 10 - H(x) * (0.35 + rand() * 0.25)),
        a: q(-90 + (rand() - 0.5) * 120),
        len: q(70 + rand() * 50 + lift(x) * 30),
      });
    }
    const back = [];
    for (let x = 20; x <= VW; x += 92) {
      const xx = x + (rand() - 0.5) * 30;
      back.push({ x: q(xx), y: q(VH - H(xx) * 0.68), r: q(24 + lift(xx) * 20 + rand() * 6), tone: tones[back.length % 6], seed: 400 + back.length, rot: q(rand() * 360) });
    }
    const buds = [];
    for (let x = 64; x <= VW; x += 128) {
      const xx = x + (rand() - 0.5) * 40;
      buds.push({ x: q(xx), y: q(VH - H(xx) * 0.5), r: q(14 + rand() * 6), seed: 500 + buds.length, rot: q(rand() * 360) });
    }
    const front = [];
    for (let x = 0; x <= VW + 20; x += 118) {
      const xx = x + (rand() - 0.5) * 30;
      front.push({ x: q(xx), y: q(VH + 8 - H(xx) * 0.3), r: q(36 + lift(xx) * 26 + rand() * 8), tone: tones[(front.length + 2) % 6], seed: 600 + front.length, rot: q(rand() * 360) });
    }
    return { leaves, back, buds, front };
  }, []);
  return (
    <g>
      {/* eucalyptus rising up the sides from the corners */}
      <Trail a={[40, 2240]} b={[30, 1930]} bend={-20} n={8} r={17} />
      <Trail a={[110, 2230]} b={[150, 2000]} bend={18} n={6} r={14} />
      <Trail a={[VW - 40, 2240]} b={[VW - 30, 1930]} bend={20} n={8} r={17} />
      <Trail a={[VW - 110, 2230]} b={[VW - 150, 2000]} bend={-18} n={6} r={14} />
      {bed.leaves.map((l, i) => (
        <Leaf key={i} x={l.x} y={l.y} len={l.len} a={l.a} />
      ))}
      {bed.back.map((r, i) => (
        <Rose key={i} x={r.x} y={r.y} r={r.r} tone={r.tone} seed={r.seed} rot={r.rot} />
      ))}
      {bed.buds.map((b, i) => (
        <Rose key={i} x={b.x} y={b.y} r={b.r} tone="peach" seed={b.seed} rot={b.rot} />
      ))}
      {bed.front.map((r, i) => (
        <Rose key={i} x={r.x} y={r.y} r={r.r} tone={r.tone} seed={r.seed} rot={r.rot} />
      ))}
    </g>
  );
}

function Bottom() {
  return (
    <svg className="layer layer-bottom" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <FlowerBed />
    </svg>
  );
}

function TieBack() {
  return (
    <g>
      <Trail a={[110, 1050]} b={[78, 1290]} bend={-16} n={7} r={15} />
      <Foliage cx={100} cy={1010} n={12} r0={70} r1={170} len={66} seed={21} />
      <Rose x={78} y={892} r={30} tone="peach" seed={31} />
      <Rose x={124} y={950} r={36} tone="pink" seed={32} rot={30} />
      <Rose x={92} y={1018} r={46} tone="pink" seed={33} />
      <Rose x={136} y={1080} r={36} tone="coral" seed={34} rot={-20} />
      <Rose x={70} y={1124} r={30} tone="pink" seed={35} />
    </g>
  );
}

/** One curtain. Its fabric paths are rebuilt each frame while it sways after a tap. */
function Curtain({ side }: { side: 'left' | 'right' }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const strips = useRef<(SVGPathElement | null)[]>([]);
  const folds = useRef<(SVGPathElement | null)[]>([]);
  const valleys = useRef<(SVGPathElement | null)[]>([]);
  const glows = useRef<(SVGPathElement | null)[]>([]);
  const crests = useRef<(SVGPathElement | null)[]>([]);
  const clip = useRef<SVGPathElement>(null);
  const edges = useRef<SVGPathElement>(null);
  const hem = useRef<SVGPathElement>(null);
  const sheer = useRef<SVGPathElement>(null);
  const tie = useRef<SVGGElement>(null);
  const base = useMemo(() => curtainShape(), []);
  const clipId = `a-clip-${side}`;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const seed = side === 'left' ? 0 : 2.1; // the two curtains never move in lockstep
    const tap = new Tap();
    let t = 0;
    let last = 0;
    let raf: number | null = null;
    let visible = true;

    // All motion is in the curtain's own drawing space; the right curtain is drawn mirrored,
    // so "negative x" is outward for both.
    const d: Disp = (y, k) => {
      const free = freedom(y);
      return tap.at(y) + free * breeze(y, k, t, seed);
    };
    const apply = () => {
      const s = curtainShape(d);
      s.strips.forEach((p, i) => strips.current[i]?.setAttribute('d', p));
      s.folds.forEach((p, i) => {
        folds.current[i]?.setAttribute('d', p);
        valleys.current[i]?.setAttribute('d', p);
      });
      s.crests.forEach((p, i) => {
        glows.current[i]?.setAttribute('d', p);
        crests.current[i]?.setAttribute('d', p);
      });
      clip.current?.setAttribute('d', s.outline);
      edges.current?.setAttribute('d', s.edges);
      hem.current?.setAttribute('d', s.hem);
      sheer.current?.setAttribute('d', s.hem);
      tie.current?.setAttribute('transform', `translate(${d(CURTAIN.tie, 0.5).toFixed(1)} 0)`);
    };
    let lastDraw = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
      last = now;
      t += dt;
      tap.advance(dt);
      // Redrawing the cloth is the expensive part. A tap ripple is drawn every frame so it
      // stays crisp; the slow breeze looks the same at ~30fps; and while the visitor is
      // scrolling through the zoom the curtains rush past, so the breeze rests there.
      const zooming = window.scrollY > 24;
      if (tap.active || (!zooming && now - lastDraw >= 32)) {
        apply();
        lastDraw = now;
      }
      raf = visible && !document.hidden ? requestAnimationFrame(frame) : null;
    };
    const start = () => {
      if (raf === null && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    // only animate while the curtain is on screen and the tab is open
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    });
    io.observe(svg);
    document.addEventListener('visibilitychange', start);

    const onTap = (e: MouseEvent) => {
      const r = svg.getBoundingClientRect();
      tap.kick(((e.clientY - r.top) / r.height) * VH, -520);
      start();
    };
    const fabric = svg.querySelector('.fabric');
    fabric?.addEventListener('click', onTap as EventListener);
    start();
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', start);
      fabric?.removeEventListener('click', onTap as EventListener);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [side]);

  return (
    <svg ref={svgRef} className={`layer layer-${side}`} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path ref={clip} d={base.outline} />
        </clipPath>
      </defs>
      <g transform={side === 'right' ? `translate(${VW} 0) scale(-1 1)` : undefined}>
        <g className="fabric">
          {/* the fold panels */}
          {base.strips.map((d, i) => (
            <path key={i} ref={(el) => { strips.current[i] = el; }} d={d} fill={`url(#a-fab${i % 3})`} />
          ))}
          {/* everything below stays inside the curtain's shape and moves with it */}
          <g clipPath={`url(#${clipId})`} style={{ pointerEvents: 'none' }}>
            {/* deep shadow in each valley between folds */}
            {base.folds.map((d, i) => (
              <path key={i} ref={(el) => { valleys.current[i] = el; }} d={d} fill="none" stroke="#7a2f28" strokeWidth={16} strokeOpacity={0.12} strokeLinecap="round" />
            ))}
            {/* satin sheen along each ridge: a soft wide glow and a bright core */}
            {base.crests.map((d, i) => (
              <path key={i} ref={(el) => { glows.current[i] = el; }} d={d} fill="none" stroke="#fff6ef" strokeWidth={14} strokeOpacity={0.14} strokeLinecap="round" />
            ))}
            {base.crests.map((d, i) => (
              <path key={i} ref={(el) => { crests.current[i] = el; }} d={d} fill="none" stroke="#fffaf6" strokeWidth={3} strokeOpacity={0.4} strokeLinecap="round" />
            ))}
            {/* the cloth itself: woven threads and fine speckle */}
            <rect x={-100} y={0} width={700} height={VH} fill="url(#a-weave)" />
            <rect x={-100} y={0} width={700} height={VH} fill="url(#a-speckle)" />
            {/* light falls from above and the upper left: shade under the rod, at the
                gathered tie-back, and along the outer edge */}
            <rect x={-100} y={0} width={700} height={VH} fill="url(#a-curShade)" opacity={0.8} />
            <rect x={-100} y={0} width={700} height={VH} fill="url(#a-edgeShade)" />
            {/* the hem is thinner, so it glows a little: a sheer band along the bottom */}
            <path ref={sheer} d={base.hem} fill="none" stroke="#fff4ee" strokeWidth={40} strokeOpacity={0.16} strokeLinejoin="round" />
          </g>
          {base.folds.map((d, i) => (
            <path key={i} ref={(el) => { folds.current[i] = el; }} d={d} fill="none" stroke={INK} strokeWidth={1.6} strokeOpacity={0.36} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
          ))}
          <path ref={edges} d={base.edges} fill="none" stroke={INK} strokeWidth={3} strokeOpacity={0.75} strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
          <path ref={hem} d={base.hem} fill="none" stroke={INK} strokeWidth={2.6} strokeOpacity={0.7} style={{ pointerEvents: 'none' }} />
        </g>
        <g ref={tie}>
          <TieBack />
        </g>
      </g>
    </svg>
  );
}

function Swag({ x0, x1, depth, bands }: { x0: number; x1: number; depth: number; bands: number }) {
  const s = useMemo(() => swagShape(x0, x1, 44, depth, bands), [x0, x1, depth, bands]);
  const id = `a-swagclip-${x0}`;
  return (
    <g>
      <clipPath id={id}>
        {s.bands.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </clipPath>
      {s.bands.map((d, i) => (
        <path key={i} d={d} fill={i % 2 ? 'url(#a-swagB)' : 'url(#a-swagA)'} />
      ))}
      <g clipPath={`url(#${id})`}>
        {s.folds.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#7a2f28" strokeWidth={14} strokeOpacity={0.1} />
        ))}
        <rect x={x0} y={0} width={x1 - x0} height={depth + 80} fill="url(#a-weave)" />
        <rect x={x0} y={0} width={x1 - x0} height={depth + 80} fill="url(#a-speckle)" />
      </g>
      {s.folds.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={INK} strokeWidth={1.8} strokeOpacity={0.4} strokeLinecap="round" />
      ))}
      <path d={s.hem} fill="none" stroke={INK} strokeWidth={2.8} strokeOpacity={0.75} strokeLinecap="round" />
    </g>
  );
}

/** A swag's tail falling where it wraps the rod. */
function Tail({ x, dir }: { x: number; dir: 1 | -1 }) {
  const d = `M${x} 44C${x - 26 * dir} 150 ${x - 58 * dir} 290 ${x - 42 * dir} 420Q${x - 12 * dir} 446 ${x + 22 * dir} 414C${x + 10 * dir} 300 ${x + 26 * dir} 150 ${x + 60 * dir} 44Z`;
  const fold = `M${x + 12 * dir} 60C${x - 4 * dir} 180 ${x - 22 * dir} 300 ${x - 14 * dir} 420`;
  return (
    <g>
      <path d={d} fill="url(#a-swagB)" stroke={INK} strokeWidth={2.4} strokeOpacity={0.7} strokeLinejoin="round" />
      <path d={fold} fill="none" stroke={INK} strokeWidth={1.6} strokeOpacity={0.4} />
    </g>
  );
}

function Top() {
  return (
    <svg className="layer layer-top" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x={-20} y={10} width={VW + 40} height={34} rx={14} fill="url(#a-wood)" stroke={INK} strokeWidth={2.4} strokeOpacity={0.75} />
      <path d={`M0 22H${VW}`} stroke="#e0bfa8" strokeWidth={3} strokeOpacity={0.5} />
      <Tail x={300} dir={1} />
      <Tail x={1340} dir={-1} />
      <Swag x0={300} x1={880} depth={250} bands={4} />
      <Swag x0={540} x1={1340} depth={330} bands={5} />
      {/* the rose cluster where the swag meets the rod */}
      <Trail a={[120, 300]} b={[64, 780]} bend={-34} n={13} r={19} />
      <Trail a={[210, 320]} b={[214, 610]} bend={26} n={7} r={16} />
      <Foliage cx={230} cy={170} n={22} r0={160} r1={330} len={88} seed={7} />
      <Leaf x={420} y={70} len={80} a={-20} />
      <Leaf x={470} y={96} len={70} a={20} />
      <Leaf x={380} y={140} len={66} a={50} />
      <Rose x={400} y={70} r={40} tone="peach" seed={1} />
      <Rose x={250} y={58} r={56} tone="coral" seed={2} rot={15} />
      <Rose x={112} y={94} r={64} tone="pink" seed={3} />
      <Rose x={330} y={172} r={50} tone="pink" seed={4} rot={-25} />
      <Rose x={170} y={176} r={42} tone="peach" seed={5} />
      <Rose x={78} y={246} r={50} tone="pink" seed={6} rot={40} />
      <Rose x={208} y={262} r={46} tone="coral" seed={8} />
    </svg>
  );
}

export default function ArchArt() {
  return (
    <>
      <Defs />
      <Wall />
      <Beads />
      <Curtain side="left" />
      <Curtain side="right" />
      {/* the flower bed stands in front of the curtain hems */}
      <Bottom />
      <Top />
    </>
  );
}
