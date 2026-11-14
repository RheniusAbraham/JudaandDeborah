'use client';

// A church-window arch dressed like an altar arch: an ink outline that draws itself, a warm
// glow inside, and roses and leaves climbing its sides from a full base at each foot.
// Drawing space: w x 1000, the arch's posts at x = 40 and x = w - 40, its crown at y = 40.
// Classes the scenes animate: .window-line (draw), .window-glow (fade), .af-leaf / .af-rose (grow).

import { useMemo } from 'react';
import { rng } from '@/lib/arch/geom';
import { Rose, Leaf } from './ArchArt';

const INK = '#5a2f2a';
const r0 = (n: number) => Math.round(n);
type Tone = 'pink' | 'coral' | 'peach';

function Flowers({ w, leftTop, rightTop, seed }: { w: number; leftTop: number; rightTop: number; seed: number }) {
  const { leaves, roses } = useMemo(() => {
    const rand = rng(seed);
    const k = w / 600; // flowers keep the same size relative to the arch
    const tones: Tone[] = ['pink', 'peach', 'coral', 'pink', 'peach'];
    const leaves: { x: number; y: number; a: number; len: number }[] = [];
    const roses: { x: number; y: number; r: number; tone: Tone; seed: number; rot: number }[] = [];
    const sides = [
      { x: 40, top: leftTop, dir: -1 },
      { x: w - 40, top: rightTop, dir: 1 },
    ];
    for (const s of sides) {
      let i = 0;
      for (let y = 1010; y >= s.top; y -= 30 * k, i++) {
        const t = (1010 - y) / (1010 - s.top);
        const out = i % 2 === 0;
        leaves.push({
          x: r0(s.x + (rand() - 0.5) * 16 * k),
          y: r0(y),
          a: r0(out ? (s.dir < 0 ? -150 : -30) + (rand() - 0.5) * 30 : (s.dir < 0 ? -40 : -140) + (rand() - 0.5) * 30),
          len: r0((58 - t * 26 + rand() * 10) * k),
        });
      }
      i = 0;
      for (let y = 980; y >= s.top + 30; y -= 64 * k, i++) {
        const t = (1010 - y) / (1010 - s.top);
        roses.push({
          x: r0(s.x + (i % 2 ? 14 : -14) * (0.6 + rand() * 0.6) * k),
          y: r0(y),
          r: r0((36 - t * 20 + rand() * 6) * k),
          tone: tones[(i + (s.dir > 0 ? 2 : 0)) % tones.length],
          seed: seed + 100 + i + (s.dir > 0 ? 50 : 0),
          rot: r0(rand() * 360),
        });
      }
      // a full base at each foot, spilling a little inward and outward
      [
        { dx: 36 * s.dir, dy: 1000, r: 48 },
        { dx: -34 * s.dir, dy: 1012, r: 40 },
        { dx: 80 * s.dir, dy: 1016, r: 34 },
        { dx: 6, dy: 950, r: 34 },
      ].forEach((b, j) => {
        const x = r0(s.x + b.dx * k);
        roses.push({ x, y: b.dy, r: r0(b.r * k), tone: tones[(j + 1) % tones.length], seed: seed + 200 + j + (s.dir > 0 ? 50 : 0), rot: r0(rand() * 360) });
        leaves.push({ x: r0(x + 20 * k), y: b.dy - 10, a: -60 - j * 30, len: r0(60 * k) });
        leaves.push({ x: r0(x - 20 * k), y: b.dy - 6, a: -120 + j * 20, len: r0(54 * k) });
      });
    }
    // bottom first, so a stagger grows them from the ground up
    leaves.sort((p, q) => q.y - p.y);
    roses.sort((p, q) => q.y - p.y);
    return { leaves, roses };
  }, [w, leftTop, rightTop, seed]);

  return (
    <g>
      {leaves.map((l, i) => (
        <g key={i} className="af af-leaf">
          <Leaf x={l.x} y={l.y} len={l.len} a={l.a} />
        </g>
      ))}
      {roses.map((r, i) => (
        <g key={i} className="af af-rose">
          <Rose x={r.x} y={r.y} r={r.r} tone={r.tone} seed={r.seed} rot={r.rot} />
        </g>
      ))}
    </g>
  );
}

export default function FloralArch({
  id,
  w = 600,
  leftTop,
  rightTop,
  seed,
}: {
  id: string;
  w?: number;
  leftTop: number;
  rightTop: number;
  seed: number;
}) {
  const R = (w - 80) / 2;
  const spring = R + 40;
  const outline = `M40 1000V${spring}A${R} ${R} 0 0 1 ${w - 40} ${spring}V1000`;
  const inner = `M64 1000V${spring + 2}A${R - 24} ${R - 24} 0 0 1 ${w - 64} ${spring + 2}V1000`;
  return (
    <svg viewBox={`0 0 ${w} 1000`} preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-glow`} cx=".5" cy=".42" r=".6">
          <stop offset="0" stopColor="#fff6ec" />
          <stop offset=".6" stopColor="#fde4d3" stopOpacity=".85" />
          <stop offset="1" stopColor="#fbd6c2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="window-glow" d={`${outline}Z`} fill={`url(#${id}-glow)`} />
      <path className="window-line" pathLength={1} strokeDasharray="1" d={outline} fill="none" stroke={INK} strokeOpacity={0.45} strokeWidth={2.4} />
      <path className="window-line" pathLength={1} strokeDasharray="1" d={inner} fill="none" stroke="#c98b6f" strokeOpacity={0.5} strokeWidth={1.4} />
      <Flowers w={w} leftTop={leftTop} rightTop={rightTop} seed={seed} />
    </svg>
  );
}
