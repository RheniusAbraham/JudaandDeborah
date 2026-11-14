'use client';

// A Gothic church, drawn in the same hand as the arch. Built from individually laid stone
// blocks (each with its own tone, a lit top edge and a shadow beneath), with side aisles under
// tiled roofs, buttresses and pinnacles, a tall tower and tiled spire, a traceried rose window,
// pointed stained-glass windows, and a deep doorway of receding carved arches.
//
// Parts the scene animates carry class names:
//   .door-l / .door-r (swing open), .bell (swings), .win-glow (glass lights up), .rays (light spills out).
//
// Drawing space: x 0..1400, y -230..1540 (ground at 1500).

import { useMemo, type ReactElement } from 'react';
import { rng } from '@/lib/arch/geom';
import { Rose, Leaf } from './ArchArt';

const INK = '#5a2f2a';
const STONE = ['#f8e0d1', '#f4d5c3', '#efcbb7', '#f6dacb', '#ebc6b1', '#f2d0bd'];
const GLASS = ['#e46f86', '#f4c46e', '#8fa8c8', '#f2a493', '#a9c3b2', '#c96b8a'];

const r0 = (n: number) => Math.round(n);

/** A two-centered (pointed) Gothic arch opening. */
function pointed(cx: number, w: number, spring: number, bottom: number) {
  const R = w * 0.82;
  const left = cx - w / 2;
  const right = cx + w / 2;
  const apex = spring - Math.sqrt(R * R - (w / 2 - R) ** 2);
  return {
    d: `M${r0(left)} ${r0(bottom)}V${r0(spring)}A${r0(R)} ${r0(R)} 0 0 1 ${r0(cx)} ${r0(apex)}A${r0(R)} ${r0(R)} 0 0 1 ${r0(right)} ${r0(spring)}V${r0(bottom)}Z`,
    apex,
  };
}

/** Coursed stone: rows of blocks of varied length and tone, each lit on top and shaded below. */
function Masonry({ x0, x1, y0, y1, seed, course = 44, clip }: { x0: number; x1: number; y0: number; y1: number; seed: number; course?: number; clip?: string }) {
  const blocks = useMemo(() => {
    const rand = rng(seed);
    const out: { x: number; y: number; w: number; h: number; c: string }[] = [];
    let row = 0;
    for (let y = y0; y < y1; y += course, row++) {
      let x = x0 - (row % 2 ? 40 + rand() * 30 : rand() * 20);
      while (x < x1) {
        const w = 70 + rand() * 80;
        out.push({ x: r0(x), y: r0(y), w: r0(w), h: Math.min(course, y1 - y), c: STONE[Math.floor(rand() * STONE.length)] });
        x += w;
      }
    }
    return out;
  }, [x0, x1, y0, y1, seed, course]);
  return (
    <g clipPath={clip}>
      {blocks.map((b, i) => (
        <g key={i}>
          <rect x={b.x + 1.5} y={b.y + 1.5} width={b.w - 3} height={b.h - 3} rx={3} fill={b.c} />
          <path d={`M${b.x + 4} ${b.y + 3}H${b.x + b.w - 4}`} stroke="#ffffff" strokeOpacity={0.45} strokeWidth={2} />
          <path d={`M${b.x + 3} ${b.y + b.h - 2}H${b.x + b.w - 3}`} stroke={INK} strokeOpacity={0.14} strokeWidth={2.4} />
        </g>
      ))}
    </g>
  );
}

/** Big corner stones, alternating long and short, slightly lighter than the wall. */
function Quoins({ x, y0, y1, side }: { x: number; y0: number; y1: number; side: 1 | -1 }) {
  const items: ReactElement[] = [];
  let i = 0;
  for (let y = y0; y < y1; y += 44, i++) {
    const w = i % 2 ? 46 : 74;
    const xx = side === 1 ? x : x - w;
    items.push(
      <rect key={y} x={xx} y={y + 1} width={w} height={42} rx={3} fill="#fbe8dc" stroke={INK} strokeOpacity={0.28} strokeWidth={1.4} />,
    );
  }
  return <g>{items}</g>;
}

/** A moulded stone ledge with the shadow it casts on the wall below. */
function Ledge({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  return (
    <g>
      <rect x={x0} y={y + 18} width={x1 - x0} height={22} fill={INK} fillOpacity={0.08} />
      <rect x={x0 - 8} y={y} width={x1 - x0 + 16} height={18} rx={4} fill="#f7dccc" stroke={INK} strokeWidth={1.8} strokeOpacity={0.6} />
      <path d={`M${x0 - 4} ${y + 4}H${x1 + 4}`} stroke="#ffffff" strokeOpacity={0.6} strokeWidth={2} />
    </g>
  );
}

/** A buttress with set-offs and a pinnacle. */
function Buttress({ x, top, bottom }: { x: number; top: number; bottom: number }) {
  const w = 44;
  return (
    <g>
      <rect x={x - w / 2 - 8} y={top + 260} width={w + 16} height={bottom - top - 260} fill="url(#ch-side)" stroke={INK} strokeWidth={2} strokeOpacity={0.6} />
      <path d={`M${x - w / 2 - 8} ${top + 260}L${x - w / 2} ${top + 236}H${x + w / 2}L${x + w / 2 + 8} ${top + 260}Z`} fill="#f2cdb9" stroke={INK} strokeWidth={1.8} strokeOpacity={0.6} />
      <rect x={x - w / 2} y={top} width={w} height={240} fill="url(#ch-side)" stroke={INK} strokeWidth={2} strokeOpacity={0.6} />
      {/* pinnacle */}
      <path d={`M${x - w / 2 - 4} ${top}L${x} ${top - 96}L${x + w / 2 + 4} ${top}Z`} fill="url(#ch-roof)" stroke={INK} strokeWidth={1.8} strokeOpacity={0.7} />
      <path d={`M${x - w / 2 - 4} ${top}L${x} ${top - 96}L${x + w / 2 + 4} ${top}Z`} fill="url(#ch-tiles)" />
      <circle cx={x} cy={top - 102} r={7} fill="url(#ch-gold)" stroke={INK} strokeWidth={1.2} strokeOpacity={0.6} />
      <path d={`M${x - 8} ${top + 40}V${top + 200}`} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={3} />
    </g>
  );
}

/** Stained glass inside a clip: diamond panes in rotating colors, lead lines, a sheen. */
function Glass({ id, d, x0, x1, y0, y1, seed }: { id: string; d: string; x0: number; x1: number; y0: number; y1: number; seed: number }) {
  const panes = useMemo(() => {
    const rand = rng(seed);
    const out: { d: string; c: string }[] = [];
    const s = 30;
    for (let y = y0 - s, row = 0; y < y1 + s; y += s, row++) {
      for (let x = x0 - s + (row % 2 ? s / 2 : 0); x < x1 + s; x += s) {
        out.push({
          d: `M${r0(x)} ${r0(y - s / 2)}L${r0(x + s / 2)} ${r0(y)}L${r0(x)} ${r0(y + s / 2)}L${r0(x - s / 2)} ${r0(y)}Z`,
          c: GLASS[Math.floor(rand() * GLASS.length)],
        });
      }
    }
    return out;
  }, [x0, x1, y0, y1, seed]);
  return (
    <g>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={x0} y={y0 - 200} width={x1 - x0} height={y1 - y0 + 200} fill="#f8e7d6" />
        {panes.map((p, i) => (
          <path key={i} d={p.d} fill={p.c} fillOpacity={0.85} stroke={INK} strokeWidth={1.4} strokeOpacity={0.45} />
        ))}
        <path d={`M${x0 + 8} ${y1}L${x0 + (x1 - x0) * 0.7} ${y0 - 120}`} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={10} />
        <path className="win-glow" d={d} fill="url(#ch-glow)" opacity={0} />
      </g>
    </g>
  );
}

/** A tall pointed window: stone frame and hood mould, two lights under a carved circle. */
function Lancet({ cx, w, spring, bottom, seed }: { cx: number; w: number; spring: number; bottom: number; seed: number }) {
  const outer = pointed(cx, w + 30, spring, bottom + 14);
  const inner = pointed(cx, w, spring, bottom);
  const id = `ch-lancet-${seed}`;
  const top = inner.apex;
  return (
    <g>
      <path d={pointed(cx, w + 52, spring, spring + 4).d} fill="none" stroke="#f7dccc" strokeWidth={12} strokeLinejoin="round" />
      <path d={outer.d} fill="#eec3ad" stroke={INK} strokeWidth={2.2} strokeOpacity={0.7} />
      <Glass id={id} d={inner.d} x0={cx - w / 2} x1={cx + w / 2} y0={top} y1={bottom} seed={seed} />
      {/* stone tracery: the central divider and a circle in the head */}
      <rect x={cx - 5} y={spring + 10} width={10} height={bottom - spring - 10} fill="#f4d5c3" stroke={INK} strokeWidth={1.4} strokeOpacity={0.6} />
      <circle cx={cx} cy={spring - (spring - top) * 0.35} r={w * 0.18} fill="none" stroke="#f4d5c3" strokeWidth={8} />
      <circle cx={cx} cy={spring - (spring - top) * 0.35} r={w * 0.18} fill="none" stroke={INK} strokeWidth={1.4} strokeOpacity={0.6} />
      <path d={inner.d} fill="none" stroke={INK} strokeWidth={2.8} strokeOpacity={0.8} />
      {/* sill */}
      <rect x={cx - w / 2 - 22} y={bottom + 12} width={w + 44} height={14} rx={3} fill="#f7dccc" stroke={INK} strokeWidth={1.6} strokeOpacity={0.6} />
    </g>
  );
}

function RoseWindow({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const p = (a: number, rr: number) => `${r0(cx + Math.cos(a) * rr)} ${r0(cy + Math.sin(a) * rr)}`;
  const petals = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const da = (Math.PI * 2) / 12 / 2 - 0.04;
    return {
      d: `M${p(a - da, r * 0.36)}L${p(a - da, r * 0.78)}Q${p(a, r * 1.02)} ${p(a + da, r * 0.78)}L${p(a + da, r * 0.36)}Z`,
      c: GLASS[i % GLASS.length],
    };
  });
  const inner = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return { d: `M${r0(cx)} ${r0(cy)}L${p(a - 0.42, r * 0.32)}Q${p(a, r * 0.44)} ${p(a + 0.42, r * 0.32)}Z`, c: GLASS[(i + 2) % GLASS.length] };
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 34} fill="#f2cfbb" stroke={INK} strokeWidth={2.4} strokeOpacity={0.7} />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return <circle key={i} cx={r0(cx + Math.cos(a) * (r + 18))} cy={r0(cy + Math.sin(a) * (r + 18))} r={8} fill="#f9e2d5" stroke={INK} strokeWidth={1.2} strokeOpacity={0.5} />;
      })}
      <circle cx={cx} cy={cy} r={r} fill="#f8e7d6" />
      {petals.map((s, i) => (
        <path key={i} d={s.d} fill={s.c} fillOpacity={0.88} stroke={INK} strokeWidth={2} strokeOpacity={0.55} />
      ))}
      {inner.map((s, i) => (
        <path key={i} d={s.d} fill={s.c} fillOpacity={0.9} stroke={INK} strokeWidth={1.8} strokeOpacity={0.55} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.36} fill="none" stroke="#f4d5c3" strokeWidth={9} />
      <circle cx={cx} cy={cy} r={r * 0.12} fill="#f4c46e" stroke={INK} strokeWidth={1.8} strokeOpacity={0.6} />
      <circle className="win-glow" cx={cx} cy={cy} r={r} fill="url(#ch-glow)" opacity={0} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={3.4} strokeOpacity={0.85} />
      <path d={`M${cx - r * 0.6} ${cy + r * 0.5}L${cx + r * 0.2} ${cy - r * 0.7}`} stroke="#ffffff" strokeOpacity={0.3} strokeWidth={12} strokeLinecap="round" />
    </g>
  );
}

/** One wooden door leaf: planks, two panels, studs, and scrolling iron strap hinges. */
function DoorLeaf({ side, x, y, w, h }: { side: 'l' | 'r'; x: number; y: number; w: number; h: number }) {
  const hinge = side === 'l' ? x : x + w;
  const dir = side === 'l' ? 1 : -1;
  const strap = (yy: number) =>
    `M${hinge} ${yy}H${hinge + dir * w * 0.72}c${dir * 14} 0 ${dir * 20} -12 ${dir * 10} -20c${-dir * 8} -6 ${-dir * 16} 2 ${-dir * 12} 8`;
  return (
    <g className={`door-${side}`}>
      <rect x={x} y={y} width={w} height={h} fill="url(#ch-wood)" stroke={INK} strokeWidth={2.6} strokeOpacity={0.85} />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M${x + (w / 5) * (i + 1)} ${y + 4}V${y + h - 4}`} stroke="#4d2c1d" strokeOpacity={0.35} strokeWidth={2} />
      ))}
      <rect x={x + 16} y={y + 26} width={w - 32} height={h * 0.38} rx={6} fill="none" stroke="#4d2c1d" strokeWidth={2.4} strokeOpacity={0.5} />
      <rect x={x + 16} y={y + h * 0.5} width={w - 32} height={h * 0.42} rx={6} fill="none" stroke="#4d2c1d" strokeWidth={2.4} strokeOpacity={0.5} />
      <path d={`${strap(y + h * 0.18)}${strap(y + h * 0.78)}`} fill="none" stroke="#3a2a22" strokeWidth={6} strokeLinecap="round" strokeOpacity={0.85} />
      {[0.18, 0.78].flatMap((t) => [0.2, 0.4, 0.6].map((u) => [t, u])).map(([t, u], i) => (
        <circle key={i} cx={hinge + dir * w * u} cy={y + h * t} r={3.4} fill="#c99a52" />
      ))}
      <circle cx={side === 'l' ? x + w - 18 : x + 18} cy={y + h * 0.52} r={12} fill="none" stroke="#c99a52" strokeWidth={3.4} />
      <circle cx={side === 'l' ? x + w - 18 : x + 18} cy={y + h * 0.52 - 12} r={4} fill="#c99a52" />
      {/* light catching the wood */}
      <path d={`M${x + w * 0.3} ${y + 10}V${y + h - 10}`} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={14} />
    </g>
  );
}

function Doorway() {
  const cx = 700;
  const w = 270;
  const spring = 1150;
  const bottom = 1420;
  const lintel = 1170;
  return (
    <g>
      {/* three receding carved arches */}
      {[72, 48, 24].map((o, i) => (
        <path key={o} d={pointed(cx, w + o * 2, spring, bottom).d} fill={['#efc8b3', '#f4d3c1', '#ebc0aa'][i]} stroke={INK} strokeWidth={2.2} strokeOpacity={0.65} />
      ))}
      {[60, 36].map((o) => (
        <path key={o} d={pointed(cx, w + o * 2, spring, bottom).d} fill="none" stroke="#ffffff" strokeOpacity={0.4} strokeWidth={3} />
      ))}
      {/* tympanum with a carved cross */}
      <path d={pointed(cx, w, spring, lintel).d} fill="#e8bba4" stroke={INK} strokeWidth={2.4} strokeOpacity={0.75} />
      <path d={`M${cx - 9} ${lintel - 150}h18v40h40v18h-40v70h-18v-70h-40v-18h40z`} fill="#f6dccd" stroke={INK} strokeWidth={1.8} strokeOpacity={0.6} />
      <rect x={cx - w / 2 - 4} y={lintel - 4} width={w + 8} height={22} fill="#f2cdb9" stroke={INK} strokeWidth={2} strokeOpacity={0.7} />
      {/* the warm light inside, revealed as the doors open */}
      <rect x={cx - w / 2} y={lintel + 18} width={w} height={bottom - lintel - 18} fill="url(#ch-inside)" />
      <DoorLeaf side="l" x={cx - w / 2} y={lintel + 18} w={w / 2} h={bottom - lintel - 18} />
      <DoorLeaf side="r" x={cx} y={lintel + 18} w={w / 2} h={bottom - lintel - 18} />
    </g>
  );
}

function Tower() {
  const x0 = 590, x1 = 810, cx = 700;
  const belfry = pointed(cx, 80, 240, 330);
  return (
    <g>
      {/* spire, tiled, with the cross */}
      <path d={`M${x0 - 10} 58L${cx} -150L${x1 + 10} 58Z`} fill="url(#ch-roof)" stroke={INK} strokeWidth={2.6} strokeOpacity={0.8} strokeLinejoin="round" />
      <path d={`M${x0 - 10} 58L${cx} -150L${x1 + 10} 58Z`} fill="url(#ch-tiles)" />
      <path d={`M${cx} -150L${x1 + 10} 58L${cx + 30} 58Z`} fill={INK} fillOpacity={0.12} />
      <rect x={cx - 7} y={-226} width={14} height={80} rx={3} fill="url(#ch-gold)" stroke={INK} strokeWidth={1.6} strokeOpacity={0.7} />
      <rect x={cx - 26} y={-204} width={52} height={13} rx={3} fill="url(#ch-gold)" stroke={INK} strokeWidth={1.6} strokeOpacity={0.7} />
      {/* tower body */}
      <rect x={x0} y={56} width={x1 - x0} height={400} fill="#f2cfbb" />
      <Masonry x0={x0} x1={x1} y0={56} y1={456} seed={11} course={40} clip="url(#ch-towerClip)" />
      <rect x={x0} y={56} width={x1 - x0} height={400} fill="none" stroke={INK} strokeWidth={2.6} strokeOpacity={0.8} />
      <Ledge x0={x0} x1={x1} y={56} />
      {/* clock, high on the tower where it can be seen above the gable */}
      <circle cx={cx} cy={120} r={40} fill="#fbf1e6" stroke={INK} strokeWidth={2.6} strokeOpacity={0.8} />
      <circle cx={cx} cy={120} r={46} fill="none" stroke="url(#ch-gold)" strokeWidth={7} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <path key={i} d={`M${r0(cx + Math.cos(a) * 31)} ${r0(120 + Math.sin(a) * 31)}L${r0(cx + Math.cos(a) * 37)} ${r0(120 + Math.sin(a) * 37)}`} stroke={INK} strokeWidth={2.2} strokeOpacity={0.7} />;
      })}
      <path d={`M${cx} 120L${cx} 94M${cx} 120L${cx + 19} 127`} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
      <Ledge x0={x0} x1={x1} y={172} />
      {/* belfry with the bell */}
      <path d={pointed(cx, 106, 240, 336).d} fill="#f7dccc" stroke={INK} strokeWidth={2} strokeOpacity={0.6} />
      <path d={belfry.d} fill="#9c6552" stroke={INK} strokeWidth={2.2} strokeOpacity={0.75} />
      <g className="bell">
        <path d={`M${cx} 190V214`} stroke="#3a2a22" strokeWidth={3} />
        <path d={`M${cx - 30} 270C${cx - 30} 232 ${cx - 18} 214 ${cx} 214C${cx + 18} 214 ${cx + 30} 232 ${cx + 30} 270Q${cx} 280 ${cx - 30} 270Z`} fill="url(#ch-gold)" stroke={INK} strokeWidth={2} strokeOpacity={0.8} />
        <circle cx={cx} cy={278} r={7} fill="#8a5d2e" />
      </g>
      {/* louvres below the bell */}
      {[292, 304, 316].map((y) => (
        <path key={y} d={`M${cx - 34} ${y}H${cx + 34}`} stroke="#6e3f30" strokeWidth={4.5} strokeOpacity={0.7} />
      ))}
    </g>
  );
}

/** A side aisle with its lean-to tiled roof and a small window. */
function Aisle({ x0, x1, side }: { x0: number; x1: number; side: 1 | -1 }) {
  const inner = side === 1 ? x1 : x0;
  const outer = side === 1 ? x0 : x1;
  const roof = `M${inner} 860L${outer - side * 30} 1010L${outer - side * 30} 1036L${inner} 892Z`;
  const win = pointed((x0 + x1) / 2, 64, 1180, 1360);
  return (
    <g>
      <rect x={Math.min(x0, x1)} y={1010} width={Math.abs(x1 - x0)} height={490} fill="#efc9b4" />
      <Masonry x0={Math.min(x0, x1)} x1={Math.max(x0, x1)} y0={1010} y1={1500} seed={side === 1 ? 21 : 22} />
      <rect x={Math.min(x0, x1)} y={1010} width={Math.abs(x1 - x0)} height={490} fill="none" stroke={INK} strokeWidth={2.4} strokeOpacity={0.75} />
      <path d={`M${inner} 860L${outer - side * 30} 1010L${inner} 1010Z`} fill="#f0c9b4" />
      <path d={roof} fill="url(#ch-roof)" stroke={INK} strokeWidth={2.2} strokeOpacity={0.75} strokeLinejoin="round" />
      <path d={roof} fill="url(#ch-tiles)" />
      <path d={win.d} fill="#eec3ad" stroke={INK} strokeWidth={2} strokeOpacity={0.6} transform="translate(0 -6) scale(1 1)" />
      <Glass id={`ch-aisle-${side}`} d={pointed((x0 + x1) / 2, 50, 1180, 1352).d} x0={(x0 + x1) / 2 - 25} x1={(x0 + x1) / 2 + 25} y0={1120} y1={1352} seed={side === 1 ? 31 : 32} />
      <path d={pointed((x0 + x1) / 2, 50, 1180, 1352).d} fill="none" stroke={INK} strokeWidth={2.4} strokeOpacity={0.75} />
      <Quoins x={outer} y0={1012} y1={1500} side={side === 1 ? 1 : -1} />
    </g>
  );
}

function Greenery({ flip = false }: { flip?: boolean }) {
  return (
    <g transform={flip ? 'scale(-1 1)' : undefined}>
      {[-150, -120, -96, -70, -40, -20, -130, -60].map((a, i) => (
        <Leaf key={i} x={(i % 4) * 22} y={-(i % 3) * 30} len={70 + (i % 3) * 14} a={a} />
      ))}
      <Rose x={30} y={-70} r={26} tone="pink" seed={91} />
      <Rose x={70} y={-30} r={32} tone="coral" seed={92} rot={20} />
      <Rose x={10} y={-12} r={24} tone="peach" seed={93} />
      <Rose x={100} y={-80} r={20} tone="pink" seed={94} />
    </g>
  );
}

export default function ChurchArt() {
  return (
    <svg viewBox="0 -230 1400 1770" preserveAspectRatio="xMidYMax meet" role="img" aria-label="A stone church with a tower and stained-glass windows, its doors opening">
      <defs>
        <linearGradient id="ch-side" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#f7dccc" />
          <stop offset=".5" stopColor="#f2cfbb" />
          <stop offset="1" stopColor="#e5b9a2" />
        </linearGradient>
        <linearGradient id="ch-roof" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c98a73" />
          <stop offset="1" stopColor="#a6684f" />
        </linearGradient>
        <pattern id="ch-tiles" width="34" height="22" patternUnits="userSpaceOnUse">
          <path d="M0 22Q8.5 8 17 22Q25.5 8 34 22" fill="none" stroke={INK} strokeOpacity=".28" strokeWidth="1.6" />
          <path d="M-17 11Q-8.5 -3 0 11Q8.5 -3 17 11Q25.5 -3 34 11Q42.5 -3 51 11" fill="none" stroke="#ffffff" strokeOpacity=".16" strokeWidth="1.4" />
        </pattern>
        <linearGradient id="ch-wood" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6e4029" />
          <stop offset=".45" stopColor="#9b6443" />
          <stop offset="1" stopColor="#663b26" />
        </linearGradient>
        <radialGradient id="ch-inside" cx=".5" cy=".75" r=".85">
          <stop offset="0" stopColor="#fff9e4" />
          <stop offset=".45" stopColor="#ffe6aa" />
          <stop offset="1" stopColor="#f0b26d" />
        </radialGradient>
        <radialGradient id="ch-glow">
          <stop offset="0" stopColor="#fff6cf" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffe08a" stopOpacity=".4" />
        </radialGradient>
        <linearGradient id="ch-ray" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffe6a8" stopOpacity=".8" />
          <stop offset="1" stopColor="#ffe6a8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ch-gold" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#a8783e" />
          <stop offset=".45" stopColor="#f0cf8c" />
          <stop offset="1" stopColor="#9a6c35" />
        </linearGradient>
        {/* sunlight from the upper left: a warm wash on the left, soft shade on the right */}
        <linearGradient id="ch-sun" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".16" />
          <stop offset=".45" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#7a2f28" stopOpacity=".16" />
        </linearGradient>
        <clipPath id="ch-towerClip">
          <rect x={590} y={56} width={220} height={400} />
        </clipPath>
        <clipPath id="ch-facadeClip">
          <path d="M330 690L700 360L1070 690V1500H330Z" />
        </clipPath>
      </defs>

      <Tower />

      {/* side aisles */}
      <Aisle x0={110} x1={330} side={1} />
      <Aisle x0={1070} x1={1290} side={-1} />

      {/* the nave front: walls, gable, and their stone */}
      <path d="M330 690L700 360L1070 690V1500H330Z" fill="#f2cfbb" />
      <Masonry x0={330} x1={1070} y0={360} y1={1500} seed={7} clip="url(#ch-facadeClip)" />
      <path d="M330 690L700 360L1070 690V1500H330Z" fill="url(#ch-sun)" />
      <path d="M330 690L700 360L1070 690V1500H330Z" fill="none" stroke={INK} strokeWidth={3} strokeOpacity={0.8} strokeLinejoin="round" />
      {/* coping along the gable */}
      <path d="M306 708L700 340L1094 708" fill="none" stroke="url(#ch-roof)" strokeWidth={34} strokeLinejoin="round" strokeLinecap="round" />
      <path d="M306 708L700 340L1094 708" fill="none" stroke="url(#ch-tiles)" strokeWidth={34} strokeLinejoin="round" />
      <path d="M296 724L700 322L1104 724" fill="none" stroke={INK} strokeWidth={2.4} strokeOpacity={0.75} strokeLinejoin="round" />
      <path d="M318 694L700 356L1082 694" fill="none" stroke={INK} strokeWidth={2} strokeOpacity={0.45} strokeLinejoin="round" />
      <path d="M318 694L700 356L1082 694" fill="none" stroke={INK} strokeOpacity={0.1} strokeWidth={22} transform="translate(0 16)" />
      <circle cx={700} cy={318} r={14} fill="url(#ch-gold)" stroke={INK} strokeWidth={1.6} strokeOpacity={0.7} />

      <Quoins x={330} y0={700} y1={1500} side={1} />
      <Quoins x={1070} y0={700} y1={1500} side={-1} />
      <Ledge x0={330} x1={1070} y={1000} />

      <RoseWindow cx={700} cy={600} r={124} />
      <Lancet cx={432} w={80} spring={820} bottom={1170} seed={41} />
      <Lancet cx={968} w={80} spring={820} bottom={1170} seed={42} />

      <Buttress x={330} top={560} bottom={1500} />
      <Buttress x={1070} top={560} bottom={1500} />

      <Doorway />

      {/* steps, and the light that spills down them */}
      {[
        [520, 1420, 360, 26],
        [490, 1446, 420, 26],
        [456, 1472, 488, 30],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx={3} fill="#f5d6c5" stroke={INK} strokeWidth={2} strokeOpacity={0.65} />
          <path d={`M${x + 4} ${y + 3}H${x + w - 4}`} stroke="#ffffff" strokeOpacity={0.6} strokeWidth={2.4} />
          <rect x={x} y={y + h - 8} width={w} height={8} fill={INK} fillOpacity={0.1} />
        </g>
      ))}
      <path className="rays" d="M570 1420L830 1420L1080 1540L320 1540Z" fill="url(#ch-ray)" opacity={0} />

      {/* ivy and climbing roses at the foot of the walls */}
      <g transform="translate(360 1498)"><Greenery /></g>
      <g transform="translate(1040 1498)"><Greenery flip /></g>
      <g transform="translate(150 1498)"><Greenery /></g>
      <g transform="translate(1250 1498)"><Greenery flip /></g>
      <path d="M100 1500H1300" stroke={INK} strokeOpacity={0.35} strokeWidth={2} />
    </svg>
  );
}
