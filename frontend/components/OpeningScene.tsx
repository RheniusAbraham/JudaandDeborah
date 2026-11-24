'use client';

import { useEffect, useRef } from 'react';
import { createScope, createTimeline, stagger, type Timeline } from 'animejs';
import ArchArt from './ArchArt';
import Hook, { hookIn } from './Hook';
import { FloatingHearts, Flourish } from './VerseHearts';
import { wedding } from '@/lib/wedding';

const TL = 1000; // the scroll timeline runs in "progress milliseconds": 0..1000

function Name({ word }: { word: string }) {
  return (
    <span className="n" aria-hidden="true">
      {word.split('').map((c, i) => (
        <span key={i} className="ch">
          {c}
        </span>
      ))}
    </span>
  );
}

/** The cue's tap: a gentle scroll to the verse. */
function next() {
  window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
}

export default function OpeningScene() {
  const root = useRef<HTMLElement>(null);

  // 1. Page-load moment: the arch appears, then the names write themselves in.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // The CSS safety net (which shows everything at 6s) stands down only once the intro has
    // actually played to the end. If it stalls (a throttled or busy phone), the net still shows
    // the names. Until 6s the net is only waiting, so it never fights the intro.
    const done = () => {
      document.documentElement.classList.add('intro-run');
      // the names have landed: drop their leftover (identity) transforms, so Safari stops
      // treating each letter as a separately moving box and draws the names as plain text
      root.current?.querySelectorAll<HTMLElement>('.names .ch, .names .and').forEach((el) => (el.style.transform = ''));
    };
    const scope = createScope({ root }).add(() => {
      createTimeline({ defaults: { ease: 'outQuart', duration: 900 }, onComplete: done })
        .add('.layers', { opacity: [0, 1], scale: [1.045, 1], duration: 1900 })
        .add('.together', { opacity: [0, 1], translateY: [10, 0] }, '-=1100')
        .add('.names .ch', { opacity: [0, 1], translateY: ['.4em', '0em'], delay: stagger(65), duration: 1300, ease: 'outExpo' }, '-=650')
        .add('.and', { opacity: [0, 1], scale: [0.6, 1], duration: 1000, ease: 'outBack(1.7)' }, '-=1300')
        .add('.after', { opacity: [0, 1], translateY: [12, 0], delay: stagger(130) }, '-=800');
    });
    return () => scope.revert();
  }, []);

  // 2. Scroll moment: walking through the arch. Scroll position drives a paused timeline.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const s: { tl: Timeline | null } = { tl: null };
    const scope = createScope({ root }).add(() => {
      // A camera push through the arch. Everything grows from the middle of the opening,
      // nearer things faster (that difference is the depth), and the front fades as you pass it.
      s.tl = createTimeline({ autoplay: false, defaults: { ease: 'inQuad' } })
        // the names come toward you and dissolve
        .add('.inside', { scale: [1, 1.35], opacity: [1, 0], duration: 320, ease: 'inSine' }, 0)
        // the far wall barely moves
        .add('.layer-plate', { scale: [1, 1.3], duration: TL, ease: 'inOutSine' }, 0)
        // the bead strings are a little closer
        .add('.layer-beads', { scale: [1, 2.1], duration: 760 }, 0)
        .add('.layer-beads', { opacity: [1, 0], duration: 220, ease: 'linear' }, 480)
        // the arch itself is closest: curtains, swag and flowers rush past
        .add(['.layer-left', '.layer-right', '.layer-top', '.layer-bottom'], { scale: [1, 3.4], duration: 820 }, 0)
        .add(['.layer-left', '.layer-right', '.layer-top', '.layer-bottom'], { opacity: [1, 0], duration: 200, ease: 'linear' }, 600)
        // and the verse is waiting on the wall beyond
        .add('.verse', { opacity: [0, 1], scale: [0.92, 1], duration: 300, ease: 'outQuad' }, 480)
        // and once it has settled, a nudge onward
        .add('.hook', hookIn, 840);
    });

    let target = 0;
    let shown = 0;
    let raf: number | null = null;
    let last = 0;

    // the hearts float only while the verse is showing and the scene is on screen
    const verse = el.querySelector('.verse');
    let inView = true;
    const syncHearts = () => {
      verse?.classList.toggle('hearts-run', inView && shown > 0.5);
      el.classList.toggle('cue-off', shown > 0.04); // the guest has started: the cue's job is done
    };
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      syncHearts();
    });
    io.observe(el);

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
      syncHearts();
    };
    const onScroll = () => {
      const p = progress();
      // once scrolled past, the arch is pinned at its end state: don't redo the work
      if (p === target && raf === null && p === shown) return;
      target = p;
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    target = shown = progress();
    s.tl?.seek(shown * TL);
    syncHearts();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
      io.disconnect();
      scope.revert();
    };
  }, []);

  return (
    <section className="opening" id="top" ref={root} aria-label="Invitation">
      <div className="pin">
        <div className="stage">
          <div className="layers">
            <ArchArt />
          </div>
          <div className="inside">
            <p className="together">Together with their families</p>
            <h1 className="names">
              <span className="sr-only">
                {wedding.partnerOne} and {wedding.partnerTwo}
              </span>
              <Name word={wedding.partnerOne} />
              <span className="and" aria-hidden="true">
                &amp;
              </span>
              <Name word={wedding.partnerTwo} />
            </h1>
            <p className="invite after">invite you to celebrate their wedding</p>
            <p className="when after">{wedding.dateLabel}</p>
            <p className="where after">{wedding.church.name}</p>
          </div>
        </div>

        <button type="button" className="cue" onClick={next}>
          <span className="cue-touch">Swipe up to open the invitation</span>
          <span className="cue-mouse">Scroll down to open the invitation</span>
          <span className="cue-arrow" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        <blockquote className="verse">
          <FloatingHearts />
          <p>The Lord has done great things for us, and we are filled with joy.</p>
          <Flourish />
          <cite>Psalm 126:3</cite>
        </blockquote>
        <Hook>Meet the bride and groom</Hook>
      </div>
    </section>
  );
}
