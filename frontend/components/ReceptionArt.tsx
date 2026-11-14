'use client';

// The reception hall, drawn in layers that share one 1600 x 1400 space (each layer fills the
// screen with "slice", so they stay aligned while the scene moves them at different speeds):
//   wall    pleated drapes, a valance of swags with rosettes, the polished floor
//   arch    a round arch of roses behind the head table, two gold chairs, the dressed table
//   lights  three chandeliers
//   strings strings of fairy lights
//   front   guest tables in the near corners
// Classes the scene animates: .bulb-glow, .chandelier-glow, .flame-c, .floor-glow.

import { useMemo, type ReactNode } from 'react';
import { rng } from '@/lib/arch/geom';
import { Rose, Leaf } from './ArchArt';
import couple2 from '@/assets/couple2.webp';

const INK = '#5a2f2a';
const W = 1600;
const H = 1400;
const r0 = (n: number) => Math.round(n);

function Layer({ name, children }: { name: string; children: ReactNode }) {
  return (
    <svg className={`rlayer rl-${name}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {children}
    </svg>
  );
}

export function ReceptionDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="re-wall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f2d0be" />
          <stop offset="1" stopColor="#e7b8a1" />
        </linearGradient>
        <linearGradient id="re-pleatA" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#e9b7a0" />
          <stop offset=".45" stopColor="#fbe4d7" />
          <stop offset="1" stopColor="#e6ae96" />
        </linearGradient>
        <linearGradient id="re-pleatB" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#e3a98f" />
          <stop offset=".5" stopColor="#f6d3c2" />
          <stop offset="1" stopColor="#dfa289" />
        </linearGradient>
        <linearGradient id="re-swag" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e9a690" />
          <stop offset=".6" stopColor="#f8cfbf" />
          <stop offset="1" stopColor="#e39c86" />
        </linearGradient>
        <linearGradient id="re-floor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e2b19b" />
          <stop offset="1" stopColor="#cf9a82" />
        </linearGradient>
        <radialGradient id="re-warm">
          <stop offset="0" stopColor="#fff2cf" stopOpacity=".85" />
          <stop offset=".45" stopColor="#ffe0a3" stopOpacity=".35" />
          <stop offset="1" stopColor="#ffe0a3" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="re-bulb">
          <stop offset="0" stopColor="#fff6d6" stopOpacity="1" />
          <stop offset=".35" stopColor="#ffe39a" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffe39a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="re-flame" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffb547" />
          <stop offset=".6" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#ff9a3c" />
        </linearGradient>
        <linearGradient id="re-gold" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#a8783e" />
          <stop offset=".45" stopColor="#f0cf8c" />
          <stop offset="1" stopColor="#9a6c35" />
        </linearGradient>
        <linearGradient id="re-cloth" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#efe2d8" />
          <stop offset=".5" stopColor="#fffaf5" />
          <stop offset="1" stopColor="#eadbd0" />
        </linearGradient>
        <radialGradient id="re-sheer">
          <stop offset="0" stopColor="#fffaf2" stopOpacity=".9" />
          <stop offset="1" stopColor="#fde7d8" stopOpacity=".3" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ wall */

function Wall() {
  const pleats = useMemo(() => {
    const out: { d: string; i: number }[] = [];
    for (let x = -20, i = 0; x < W + 40; x += 46, i++) {
      const w = 46;
      out.push({
        i,
        d: `M${x} 150C${x + 6} 600 ${x - 6} 900 ${x} 1190L${x + w} 1190C${x + w - 6} 900 ${x + w + 6} 600 ${x + w} 150Z`,
      });
    }
    return out;
  }, []);
  const swags = Array.from({ length: 9 }, (_, i) => -100 + i * 200);
  return (
    <Layer name="wall">
      <rect width={W} height={H} fill="url(#re-wall)" />
      {pleats.map((p) => (
        <path key={p.i} d={p.d} fill={p.i % 2 ? 'url(#re-pleatB)' : 'url(#re-pleatA)'} />
      ))}
      {pleats.map((p) => (
        <path key={`l${p.i}`} d={`M${-20 + p.i * 46} 150C${-14 + p.i * 46} 600 ${-26 + p.i * 46} 900 ${-20 + p.i * 46} 1190`} fill="none" stroke={INK} strokeOpacity={0.14} strokeWidth={1.6} />
      ))}
      {/* valance: a row of swags with rosettes where they meet */}
      <rect x={0} y={0} width={W} height={60} fill="#e8b39d" />
      {swags.map((x) => (
        <g key={x}>
          <path d={`M${x} 52Q${x + 100} 210 ${x + 200} 52Z`} fill="url(#re-swag)" stroke={INK} strokeOpacity={0.35} strokeWidth={1.6} />
          <path d={`M${x + 18} 70Q${x + 100} 170 ${x + 182} 70`} fill="none" stroke={INK} strokeOpacity={0.18} strokeWidth={1.4} />
          <path d={`M${x + 34} 80Q${x + 100} 140 ${x + 166} 80`} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={2} />
        </g>
      ))}
      {swags.map((x) => (
        <Rose key={`r${x}`} x={x} y={60} r={22} tone={x % 400 === 100 ? 'peach' : 'pink'} seed={700 + x} />
      ))}
      {/* the polished floor, with the dance floor's glow */}
      <rect x={0} y={1180} width={W} height={H - 1180} fill="url(#re-floor)" />
      <path d={`M0 1180H${W}`} stroke={INK} strokeOpacity={0.3} strokeWidth={2} />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${800 + (i - 4) * 60} 1180L${800 + (i - 4) * 260} ${H}`} stroke={INK} strokeOpacity={0.07} strokeWidth={1.4} />
      ))}
      <ellipse className="floor-glow" cx={800} cy={1290} rx={520} ry={90} fill="url(#re-warm)" opacity={0} />
    </Layer>
  );
}

/* ------------------------------------------------------------------ arch + table */

function RoseArch() {
  const cx = 800, cy = 760, R = 300;
  const items = useMemo(() => {
    const rand = rng(808);
    const tones = ['pink', 'peach', 'coral', 'pink', 'peach'] as const;
    const leaves = Array.from({ length: 46 }, (_, i) => {
      const a = Math.PI * (0.92 + (i / 45) * 1.16);
      const rr = R + (rand() - 0.5) * 50;
      return { x: r0(cx + Math.cos(a) * rr), y: r0(cy + Math.sin(a) * rr), a: r0((a * 180) / Math.PI + (rand() > 0.5 ? 60 : -60)), len: r0(50 + rand() * 30) };
    });
    const roses = Array.from({ length: 24 }, (_, i) => {
      const a = Math.PI * (0.95 + (i / 23) * 1.1);
      const rr = R + (rand() - 0.5) * 34;
      return { x: r0(cx + Math.cos(a) * rr), y: r0(cy + Math.sin(a) * rr), r: r0(24 + rand() * 18), tone: tones[i % 5], seed: 820 + i, rot: r0(rand() * 360) };
    });
    return { leaves, roses };
  }, []);
  return (
    <g className="rose-arch">
      <circle cx={cx} cy={cy} r={R - 20} fill="url(#re-sheer)" />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#8a6a52" strokeOpacity={0.5} strokeWidth={10} />
      {items.leaves.map((l, i) => (
        <Leaf key={i} x={l.x} y={l.y} len={l.len} a={l.a} />
      ))}
      {items.roses.map((r, i) => (
        <Rose key={i} x={r.x} y={r.y} r={r.r} tone={r.tone} seed={r.seed} rot={r.rot} />
      ))}
    </g>
  );
}

function Candlestick({ x, h }: { x: number; h: number }) {
  const base = 962;
  return (
    <g>
      <ellipse className="candle-glow" cx={x} cy={base - h - 22} rx={46} ry={46} fill="url(#re-warm)" opacity={0} />
      <path d={`M${x - 18} ${base}h36l-10 -12h-16z`} fill="url(#re-gold)" stroke={INK} strokeOpacity={0.5} strokeWidth={1.2} />
      <rect x={x - 4} y={base - h} width={8} height={h - 10} fill="url(#re-gold)" />
      <circle cx={x} cy={base - h * 0.55} r={7} fill="url(#re-gold)" />
      <rect x={x - 7} y={base - h - 40} width={14} height={40} rx={3} fill="#fff8ec" stroke={INK} strokeOpacity={0.35} strokeWidth={1} />
      <path className="flame-c" d={`M${x} ${base - h - 62}c6 9 7 16 0 21c-7 -5 -6 -12 0 -21z`} fill="url(#re-flame)" opacity={0.25} />
    </g>
  );
}

/** The couple in their reception clothes, standing in the rose arch behind the head table
 *  (the table hides where the illustration is cut off at the knee). */
function Couple() {
  const h = 590;
  const w = Math.round((h * 1282) / 1657);
  return (
    <g className="r-couple">
      <ellipse cx={800} cy={985} rx={240} ry={26} fill={INK} fillOpacity={0.12} />
      <image href={couple2.src} x={800 - w / 2} y={420} width={w} height={h} preserveAspectRatio="xMidYMax meet" />
    </g>
  );
}

function HeadTable() {
  const pleats = Array.from({ length: 16 }, (_, i) => 410 + i * 48.75);
  return (
    <g>
      {/* the cloth, falling in soft pleats to the floor */}
      <rect x={410} y={978} width={780} height={222} fill="url(#re-cloth)" />
      {pleats.map((x, i) => (
        <path key={i} d={`M${r0(x)} 990C${r0(x + 6)} 1080 ${r0(x - 6)} 1150 ${r0(x)} 1200`} stroke={INK} strokeOpacity={0.1} strokeWidth={1.6} fill="none" />
      ))}
      <rect x={400} y={962} width={800} height={22} rx={4} fill="#fffaf5" stroke={INK} strokeOpacity={0.35} strokeWidth={1.6} />
      {/* blush runner swags across the front, a rose cluster at each gather */}
      {[400, 600, 800, 1000].map((x) => (
        <path key={x} d={`M${x} 990Q${x + 100} 1080 ${x + 200} 990`} fill="none" stroke="#efa594" strokeWidth={14} strokeLinecap="round" />
      ))}
      {[400, 600, 800, 1000, 1200].map((x, i) => (
        <g key={x}>
          <Leaf x={x - 10} y={994} len={38} a={150} />
          <Leaf x={x + 10} y={994} len={38} a={30} />
          <Rose x={x} y={992} r={16} tone={i % 2 ? 'peach' : 'pink'} seed={860 + i} />
        </g>
      ))}
      {/* low flowers along the table and tall candles */}
      {[500, 640, 800, 960, 1100].map((x, i) => (
        <g key={x}>
          <Leaf x={x - 20} y={958} len={40} a={-160} />
          <Leaf x={x + 20} y={958} len={40} a={-20} />
          <Rose x={x} y={944} r={i === 2 ? 30 : 20} tone={['pink', 'peach', 'coral', 'peach', 'pink'][i] as 'pink'} seed={870 + i} />
        </g>
      ))}
      <Candlestick x={570} h={110} />
      <Candlestick x={700} h={150} />
      <Candlestick x={900} h={150} />
      <Candlestick x={1030} h={110} />
    </g>
  );
}

/* ------------------------------------------------------------------ chandeliers */

function Chandelier({ cx, top, s }: { cx: number; top: number; s: number }) {
  const arm = (dx: number, dy: number) =>
    `M${cx} ${top + 70 * s}C${cx + dx * 0.3} ${top + (70 + dy) * s} ${cx + dx * 0.8} ${top + (90 + dy) * s} ${cx + dx} ${top + (70 + dy) * s}`;
  const tips = [-1, -0.55, 0.55, 1].map((k) => ({ dx: k * 130 * s, dy: Math.abs(k) > 0.8 ? 40 : 66 }));
  return (
    <g>
      <circle className="chandelier-glow" cx={cx} cy={top + 110 * s} r={260 * s} fill="url(#re-warm)" opacity={0} />
      <path d={`M${cx} -20V${top + 20 * s}`} stroke="#8a6a3a" strokeWidth={3 * s} />
      <path d={`M${cx - 14 * s} ${top + 20 * s}h${28 * s}l${-6 * s} ${50 * s}h${-16 * s}z`} fill="url(#re-gold)" stroke={INK} strokeOpacity={0.5} strokeWidth={1.2} />
      {tips.map((t, i) => (
        <path key={i} d={arm(t.dx, t.dy)} fill="none" stroke="url(#re-gold)" strokeWidth={6 * s} strokeLinecap="round" />
      ))}
      {tips.map((t, i) => {
        const x = cx + t.dx;
        const y = top + (70 + t.dy) * s;
        return (
          <g key={`c${i}`}>
            <path d={`M${x - 12 * s} ${y}h${24 * s}l${-4 * s} ${8 * s}h${-16 * s}z`} fill="url(#re-gold)" />
            <rect x={x - 5 * s} y={y - 26 * s} width={10 * s} height={26 * s} rx={2} fill="#fff8ec" />
            <path className="flame-c" d={`M${x} ${y - 42 * s}c${5 * s} ${7 * s} ${6 * s} ${12 * s} 0 ${16 * s}c${-6 * s} ${-4 * s} ${-5 * s} ${-9 * s} 0 ${-16 * s}z`} fill="url(#re-flame)" opacity={0.25} />
            {[1, 2, 3].map((k) => (
              <path key={k} d={`M${x} ${y + 10 * s + k * 14 * s}c${3 * s} ${4 * s} ${3 * s} ${8 * s} 0 ${10 * s}c${-3 * s} ${-2 * s} ${-3 * s} ${-6 * s} 0 ${-10 * s}z`} fill="#ffffff" fillOpacity={0.7} stroke={INK} strokeOpacity={0.3} strokeWidth={0.8} />
            ))}
          </g>
        );
      })}
      {/* crystal drops hanging from the center */}
      {[-30, -10, 10, 30].map((dx, i) => (
        <path key={dx} d={`M${cx + dx * s} ${top + (96 + (i % 2) * 18) * s}c${4 * s} ${6 * s} ${4 * s} ${11 * s} 0 ${14 * s}c${-4 * s} ${-3 * s} ${-4 * s} ${-8 * s} 0 ${-14 * s}z`} fill="#ffffff" fillOpacity={0.75} stroke={INK} strokeOpacity={0.3} strokeWidth={0.8} />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ fairy lights */

/**
 * Fairy lights swagged along the two sides of the room only, framing the scene; nothing crosses
 * the middle, where the heading and the couple are.
 */
function Strings() {
  const strings = useMemo(() => {
    // [x0, y0, x1, y1, sag] for each swag; the right side mirrors the left
    const left: [number, number, number, number, number][] = [
      [-80, 70, 520, 150, 200],
      [-80, 230, 400, 300, 150],
    ];
    const swags = [...left, ...left.map(([a, b, c, d, s]) => [W - a, b, W - c, d, s] as [number, number, number, number, number])];
    return swags.map(([x0, y0, x1, y1, sag], k) => {
      const at = (t: number): [number, number] => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + sag * Math.sin(Math.PI * t)];
      const pts: string[] = [];
      for (let i = 0; i <= 40; i++) {
        const [x, y] = at(i / 40);
        pts.push(`${r0(x)} ${r0(y)}`);
      }
      const n = Math.max(6, Math.round(Math.abs(x1 - x0) / 46));
      const bulbs = Array.from({ length: n }, (_, i) => {
        const [x, y] = at((i + 0.5 + (k % 2) * 0.25) / (n + 0.25));
        return { x: r0(x), y: r0(y) + 8 };
      });
      return { d: 'M' + pts.join('L'), bulbs };
    });
  }, []);
  return (
    <Layer name="strings">
      {strings.map((s, k) => (
        <g key={k}>
          <path d={s.d} fill="none" stroke="#7a5a44" strokeOpacity={0.55} strokeWidth={1.6} />
          {s.bulbs.map((b, i) => (
            <g key={i}>
              <circle className="bulb-glow" cx={b.x} cy={b.y} r={20} fill="url(#re-bulb)" opacity={0} />
              <circle cx={b.x} cy={b.y} r={5.5} fill="#fff1c4" stroke={INK} strokeOpacity={0.35} strokeWidth={1} />
            </g>
          ))}
        </g>
      ))}
    </Layer>
  );
}

/* ------------------------------------------------------------------ guest tables (front) */

function GuestTable({ cx }: { cx: number }) {
  return (
    <g>
      <path d={`M${cx - 300} 1260Q${cx} 1300 ${cx + 300} 1260L${cx + 320} ${H + 20}H${cx - 320}Z`} fill="url(#re-cloth)" stroke={INK} strokeOpacity={0.3} strokeWidth={1.6} />
      <ellipse cx={cx} cy={1258} rx={300} ry={58} fill="#fffaf5" stroke={INK} strokeOpacity={0.3} strokeWidth={1.6} />
      {[-200, -100, 0, 100, 200].map((dx) => (
        <path key={dx} d={`M${cx + dx} 1300C${cx + dx + 8} 1340 ${cx + dx - 8} 1380 ${cx + dx} ${H}`} stroke={INK} strokeOpacity={0.08} strokeWidth={1.6} fill="none" />
      ))}
      <Leaf x={cx - 30} y={1240} len={50} a={-160} />
      <Leaf x={cx + 30} y={1240} len={50} a={-20} />
      <Rose x={cx - 14} y={1226} r={26} tone="pink" seed={cx} />
      <Rose x={cx + 22} y={1232} r={20} tone="peach" seed={cx + 1} />
      <ellipse className="candle-glow" cx={cx + 90} cy={1190} rx={60} ry={60} fill="url(#re-warm)" opacity={0} />
      <rect x={cx + 82} y={1196} width={16} height={46} rx={3} fill="#fff8ec" stroke={INK} strokeOpacity={0.35} strokeWidth={1} />
      <path className="flame-c" d={`M${cx + 90} 1174c6 9 7 16 0 21c-7 -5 -6 -12 0 -21z`} fill="url(#re-flame)" opacity={0.25} />
    </g>
  );
}

export function ReceptionLayers() {
  return (
    <>
      <Wall />
      {/* the lights hang behind the arch and the couple */}
      <Strings />
      <Layer name="arch">
        <RoseArch />
        <Couple />
        <HeadTable />
      </Layer>
      <Layer name="lights">
        <Chandelier cx={800} top={150} s={1.15} />
        <Chandelier cx={300} top={110} s={0.85} />
        <Chandelier cx={1300} top={110} s={0.85} />
      </Layer>
      <Layer name="front">
        <GuestTable cx={120} />
        <GuestTable cx={1480} />
      </Layer>
    </>
  );
}
