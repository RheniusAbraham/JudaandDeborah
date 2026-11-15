// A part of a drawing lifted out into its own little <svg>, placed exactly over the main drawing.
//
// Why: the browser can only slide, scale, spin or fade a whole box on the GPU. When a scroll
// scene moved a door, a bell or a single rose *inside* a big drawing, the browser had to repaint
// and re-layer the entire drawing on every frame; on phones that was the stutter. A Piece is its
// own box, so moving it costs the GPU almost nothing and repaints nothing.
//
// `frame` is the main drawing's viewBox ([x, y, width, height]); the main drawing must exactly
// fill the Piece's positioned parent (same proportions). `box` is the area of the drawing this
// Piece shows, in the same coordinates. The Piece's own box is that area, so CSS
// transform-origins like "50% 100%" mean the bottom middle of the piece.

import type { CSSProperties, ReactNode } from 'react';

export type Box = [x: number, y: number, w: number, h: number];

const pc = (n: number) => `${Math.round(n * 10000) / 10000}%`;

export default function Piece({
  frame,
  box,
  className,
  style,
  children,
  ...data
}: {
  frame: Box;
  box: Box;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
} & Record<`data-${string}`, string | number>) {
  const [fx, fy, fw, fh] = frame;
  const [x, y, w, h] = box;
  return (
    <svg
      className={`piece${className ? ` ${className}` : ''}`}
      viewBox={`${r(x)} ${r(y)} ${r(w)} ${r(h)}`}
      style={{ left: pc(((x - fx) / fw) * 100), top: pc(((y - fy) / fh) * 100), width: pc((w / fw) * 100), height: pc((h / fh) * 100), ...style }}
      aria-hidden="true"
      {...data}
    >
      {children}
    </svg>
  );
}

const r = (n: number) => Math.round(n * 10) / 10;

/** The area a Leaf (from x, y, length len, at angle a degrees, width ratio w) covers, padded. */
export function leafBox(x: number, y: number, len: number, a: number, w = 0.32): Box {
  const rad = (a * Math.PI) / 180;
  const tx = x + Math.cos(rad) * len;
  const ty = y + Math.sin(rad) * len;
  const pad = len * w * 0.6 + 4;
  const x0 = Math.min(x, tx) - pad;
  const y0 = Math.min(y, ty) - pad;
  return [x0, y0, Math.abs(tx - x) + pad * 2, Math.abs(ty - y) + pad * 2];
}

/** The area a Rose of radius r at x, y covers (with its soft shadow), padded. */
export function roseBox(x: number, y: number, r: number): Box {
  const s = r * 1.2;
  return [x - s, y - s, s * 2, s * 2];
}
