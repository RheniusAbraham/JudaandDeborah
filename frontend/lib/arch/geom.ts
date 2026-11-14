// Geometry for the hand-built arch illustration. Everything lives in one 1536 x 2314 space
// (the proportions of the original artwork), so the text inside the arch keeps its place.

export const VW = 1536;
export const VH = 2314;

/** Sideways displacement of a curtain at height y (viewBox units), for fold k (0 = outer edge, 1 = inner edge). */
export type Disp = (y: number, k: number) => number;
const still: Disp = () => 0;

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const r1 = (n: number) => Math.round(n * 10) / 10;
const pt = (p: [number, number]) => `${r1(p[0])} ${r1(p[1])}`;
const line = (pts: [number, number][]) => 'M' + pts.map(pt).join('L');

/* ------------------------------------------------------------------ curtains */

// A left curtain: pinned along the rod, gathered at the tie-back, flaring to a scalloped hem.
// The right curtain is the same shape mirrored.
export const CURTAIN = { top: 40, tie: 1010, floor: 2240 }; // falls almost to the floor, behind the flower bed
const FOLDS = [0, 0.075, 0.16, 0.245, 0.335, 0.425, 0.52, 0.61, 0.705, 0.8, 0.9, 1];
const STEP = 34; // point spacing along the folds: smooth at any size, fewer points to redraw
const YS: number[] = (() => {
  const a: number[] = [];
  for (let y = CURTAIN.top; y < CURTAIN.floor; y += STEP) a.push(y);
  a.push(CURTAIN.floor);
  return a;
})();

function outerX(y: number) {
  if (y <= CURTAIN.tie) {
    const t = (y - CURTAIN.top) / (CURTAIN.tie - CURTAIN.top);
    return 14 + 16 * t;
  }
  const t = (y - CURTAIN.tie) / (CURTAIN.floor - CURTAIN.tie);
  return 30 - 34 * Math.pow(t, 1.5);
}
function innerX(y: number) {
  if (y <= CURTAIN.tie) {
    const t = (y - CURTAIN.top) / (CURTAIN.tie - CURTAIN.top);
    return lerp(480, 178, 1 - Math.pow(1 - t, 1.4));
  }
  const t = (y - CURTAIN.tie) / (CURTAIN.floor - CURTAIN.tie);
  return lerp(178, 290, Math.pow(t, 1.9)); // a modest flare: the hem stays clear of the text
}
function foldX(k: number, y: number) {
  let x = lerp(outerX(y), innerX(y), FOLDS[k]);
  if (k > 0 && k < FOLDS.length - 1) {
    // folds fall in soft S-curves, and gather flat where they are pinned and tied
    const fromTop = Math.min(1, (y - CURTAIN.top) / 300);
    const nearTie = 1 - Math.exp(-(((y - CURTAIN.tie) / 150) ** 2));
    const below = y > CURTAIN.tie ? 1 + (y - CURTAIN.tie) / 500 : 1; // folds open up toward the hem
    x += fromTop * nearTie * below * (13 * Math.sin(y / 210 + k * 1.9) + 5 * Math.sin(y / 97 + k * 3.1));
  }
  return x;
}

export type CurtainShape = {
  strips: string[];   // filled fabric panels between folds
  folds: string[];    // ink lines along the folds
  crests: string[];   // the ridge of each panel, where the fabric catches the light
  outline: string;    // the whole curtain (for shading)
  edges: string;      // outer and inner edges, drawn heavier
  hem: string;        // the scalloped bottom
};

export function curtainShape(d: Disp = still): CurtainShape {
  const last = FOLDS.length - 1;
  const cols = FOLDS.map((_, k) => YS.map((y) => [foldX(k, y) + d(y, k / last), y] as [number, number]));
  const strips: string[] = [];
  let hem = '';
  for (let k = 0; k < cols.length - 1; k++) {
    const left = cols[k];
    const right = cols[k + 1];
    const lb = left[left.length - 1];
    const rb = right[right.length - 1];
    const mid: [number, number] = [(lb[0] + rb[0]) / 2, CURTAIN.floor + 24 + (k % 2) * 7];
    strips.push(`${line(left)}Q${pt(mid)} ${pt(rb)}L${right.slice().reverse().map(pt).join('L')}Z`);
    hem += `${k === 0 ? 'M' + pt(lb) : ''}Q${pt(mid)} ${pt(rb)}`;
  }
  const folds = cols.slice(1, -1).map((c) => line(c.slice(0, -1)));
  // ridge line a little off-center in each panel (light comes from the upper left)
  const crests = cols.slice(0, -1).map((c, k) =>
    line(
      c.slice(2, -2).map(([x, y], i) => [x + (cols[k + 1][i + 2][0] - x) * 0.42, y] as [number, number]),
    ),
  );
  const first = cols[0];
  const end = cols[cols.length - 1];
  const outline = `${line(first)}${hem.replace(/^M[^Q]*/, '')}L${end.slice().reverse().map(pt).join('L')}Z`;
  const edges = `${line(first)}${line(end)}`;
  return { strips, folds, crests, outline, edges, hem };
}

/* --------------------------------------------------------------------- swags */

export type SwagShape = { bands: string[]; folds: string[]; hem: string };

/** A swag hangs between two points on the rod; its bands all meet at the ends. */
export function swagShape(x0: number, x1: number, top: number, depth: number, bands = 5, lift = 0): SwagShape {
  const cx = (x0 + x1) / 2;
  const hw = (x1 - x0) / 2;
  const xs: number[] = [];
  for (let x = x0; x < x1; x += 16) xs.push(x);
  xs.push(x1);
  const curve = (j: number) =>
    xs.map((x) => {
      const u = 1 - ((x - cx) / hw) ** 2;
      const dj = depth * Math.pow(j / bands, 0.85);
      return [x, top + dj * Math.pow(Math.max(0, u), 0.9) - lift * (j / bands) * u * u] as [number, number];
    });
  const curves = Array.from({ length: bands + 1 }, (_, j) => curve(j));
  const bandsD: string[] = [];
  for (let j = 0; j < bands; j++) {
    bandsD.push(`${line(curves[j])}L${curves[j + 1].slice().reverse().map(pt).join('L')}Z`);
  }
  return { bands: bandsD, folds: curves.slice(1, -1).map(line), hem: line(curves[bands]) };
}

/** Height of a swag's lowest edge at x (where bead strings hang from). */
export function swagHemY(x0: number, x1: number, top: number, depth: number, x: number) {
  const cx = (x0 + x1) / 2;
  const hw = (x1 - x0) / 2;
  const u = Math.max(0, 1 - ((x - cx) / hw) ** 2);
  return top + depth * Math.pow(u, 0.9);
}

/* ------------------------------------------------------------------- flowers */

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const p3 = (x: number, y: number) => `${r3(x)} ${r3(y)}`;

/** One cupped petal pointing along +x, base at the origin, in unit size. */
function petal(len: number, wid: number) {
  const L = len, W = wid;
  return {
    body:
      `M0 0C${p3(L * 0.28, -W)} ${p3(L * 0.82, -W * 1.05)} ${p3(L * 0.97, -W * 0.42)}` +
      `Q${p3(L * 1.04, 0)} ${p3(L * 0.97, W * 0.42)}` +
      `C${p3(L * 0.82, W * 1.05)} ${p3(L * 0.28, W)} 0 0Z`,
    // the rolled-back lip of the petal, where the light catches
    lip: `M${p3(L * 0.84, -W * 0.62)}Q${p3(L * 1.0, 0)} ${p3(L * 0.84, W * 0.62)}`,
  };
}

/**
 * A rose in unit size (radius 1), centered on 0,0: three rings of cupped petals around a
 * tight swirled bud. Scale it to the size wanted.
 */
export function roseShape(seed: number) {
  const rand = rng(seed);
  const off = rand() * Math.PI * 2;
  const rings = [
    { n: 6, len: 1.0, wid: 0.5, base: 0.12 },  // outer, opened petals
    { n: 5, len: 0.7, wid: 0.42, base: 0.06 }, // middle, cupped
    { n: 4, len: 0.44, wid: 0.32, base: 0.02 }, // inner, nearly closed
  ];
  const petals = rings.map((ring, ri) =>
    Array.from({ length: ring.n }, (_, i) => {
      const a = off + ri * 0.5 + (i / ring.n) * Math.PI * 2 + (rand() - 0.5) * 0.3;
      const s = petal(ring.len * (0.92 + rand() * 0.14), ring.wid * (0.9 + rand() * 0.2));
      const deg = r3((a * 180) / Math.PI);
      const bx = r3(Math.cos(a) * ring.base);
      const by = r3(Math.sin(a) * ring.base);
      return { ...s, transform: `translate(${bx} ${by}) rotate(${deg})` };
    }),
  );
  // the swirl at the heart of the bud
  const sw: string[] = [];
  for (let i = 0; i <= 36; i++) {
    const t = i / 36;
    const a = off + t * 2.4 * Math.PI * 2;
    const rad = 0.04 + 0.26 * t;
    sw.push(p3(Math.cos(a) * rad, Math.sin(a) * rad * 0.9));
  }
  return { petals, swirl: 'M' + sw.join('L') };
}

/** A pointed leaf along +x, from 0,0, with side veins. */
export function leafShape(len: number, width: number) {
  const veins: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const x = (len * i) / 5.4;
    const reach = width * (0.78 - i * 0.1);
    veins.push(`M${r1(x)} 0Q${r1(x + len * 0.07)} ${r1(-reach * 0.55)} ${r1(x + len * 0.16)} ${r1(-reach)}`);
    veins.push(`M${r1(x)} 0Q${r1(x + len * 0.07)} ${r1(reach * 0.55)} ${r1(x + len * 0.16)} ${r1(reach)}`);
  }
  return {
    body: `M0 0Q${r1(len * 0.45)} ${r1(-width)} ${r1(len)} 0Q${r1(len * 0.45)} ${r1(width)} 0 0Z`,
    // the upper half, lit; the lower half stays in the leaf's own shade
    lit: `M0 0Q${r1(len * 0.45)} ${r1(-width)} ${r1(len)} 0Q${r1(len * 0.5)} ${r1(-width * 0.12)} 0 0Z`,
    rib: `M${r1(len * 0.06)} 0Q${r1(len * 0.5)} ${r1(-width * 0.12)} ${r1(len * 0.9)} 0`,
    veins: veins.join(''),
  };
}

/** A gently curving stem as a cubic from a to b. */
export function stem(a: [number, number], b: [number, number], bend: number) {
  const mx = (a[0] + b[0]) / 2 + bend;
  const my = (a[1] + b[1]) / 2;
  return `M${pt(a)}C${pt([mx, a[1] + (my - a[1]) * 0.4])} ${pt([mx, b[1] - (b[1] - my) * 0.4])} ${pt(b)}`;
}

/** Points along a cubic stem, for placing leaves. */
export function stemPoints(a: [number, number], b: [number, number], bend: number, n: number) {
  const mx = (a[0] + b[0]) / 2 + bend;
  const my = (a[1] + b[1]) / 2;
  const c1: [number, number] = [mx, a[1] + (my - a[1]) * 0.4];
  const c2: [number, number] = [mx, b[1] - (b[1] - my) * 0.4];
  const out: [number, number][] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const u = 1 - t;
    out.push([
      u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
      u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1],
    ]);
  }
  return out;
}

/** An irregular watercolor blob around cx, cy. */
export function blobShape(cx: number, cy: number, rx: number, ry: number, seed: number) {
  const rand = rng(seed);
  const N = 12;
  const p: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k = 0.78 + rand() * 0.4;
    p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${pt(mid(p[N - 1], p[0]))}`;
  for (let i = 0; i < N; i++) d += `Q${pt(p[i])} ${pt(mid(p[i], p[(i + 1) % N]))}`;
  return d + 'Z';
}
