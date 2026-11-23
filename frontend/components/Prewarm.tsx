'use client';

// Scenes that are off screen aren't drawn at all (content-visibility: auto), which keeps every
// scroll frame light. The catch: the first time a scene comes near the screen, the browser must
// lay out its thousands of shapes in one go, a visible hitch right at a scene change.
//
// So after the page has loaded, while the visitor is still reading the opening, each scene is
// laid out once in the background, one per idle moment, and then goes back to being skipped.
// The browser keeps that layout, so when the scene later scrolls in, only painting is left.

import { useEffect } from 'react';

const SCENES = ['.couple', '.families', '.holy', '.order', '.reception', '.invite-env', '.closing'];

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

export default function Prewarm() {
  useEffect(() => {
    const w = window as IdleWindow;
    if ((w as unknown as { __noPrewarm?: boolean }).__noPrewarm) return; // for measuring without it
    const idle = (cb: () => void) => (w.requestIdleCallback ? w.requestIdleCallback(cb, { timeout: 1500 }) : window.setTimeout(cb, 120));
    const cancel = (id: number) => (w.cancelIdleCallback ? w.cancelIdleCallback(id) : clearTimeout(id));
    let i = 0;
    let id = 0;
    const next = () => {
      const el = document.querySelector<HTMLElement>(SCENES[i++]);
      if (!el) return;
      // only if it's still far off: one already on screen is being drawn anyway
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight * 2 || r.bottom < -window.innerHeight) {
        el.style.contentVisibility = 'visible';
        void el.getBoundingClientRect(); // lays the scene out now, in this idle moment
        el.style.contentVisibility = '';
      }
      if (i < SCENES.length) id = idle(next);
    };
    // start once the intro has had the stage to itself
    const start = window.setTimeout(() => (id = idle(next)), 3500);
    return () => {
      clearTimeout(start);
      cancel(id);
    };
  }, []);
  return null;
}
