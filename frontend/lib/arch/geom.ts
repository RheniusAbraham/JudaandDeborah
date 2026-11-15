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

export type SwagShape = {
  bands: string[];   // the folds of fabric, top to bottom
  folds: string[];   // ink lines where one fold tucks under the next
  shades: string[];  // the underside of each fold, turning away from the light (two layers each)
  lights: string[];  // the lit belly of each fold
  ridges: string[];  // a bright line along the crest of each fold
  pleats: string[];  // dark gathers fanning out from where the swag is pinned
  pleatLights: string[];
  outline: string;   // the whole swag (for its cast shadow)
  lace: string;      // scalloped lace trim hanging from the hem
  laceInner: string; // the stitched line inside the lace
  eyelets: [number, number][];
  hem: string;
};

/** A swag hangs between two points on the rod; its bands all meet at the ends. */
export function swagShape(x0: number, x1: number, top: number, depth: number, bands = 5, lift = 0): SwagShape {
  const cx = (x0 + x1) / 2;
  const hw = (x1 - x0) / 2;
  const xs: number[] = [];
  for (let x = x0; x < x1; x += 16) xs.push(x);
  xs.push(x1);
  const yAt = (j: number, x: number) => {
    const u = Math.max(0, 1 - ((x - cx) / hw) ** 2);
    const dj = depth * Math.pow(Math.max(0, j) / bands, 0.85);
    return top + dj * Math.pow(u, 0.9) - lift * (j / bands) * u * u;
  };
  const curve = (j: number, from = x0, to = x1) =>
    xs.filter((x) => x >= from && x <= to).map((x) => [x, yAt(j, x)] as [number, number]);
  const between = (a: number, b: number) => `${line(curve(a))}L${curve(b).slice().reverse().map(pt).join('L')}Z`;

  const bandsD: string[] = [];
  const shades: string[] = [];
  const lights: string[] = [];
  const ridges: string[] = [];
  for (let j = 0; j < bands; j++) {
    bandsD.push(between(j, j + 1));
    shades.push(between(j + 0.6, j + 1), between(j + 0.8, j + 1));
    lights.push(between(j + 0.14, j + 0.44));
    ridges.push(line(curve(j + 0.28, cx - hw * 0.78, cx + hw * 0.78)));
  }

  // gathers: tapered slivers fanning out from each pinned end
  const pleats: string[] = [];
  const pleatLights: string[] = [];
  const sliver = (jm: number, side: 1 | -1, len: number, w: number) => {
    const n = 12;
    const up: [number, number][] = [];
    const dn: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const x = side === 1 ? x0 + s * len : x1 - s * len;
      const d = w * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.25)), 0.8) * (1 - s * 0.6);
      up.push([x, yAt(jm - d, x)]);
      dn.push([x, yAt(jm + d, x)]);
    }
    return `${line(up)}L${dn.reverse().map(pt).join('L')}Z`;
  };
  const span = x1 - x0;
  for (const side of [1, -1] as const) {
    for (let j = 0; j < bands; j++) {
      pleats.push(sliver(j + 0.55, side, span * 0.3, 0.13));
      pleats.push(sliver(j + 0.2, side, span * 0.17, 0.08));
      pleatLights.push(sliver(j + 0.36, side, span * 0.24, 0.07));
    }
  }

  // lace: scallops spaced evenly along the hem, wherever it hangs clear of the rod
  const hemPts: [number, number][] = [];
  for (let x = x0; x <= x1; x += 4) hemPts.push([x, yAt(bands, x)]);
  const SP = 27;
  const marks: { p: [number, number]; t: [number, number] }[] = [];
  let acc = SP;
  for (let i = 1; i < hemPts.length; i++) {
    const [ax, ay] = hemPts[i - 1];
    const [bx, by] = hemPts[i];
    acc += Math.hypot(bx - ax, by - ay);
    if (acc >= SP && by - top > 30) {
      acc = 0;
      const l = Math.hypot(bx - ax, by - ay) || 1;
      marks.push({ p: [bx, by], t: [(bx - ax) / l, (by - ay) / l] });
    }
  }
  let lace = '';
  let laceInner = '';
  const eyelets: [number, number][] = [];
  if (marks.length > 1) {
    lace = 'M' + pt(marks[0].p);
    laceInner = 'M' + pt(marks[0].p);
    for (let i = 1; i < marks.length; i++) {
      const a = marks[i - 1].p;
      const b = marks[i].p;
      const t = marks[i].t;
      const nx = -t[1];
      const ny = t[0];
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      lace += `Q${pt([mx + nx * 19, my + ny * 19])} ${pt(b)}`;
      laceInner += `Q${pt([mx + nx * 10, my + ny * 10])} ${pt(b)}`;
      eyelets.push([mx + nx * 8.5, my + ny * 8.5]);
    }
    lace += 'L' + marks.slice().reverse().map((m) => pt(m.p)).join('L') + 'Z';
  }

  return {
    bands: bandsD,
    folds: Array.from({ length: bands - 1 }, (_, j) => line(curve(j + 1))),
    shades,
    lights,
    ridges,
    pleats,
    pleatLights,
    outline: between(0, bands),
    lace,
    laceInner,
    eyelets,
    hem: line(curve(bands)),
  };
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

/** One cupped petal pointing along +x, base at the origin, in unit size. Outer petals get a
 *  small notch at the tip, the way an open rose petal rolls back. */
function petalBody(L: number, W: number, notch: boolean) {
  const tip = notch
    ? `Q${p3(L * 1.02, -W * 0.2)} ${p3(L * 0.955, 0)}Q${p3(L * 1.02, W * 0.2)} ${p3(L * 0.96, W * 0.45)}`
    : `Q${p3(L * 1.04, 0)} ${p3(L * 0.96, W * 0.45)}`;
  return `M0 0C${p3(L * 0.28, -W)} ${p3(L * 0.82, -W * 1.05)} ${p3(L * 0.96, -W * 0.45)}${tip}C${p3(L * 0.82, W * 1.05)} ${p3(L * 0.28, W)} 0 0Z`;
}

export type RoseRing = {
  petals: { body: string; transform: string }[];
  shade: string; // deep shadow at the base of each petal, where the next ring tucks in
  veins: string; // faint lines fanning toward the tip
  turn: string;  // the paler rolled-back lip of each petal
  lip: string;   // bright edge along that lip
  sheen: string; // a streak of light along one side of the cup
};

/**
 * A rose in unit size (radius 1), centered on 0,0: four rings of cupped petals around a
 * tight swirled bud. Scale it to the size wanted. Each ring's details are baked into the
 * rose's own space and merged into one path apiece, so a rose stays cheap to draw.
 */
export function roseShape(seed: number) {
  const rand = rng(seed);
  const off = rand() * Math.PI * 2;
  const specs = [
    { n: 7, len: 1.0, wid: 0.46, base: 0.14, notch: true },  // outer, opened
    { n: 6, len: 0.8, wid: 0.42, base: 0.09, notch: true },  // second, cupped
    { n: 5, len: 0.6, wid: 0.36, base: 0.05, notch: false }, // third, curling in
    { n: 4, len: 0.42, wid: 0.3, base: 0.02, notch: false }, // inner, nearly closed
  ];
  const rings: RoseRing[] = specs.map((ring, ri) => {
    const out: RoseRing = { petals: [], shade: '', veins: '', turn: '', lip: '', sheen: '' };
    for (let i = 0; i < ring.n; i++) {
      const a = off + ri * 0.55 + (i / ring.n) * Math.PI * 2 + (rand() - 0.5) * 0.3;
      const L = ring.len * (0.92 + rand() * 0.14);
      const W = ring.wid * (0.9 + rand() * 0.2);
      const bx = Math.cos(a) * ring.base;
      const by = Math.sin(a) * ring.base;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const t = (x: number, y: number) => p3(bx + x * L * ca - y * W * sa, by + x * L * sa + y * W * ca);
      out.petals.push({
        body: petalBody(L, W, ring.notch),
        transform: `translate(${r3(bx)} ${r3(by)}) rotate(${r3((a * 180) / Math.PI)})`,
      });
      out.shade += `M${t(0, 0)}Q${t(0.3, -0.6)} ${t(0.46, 0)}Q${t(0.3, 0.6)} ${t(0, 0)}Z`;
      out.veins +=
        `M${t(0.24, 0)}Q${t(0.55, -0.05)} ${t(0.8, -0.02)}` +
        `M${t(0.24, -0.06)}Q${t(0.5, -0.3)} ${t(0.74, -0.42)}` +
        `M${t(0.24, 0.06)}Q${t(0.5, 0.3)} ${t(0.74, 0.42)}`;
      out.turn += `M${t(0.8, -0.62)}Q${t(1.03, 0)} ${t(0.8, 0.62)}Q${t(0.9, 0)} ${t(0.8, -0.62)}Z`;
      out.lip += `M${t(0.84, -0.6)}Q${t(1.0, 0)} ${t(0.84, 0.6)}`;
      out.sheen += `M${t(0.32, -0.5)}Q${t(0.58, -0.7)} ${t(0.78, -0.52)}`;
    }
    return out;
  });
  // the swirl at the heart of the bud
  const sw: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = off + t * 2.6 * Math.PI * 2;
    const rad = 0.035 + 0.2 * t;
    sw.push(p3(Math.cos(a) * rad, Math.sin(a) * rad * 0.9));
  }
  // light catching the top of the bud
  const g0 = off + 3.6;
  const glint = `M${p3(Math.cos(g0) * 0.15, Math.sin(g0) * 0.15)}A0.15 0.15 0 0 1 ${p3(Math.cos(g0 + 1.4) * 0.15, Math.sin(g0 + 1.4) * 0.15)}`;
  return { rings, swirl: 'M' + sw.join('L'), glint };
}

/**
 * A pointed, finely serrated leaf along +x, from 0,0, curling gently along its length,
 * with a lit upper half, a tapered midrib and paired veins that sweep toward the tip.
 */
export function leafShape(len: number, width: number) {
  const N = 40;
  const hw = (t: number) => width * 0.56 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.85);
  const mid = (t: number) => len * 0.05 * t * t; // the curl of the midrib
  const P = (t: number, side: number, out = 0): [number, number] => [t * len, mid(t) + side * (hw(t) + out)];
  // an edge with small saw teeth pointing toward the tip
  const edgePts = (side: number) => {
    const pts: [number, number][] = [];
    const teeth = 11;
    for (let i = 1; i <= N; i++) {
      const t = i / N;
      const k = (t * teeth) % 1;
      // ramp out slowly, then drop back sharply: a saw tooth
      const out = t > 0.14 && t < 0.94 ? (k < 0.8 ? k / 0.8 : (1 - k) / 0.2) * len * 0.016 : 0;
      pts.push(P(t, side, out));
    }
    return pts;
  };
  const up = edgePts(-1);
  const lo = edgePts(1);
  const ribPts: [number, number][] = [];
  for (let i = 0; i <= 12; i++) ribPts.push([(i / 12) * len * 0.96, mid((i / 12) * 0.96)]);
  const veins: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const t0 = 0.1 + i * 0.13;
    const t1 = Math.min(0.97, t0 + 0.2);
    for (const side of [-1, 1]) {
      const a = P(t0, 0);
      const c = P(t0 + 0.06, side, -hw(t0 + 0.06) * 0.45);
      const b = P(t1, side, -hw(t1) * 0.18);
      veins.push(`M${pt(a)}Q${pt(c)} ${pt(b)}`);
    }
  }
  // a tapered rib: wide at the stalk, a hairline at the tip
  const ribW = (t: number) => width * 0.05 * (1 - t);
  const ribTop: string[] = [];
  const ribBot: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = (i / 10) * 0.92;
    ribTop.push(pt([t * len, mid(t) - ribW(t)]));
    ribBot.push(pt([t * len, mid(t) + ribW(t)]));
  }
  return {
    body: 'M0 0L' + up.map(pt).join('L') + 'L' + lo.slice().reverse().map(pt).join('L') + 'Z',
    lit: 'M0 0L' + up.map(pt).join('L') + 'L' + ribPts.slice().reverse().map(pt).join('L') + 'Z',
    rib: 'M' + ribTop.join('L') + 'L' + ribBot.reverse().join('L') + 'Z',
    crease: 'M' + ribPts.slice(1).map(([x, y]) => pt([x, y + width * 0.06])).join('L'),
    // a soft gleam just inside the upper edge
    gleam: 'M' + Array.from({ length: 9 }, (_, i) => pt(P(0.22 + i * 0.07, -1, -hw(0.22 + i * 0.07) * 0.35))).join('L'),
    veins: veins.join(''),
    stalk: `M0 0Q${r1(-len * 0.08)} ${r1(len * 0.01)} ${r1(-len * 0.14)} ${r1(len * 0.04)}`,
  };
}

/** A sprig of baby's breath: a forked stem ending in clusters of tiny blossoms. */
export function sprigShape(x: number, y: number, ang: number, len: number, seed: number) {
  const rand = rng(seed);
  const dir = (ang * Math.PI) / 180;
  const bend = (rand() - 0.5) * len * 0.2;
  const at = (t: number): [number, number] => [
    x + Math.cos(dir) * len * t - Math.sin(dir) * bend * t * (1 - t) * 4,
    y + Math.sin(dir) * len * t + Math.cos(dir) * bend * t * (1 - t) * 4,
  ];
  let stems = 'M' + [0, 0.25, 0.5, 0.75, 1].map((t) => pt(at(t))).join('L');
  let dots = '';
  let hearts = '';
  const cluster = (cx: number, cy: number, n: number, spread: number) => {
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = spread * Math.sqrt(rand());
      const px = cx + Math.cos(a) * d;
      const py = cy + Math.sin(a) * d;
      const r = 4.6 + rand() * 2.6;
      stems += `M${pt([cx, cy])}L${pt([px, py])}`;
      dots += `M${r1(px - r)} ${r1(py)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0`;
      hearts += `M${r1(px - 1.3)} ${r1(py)}a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0 -2.6 0`;
    }
  };
  const forks = 4;
  for (let k = 0; k < forks; k++) {
    const t = 0.3 + (k / forks) * 0.6;
    const base = at(t);
    const side = k % 2 ? 1 : -1;
    const a = dir + side * (0.55 + rand() * 0.35);
    const bl = len * (0.28 + rand() * 0.16) * (1 - t * 0.35);
    const end: [number, number] = [base[0] + Math.cos(a) * bl, base[1] + Math.sin(a) * bl];
    const ctl: [number, number] = [base[0] + Math.cos(a - side * 0.25) * bl * 0.55, base[1] + Math.sin(a - side * 0.25) * bl * 0.55];
    stems += `M${pt(base)}Q${pt(ctl)} ${pt(end)}`;
    cluster(end[0], end[1], 4 + Math.floor(rand() * 3), 13);
  }
  const tip = at(1);
  cluster(tip[0], tip[1], 6, 15);
  return { stems, dots, hearts };
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
