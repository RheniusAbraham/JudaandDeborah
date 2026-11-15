// The verse page's quiet company: a few hand-drawn hearts drifting up the sides, and a gold
// flourish under the verse. The hearts move with plain CSS animation (transform and opacity
// only, so the graphics chip does the work); OpeningScene runs them only while the verse is on
// screen.

import { rng } from '@/lib/arch/geom';

const r1 = (n: number) => Math.round(n * 10) / 10;

type Heart = {
  x: number; // left edge, % of the screen
  xm: number; // the same on phones, where the verse spans nearly the full width: hug the edges
  size: number; // px
  o: number; // opacity at its fullest
  dur: number; // seconds to rise the whole screen
  delay: number; // negative: already part-way up when the verse arrives
  sway: number; // px either side
  swayDur: number;
  rot: number; // degrees either side
  kind: 'pink' | 'peach' | 'gold';
  rest: number; // where it sits when motion is reduced, % from the top
};

// Three depths: near hearts are bigger, stronger and quicker; far ones small, pale and slow.
// Near and middle hearts keep to the outer thirds; only faint far ones drift behind the verse.
const HEARTS: Heart[] = (() => {
  const rand = rng(1263);
  const depths = ['near', 'far', 'mid', 'near', 'mid', 'far', 'mid', 'near', 'far', 'mid', 'far', 'near'] as const;
  const kinds = ['pink', 'peach', 'gold', 'pink', 'peach', 'pink', 'gold', 'peach', 'pink', 'peach', 'gold', 'pink'] as const;
  return depths.map((depth, i) => {
    const side = i % 2 === 0 ? 'left' : 'right';
    const x =
      depth === 'far' && i % 3 === 0
        ? 30 + rand() * 40 // a faint one behind the verse
        : side === 'left'
          ? 3 + rand() * 24
          : 73 + rand() * 22;
    const xm = side === 'left' ? 1 + rand() * 9 : 84 + rand() * 9;
    const size = depth === 'near' ? 28 + rand() * 8 : depth === 'mid' ? 19 + rand() * 6 : 12 + rand() * 5;
    const o = depth === 'near' ? 0.8 : depth === 'mid' ? 0.6 : 0.38;
    const dur = depth === 'near' ? 9 + rand() * 2.5 : depth === 'mid' ? 11.5 + rand() * 2 : 14 + rand() * 2.5;
    return {
      x: r1(x),
      xm: r1(xm),
      size: r1(size),
      o,
      dur: r1(dur),
      delay: r1(-(i / depths.length) * dur - rand() * 1.5),
      sway: r1(8 + rand() * 14),
      swayDur: r1(2.6 + rand() * 1.8),
      rot: r1(6 + rand() * 10),
      kind: kinds[i],
      rest: r1(12 + rand() * 76),
    };
  });
})();

const HEART = 'M50 88C22 68 5 50 10 30C14 13 38 8 50 27C62 8 86 13 90 30C95 50 78 68 50 88Z';

function HeartShape({ kind }: { kind: Heart['kind'] }) {
  if (kind === 'gold') {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path d={HEART} fill="none" stroke="#b8873f" strokeWidth={5} strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d={HEART} fill={`url(#vh-${kind})`} stroke="#5a2f2a" strokeOpacity={0.5} strokeWidth={3} strokeLinejoin="round" />
      {/* light catching the upper left lobe */}
      <path d="M24 30C24 22 31 18 38 21" fill="none" stroke="#ffffff" strokeOpacity={0.75} strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}

export function FloatingHearts() {
  return (
    <div className="hearts" aria-hidden="true">
      <svg width="0" height="0" style={{ position: 'absolute' }} focusable="false">
        <defs>
          <radialGradient id="vh-pink" cx=".38" cy=".34" r=".75">
            <stop offset="0" stopColor="#fbd0d8" />
            <stop offset=".55" stopColor="#ec8ea0" />
            <stop offset="1" stopColor="#d5627a" />
          </radialGradient>
          <radialGradient id="vh-peach" cx=".38" cy=".34" r=".75">
            <stop offset="0" stopColor="#fee3d3" />
            <stop offset=".55" stopColor="#f6b39b" />
            <stop offset="1" stopColor="#e88d74" />
          </radialGradient>
        </defs>
      </svg>
      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="heart"
          style={
            {
              '--x': `${h.x}%`,
              '--xm': `${h.xm}%`,
              '--size': `${h.size}px`,
              '--o': h.o,
              '--dur': `${h.dur}s`,
              '--delay': `${h.delay}s`,
              '--sway': `${h.sway}px`,
              '--sdur': `${h.swayDur}s`,
              '--rot': `${h.rot}deg`,
              '--rest': `${h.rest}%`,
            } as React.CSSProperties
          }
        >
          <span className="heart-sway">
            <HeartShape kind={h.kind} />
          </span>
        </span>
      ))}
    </div>
  );
}

/** A fine gold flourish: two tapering strokes curling in to a small heart. */
export function Flourish() {
  return (
    <svg className="flourish" viewBox="0 0 260 30" aria-hidden="true">
      <defs>
        <linearGradient id="fl-l" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#b8873f" stopOpacity="0" />
          <stop offset=".55" stopColor="#b8873f" stopOpacity=".9" />
          <stop offset="1" stopColor="#b8873f" />
        </linearGradient>
        <linearGradient id="fl-r" x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor="#b8873f" stopOpacity="0" />
          <stop offset=".55" stopColor="#b8873f" stopOpacity=".9" />
          <stop offset="1" stopColor="#b8873f" />
        </linearGradient>
      </defs>
      {/* left: a long line that curls into a loop beside the heart */}
      <path d="M6 15H92C102 15 106 8 100 5C94 2 89 9 95 13C99 16 106 16 114 15" fill="none" stroke="url(#fl-l)" strokeWidth={1.3} strokeLinecap="round" />
      {/* right: its mirror */}
      <path d="M254 15H168C158 15 154 8 160 5C166 2 171 9 165 13C161 16 154 16 146 15" fill="none" stroke="url(#fl-r)" strokeWidth={1.3} strokeLinecap="round" />
      {/* small dots, like a pen lifting off */}
      <circle cx={70} cy={20} r={1.3} fill="#b8873f" fillOpacity={0.7} />
      <circle cx={190} cy={20} r={1.3} fill="#b8873f" fillOpacity={0.7} />
      {/* the heart in the middle */}
      <path d="M130 23C123 18 119 14 120.5 10.5C121.7 8 125.5 7.5 130 11C134.5 7.5 138.3 8 139.5 10.5C141 14 137 18 130 23Z" fill="#c99a52" fillOpacity={0.25} stroke="#b8873f" strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  );
}
