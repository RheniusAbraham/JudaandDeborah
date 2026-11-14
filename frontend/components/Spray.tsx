'use client';

import { Rose, Leaf, Trail } from './ArchArt';

/** A small spray of roses for a bottom corner (drawn for the left; mirror it for the right). */
export default function Spray() {
  return (
    <svg viewBox="0 0 420 360" aria-hidden="true">
      <Trail a={[60, 360]} b={[40, 70]} bend={-24} n={8} r={15} />
      <Leaf x={120} y={300} len={110} a={-120} />
      <Leaf x={150} y={320} len={100} a={-60} />
      <Leaf x={210} y={330} len={96} a={-30} />
      <Leaf x={90} y={250} len={90} a={-150} />
      <Leaf x={250} y={345} len={80} a={-10} />
      <Rose x={110} y={230} r={34} tone="peach" seed={71} />
      <Rose x={190} y={290} r={50} tone="pink" seed={72} rot={20} />
      <Rose x={90} y={320} r={44} tone="coral" seed={73} rot={-15} />
      <Rose x={280} y={350} r={36} tone="pink" seed={74} />
    </svg>
  );
}
