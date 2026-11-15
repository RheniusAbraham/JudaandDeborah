'use client';

// Scene 7: the closing. Leaves and roses drift in from all around and settle into a wreath;
// inside it, the closing words and the couple's names write themselves in; then two last
// things to do: share the invitation, and save the date.

import { useMemo, useRef } from 'react';
import { createTimeline, stagger } from 'animejs';
import { Rose, Leaf } from './ArchArt';
import ShareButton from './ShareButton';
import { rng } from '@/lib/arch/geom';
import { wedding, calendarUrl } from '@/lib/wedding';
import { useScrollTimeline } from '@/lib/useScrollTimeline';

const r0 = (n: number) => Math.round(n);
type Tone = 'pink' | 'coral' | 'peach';

function Wreath() {
  const parts = useMemo(() => {
    const rand = rng(1717);
    const cx = 500, cy = 500, R = 392;
    // where each piece starts: scattered out beyond the wreath, in the direction it sits
    const from = (a: number) => {
      const d = 520 + rand() * 520;
      return { dx: r0(Math.cos(a) * d + (rand() - 0.5) * 240), dy: r0(Math.sin(a) * d + (rand() - 0.5) * 240), spin: r0((rand() - 0.5) * 220) };
    };
    const leaves = Array.from({ length: 44 }, (_, i) => {
      const a = (i / 44) * Math.PI * 2;
      const rr = R + (rand() - 0.5) * 70;
      return {
        x: r0(cx + Math.cos(a) * rr), y: r0(cy + Math.sin(a) * rr),
        a: r0((a * 180) / Math.PI + 90 + (i % 2 ? 40 : -40)), len: r0(60 + rand() * 34), ...from(a),
      };
    });
    const tones: Tone[] = ['pink', 'peach', 'coral', 'pink', 'peach', 'pink', 'coral'];
    const roses = Array.from({ length: 26 }, (_, i) => {
      const a = (i / 26) * Math.PI * 2 + 0.06;
      const rr = R + (rand() - 0.5) * 40;
      // fuller at the bottom of the wreath, lighter at the top
      const size = 26 + 18 * (0.5 + 0.5 * Math.sin(a)) + rand() * 8;
      return { x: r0(cx + Math.cos(a) * rr), y: r0(cy + Math.sin(a) * rr), r: r0(size), tone: tones[i % tones.length], seed: 1800 + i, rot: r0(rand() * 360), ...from(a) };
    });
    return { leaves, roses };
  }, []);

  return (
    <svg className="wreath-art" viewBox="0 0 1000 1000" aria-hidden="true">
      <circle cx={500} cy={500} r={392} fill="none" stroke="#8a6a52" strokeOpacity={0.35} strokeWidth={6} className="wreath-ring" />
      {parts.leaves.map((l, i) => (
        <g key={i} className="w-leaf" data-dx={l.dx} data-dy={l.dy} data-spin={l.spin}>
          <Leaf x={l.x} y={l.y} len={l.len} a={l.a} />
        </g>
      ))}
      {parts.roses.map((r, i) => (
        <g key={i} className="w-rose" data-dx={r.dx} data-dy={r.dy} data-spin={r.spin}>
          <Rose x={r.x} y={r.y} r={r.r} tone={r.tone} seed={r.seed} rot={r.rot} />
        </g>
      ))}
    </svg>
  );
}

function Names() {
  const split = (w: string) =>
    w.split('').map((c, i) => (
      <span key={i} className="ch">
        {c}
      </span>
    ));
  return (
    <p className="close-names" aria-label={`${wedding.partnerOne} and ${wedding.partnerTwo}`}>
      <span aria-hidden="true">{split(wedding.partnerOne)}</span>
      <span className="close-amp" aria-hidden="true">
        &amp;
      </span>
      <span aria-hidden="true">{split(wedding.partnerTwo)}</span>
    </p>
  );
}

export default function ClosingScene() {
  const root = useRef<HTMLElement>(null);
  const num = (el: unknown, key: string) => Number((el as HTMLElement).dataset[key]);

  useScrollTimeline(root, () =>
    createTimeline({ autoplay: false, defaults: { ease: 'outCubic' } })
      // starting states
      .set('.close-text > *', { opacity: 0, translateY: 14 }, 0)
      .set('.close-names .ch, .close-amp', { opacity: 0 }, 0)
      .set('.close-actions', { opacity: 0, translateY: 18 }, 0)
      .set('.wreath-ring', { opacity: 0 }, 0)
      // the wreath gathers: leaves first, then roses, each drifting home from where it started
      .add('.wreath-ring', { opacity: [0, 1], duration: 200, ease: 'linear' }, 0)
      .add('.w-leaf', {
        translateX: { from: (el: unknown) => num(el, 'dx'), to: 0 },
        translateY: { from: (el: unknown) => num(el, 'dy'), to: 0 },
        rotate: { from: (el: unknown) => num(el, 'spin'), to: 0 },
        opacity: [0, 1],
        duration: 340,
        delay: stagger(4, { from: 'random' }),
      }, 0)
      .add('.w-rose', {
        translateX: { from: (el: unknown) => num(el, 'dx'), to: 0 },
        translateY: { from: (el: unknown) => num(el, 'dy'), to: 0 },
        rotate: { from: (el: unknown) => num(el, 'spin'), to: 0 },
        opacity: [0, 1],
        duration: 380,
        delay: stagger(6, { from: 'random' }),
      }, 120)
      .add('.wreath', { scale: [0.9, 1], duration: 600, ease: 'outSine' }, 0)
      // the words inside it
      .add('.close-kicker', { opacity: [0, 1], translateY: [14, 0], duration: 140 }, 520)
      .add('.close-names .ch, .close-amp', { opacity: [0, 1], translateY: ['.3em', '0em'], duration: 160, delay: stagger(12) }, 580)
      .add('.close-names', { opacity: [0, 1], translateY: [14, 0], duration: 60 }, 580)
      .add('.close-date', { opacity: [0, 1], translateY: [14, 0], duration: 140 }, 720)
      .add('.close-verse', { opacity: [0, 1], translateY: [14, 0], duration: 140 }, 780)
      // and the last two things to do
      .add('.close-actions', { opacity: [0, 1], translateY: [18, 0], duration: 160 }, 840),
  );

  return (
    <>
      <section className="closing" ref={root} aria-labelledby="close-title">
        <div className="cl-pin">
          <div className="wreath">
            <Wreath />
            <div className="close-text">
              <h2 id="close-title" className="close-kicker">
                We can’t wait to celebrate with you
              </h2>
              <Names />
              <p className="close-date">{wedding.dateLabel}</p>
              <p className="close-verse">
                “Love never fails.” <span>1 Corinthians 13:8</span>
              </p>
            </div>
          </div>
          <div className="close-actions">
            <ShareButton />
            <a
              className="btn ghost"
              href={calendarUrl(`${wedding.partnerOne} & ${wedding.partnerTwo}: Holy Matrimony`, wedding.church)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Save the date
            </a>
          </div>
        </div>
      </section>

      <footer className="site-foot">
        <p className="foot-love">With love and gratitude</p>
        <p className="foot-names">
          {wedding.partnerOne} &amp; {wedding.partnerTwo}
        </p>
        <p className="foot-date">{wedding.footerDate}</p>
      </footer>
    </>
  );
}
