'use client';

// Guided scrolling. The invitation is a row of "stops", one per moment (the arch, the verse,
// the couple, the families, the church opening, the details card...). One swipe, one wheel
// flick or one arrow key glides to the next stop, and the scene's animation plays on the way.
// Input is locked while gliding so a hard flick never skips ahead. The RSVP form is a free zone:
// it scrolls normally, and only leaving it (past its top or bottom) glides on.
//
// Each stop is a point in a scene's own scroll timeline (0..1), worked out from the section's
// size, so the stops stay right on every screen size.

import { useEffect } from 'react';

type Stop = { sel: string; p: number; lead?: boolean };

// lead: scenes driven by useScrollTimeline start playing when their top is 75% up the screen
// (see LEAD there); the opening starts at the very top.
const STOPS: Stop[] = [
  { sel: '.opening', p: 0 },             // the arch and the names
  { sel: '.opening', p: 1 },             // the verse, with its hearts
  { sel: '.couple', p: 0.64, lead: true },   // the couple, with their names
  { sel: '.families', p: 0.72, lead: true }, // both families and their names
  { sel: '.holy', p: 0.5, lead: true },      // the church: doors open, bell rings
  { sel: '.holy', p: 1, lead: true },        // the ceremony details
  { sel: '.reception', p: 0.56, lead: true }, // the room lit, the couple in the arch
  { sel: '.reception', p: 0.96, lead: true }, // the reception details
  { sel: '.invite-env', p: 1, lead: true },   // the reply card out of its envelope
  // then the RSVP form (free zone), then:
  { sel: '.closing', p: 1, lead: true },      // the wreath, the last words, share / save the date
];
const LEAD = 0.75;

const SWIPE = 40; // px of finger travel that counts as a swipe
const WHEEL = 40; // accumulated wheel delta that counts as a flick
const QUIET = 180; // ms without wheel events before a new flick is accepted (outlasts trackpad inertia)

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // in-out cubic

export default function ScrollGuide() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let stops: number[] = [];
    let zone: [number, number] = [Infinity, Infinity]; // the RSVP form's free-scroll range

    const measure = () => {
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const at = (s: Stop) => {
        const el = document.querySelector<HTMLElement>(s.sel);
        if (!el) return null;
        const range = el.offsetHeight - vh;
        const y = s.lead ? el.offsetTop - vh * LEAD + s.p * (range + vh * LEAD) : el.offsetTop + s.p * range;
        return Math.round(Math.min(max, Math.max(0, y)));
      };
      const list = STOPS.map(at).filter((y): y is number => y !== null);
      const form = document.querySelector<HTMLElement>('.rsvp-sec');
      if (form) {
        const start = form.offsetTop;
        const end = Math.max(start, form.offsetTop + form.offsetHeight - vh);
        zone = [start, end];
        list.push(start, end);
      }
      list.push(max); // the very bottom, with the footer
      stops = [...new Set(list)].sort((a, b) => a - b);
    };

    // ---- the glide ------------------------------------------------------------------------
    let gliding = false;
    let raf: number | null = null;
    const glideTo = (target: number) => {
      const from = window.scrollY;
      const dist = Math.abs(target - from);
      if (dist < 2) return;
      // long enough to see the scene play, never sluggish
      const dur = Math.min(1700, Math.max(850, 450 + dist * 0.75));
      const t0 = performance.now();
      gliding = true;
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        window.scrollTo({ top: from + (target - from) * ease(t), behavior: 'instant' as ScrollBehavior });
        if (t < 1) raf = requestAnimationFrame(step);
        else {
          raf = null;
          gliding = false;
        }
      };
      raf = requestAnimationFrame(step);
    };
    const go = (dir: 1 | -1) => {
      const y = window.scrollY;
      const target = dir > 0 ? stops.find((s) => s > y + 4) : [...stops].reverse().find((s) => s < y - 4);
      if (target !== undefined) glideTo(target);
    };

    // inside the form, scrolling is free unless it would leave the form
    const inZone = (y: number) => y >= zone[0] - 2 && y <= zone[1] + 2;
    const free = (dir: 1 | -1) => {
      const y = window.scrollY;
      if (!inZone(y)) return false;
      return dir > 0 ? y < zone[1] - 2 : y > zone[0] + 2;
    };

    // ---- wheel and trackpad -----------------------------------------------------------------
    let acc = 0;
    let lastWheel = 0;
    let armed = true; // false until the current flick (and its inertia) has died down
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom
      const dir = e.deltaY > 0 ? 1 : -1;
      const now = performance.now();
      if (now - lastWheel > QUIET) {
        armed = true;
        acc = 0;
      }
      lastWheel = now;
      if (!gliding && free(dir)) return; // let the form scroll natively
      e.preventDefault();
      if (gliding || !armed) return;
      acc += e.deltaY;
      if (Math.abs(acc) >= WHEEL) {
        armed = false;
        acc = 0;
        go(dir);
      }
    };

    // ---- touch ---------------------------------------------------------------------------
    let startY = 0;
    let lastY = 0;
    let native = false; // this swipe is scrolling the form
    let taken = false; // this swipe has already moved us on
    const onTouchStart = (e: TouchEvent) => {
      touching = true;
      startY = lastY = e.touches[0].clientY;
      native = false;
      taken = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const dir = y < lastY ? 1 : -1; // finger up = page down
      lastY = y;
      if (native || (!gliding && !taken && free(dir))) {
        native = true;
        return;
      }
      e.preventDefault();
      if (gliding || taken) return;
      const dy = startY - y;
      if (Math.abs(dy) >= SWIPE) {
        taken = true;
        go(dy > 0 ? 1 : -1);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      touching = e.touches.length > 0;
      onScroll(); // a swipe that ends without scrolling still gets checked
      // a short, quick flick still counts
      if (native || taken || gliding) return;
      const dy = startY - (e.changedTouches[0]?.clientY ?? startY);
      if (Math.abs(dy) >= 18) go(dy > 0 ? 1 : -1);
    };

    // ---- settling ------------------------------------------------------------------------
    // When scrolling comes to rest between stops (a strong fling out of the form, a scrollbar
    // drag), glide to the nearest stop. Inside the form, anywhere is a fine place to rest.
    let touching = false;
    let settleTimer: number | undefined;
    const settle = () => {
      if (gliding || touching) return;
      const y = window.scrollY;
      if (inZone(y)) return;
      const nearest = stops.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a), stops[0]);
      if (Math.abs(nearest - y) > 3) glideTo(nearest);
    };
    const onScroll = () => {
      if (gliding) return;
      clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 160);
    };

    // ---- keys ----------------------------------------------------------------------------
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName))) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      let dir: 1 | -1 | 0 = 0;
      if (['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey)) dir = 1;
      if (['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey)) dir = -1;
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        glideTo(e.key === 'Home' ? 0 : stops[stops.length - 1]);
        return;
      }
      if (!dir) return;
      if (!gliding && free(dir)) return;
      e.preventDefault();
      if (!gliding) go(dir);
    };

    // in-page links (the reply card's "Reply below") glide too
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href')!.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      glideTo(Math.min(el.getBoundingClientRect().top + window.scrollY - 16, stops[stops.length - 1]));
    };

    measure();
    // fonts and images can change section heights after the first paint
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('resize', measure);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick);
    document.documentElement.classList.add('guided');
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
      clearTimeout(settleTimer);
      document.documentElement.classList.remove('guided');
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
