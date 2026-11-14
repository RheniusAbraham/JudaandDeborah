'use client';

// Drives a paused Anime.js timeline from scroll position through a section.
// The section's scroll progress (0 at its top reaching the top of the screen, 1 when its end
// does) is eased toward smoothly, so motion glides instead of jumping with the wheel.
// The timeline is built in "progress milliseconds": 0..1000.

import { useEffect, type RefObject } from 'react';
import { createScope, type Timeline } from 'animejs';

export const TL = 1000;

export function useScrollTimeline(root: RefObject<HTMLElement | null>, build: () => Timeline) {
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const s: { tl: Timeline | null } = { tl: null };
    const scope = createScope({ root }).add(() => {
      s.tl = build();
    });

    let target = 0;
    let shown = 0;
    let raf: number | null = null;
    let last = 0;
    const progress = () => {
      const r = el.getBoundingClientRect();
      const range = el.offsetHeight - window.innerHeight;
      return range > 0 ? Math.min(1, Math.max(0, -r.top / range)) : 0;
    };
    const tick = (now: number) => {
      const dt = Math.min(100, now - (last || now));
      last = now;
      shown += (target - shown) * (1 - Math.pow(1 - 0.14, dt / 16.667)); // same feel at 60Hz and 120Hz
      if (Math.abs(target - shown) < 0.0004) {
        shown = target;
        raf = null;
        last = 0;
      } else {
        raf = requestAnimationFrame(tick);
      }
      s.tl?.seek(shown * TL);
    };
    const onScroll = () => {
      const p = progress();
      // nothing to do when this scene's progress hasn't changed (it is off-screen above or
      // below, pinned at 0 or 1): skip the frame entirely instead of re-seeking every element
      if (p === target && raf === null && p === shown) return;
      target = p;
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    target = shown = progress();
    s.tl?.seek(shown * TL);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
      scope.revert();
    };
    // build is defined inline by the caller and only read once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root]);
}
