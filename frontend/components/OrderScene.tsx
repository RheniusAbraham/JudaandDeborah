'use client';

// Scene 4b: The Order of Service. We are still inside the church, in the warm light the
// Holy Matrimony scene ends in. A thin gold line draws down like an aisle, and each part of the
// service lights up in turn as the line reaches it; a small cross closes the service.

import { useRef } from 'react';
import { createTimeline, stagger } from 'animejs';
import { wedding } from '@/lib/wedding';
import { useScrollTimeline } from '@/lib/useScrollTimeline';
import Hook, { hookIn } from './Hook';

export default function OrderScene() {
  const root = useRef<HTMLElement>(null);
  const { church } = wedding;
  const items = church.order;
  const lastTimed = items.reduce((last, it, i) => (it.time ? i : last), -1);

  // the service unfolds between 160 and 820; each item gets an equal step
  const start = 160;
  const step = Math.floor(640 / items.length);

  useScrollTimeline(root, () =>
    createTimeline({ autoplay: false, defaults: { ease: 'outCubic' } })
      // starting states: the list waits unlit
      .set('.o-text', { opacity: 0, translateX: -10 }, 0)
      .set('.o-dot', { opacity: 0, scale: 0 }, 0)
      .set('.o-seg', { scaleY: 0 }, 0)
      .set('.o-end', { opacity: 0, scale: 0.4, rotate: -30 }, 0)
      // the heading settles in the light
      .add('.o-head', { opacity: [0, 1], translateY: [16, 0], duration: 160 }, 0)
      // each part lights up in turn: its dot glows, its words arrive, then the line runs on
      .add('.o-dot', { opacity: [0, 1], scale: [0, 1], duration: 90, delay: stagger(step), ease: 'outBack(2)' }, start)
      .add('.o-text', { opacity: [0, 1], translateX: [-10, 0], duration: 120, delay: stagger(step) }, start + 15)
      .add('.o-seg', { scaleY: [0, 1], duration: step, delay: stagger(step), ease: 'linear' }, start + 40)
      // the service closes with a small cross
      .add('.o-end', { opacity: [0, 1], scale: [0.4, 1], rotate: [-30, 0], duration: 140, ease: 'outBack(1.6)' }, start + step * items.length)
      .add('.hook', hookIn, 900),
  );

  return (
    <section className="order" ref={root} aria-labelledby="order-title">
      <div className="opin">
        <header className="o-head">
          <h2 id="order-title" className="o-title">Order of Service</h2>
          <p className="o-sub">{church.name}</p>
        </header>

        <ol className="o-list">
          {items.map((it, i) => (
            <li key={it.name} className={`o-item${it.time ? ' timed' : ''}${i === lastTimed ? ' last-timed' : ''}`}>
              <span className="o-dot" aria-hidden="true" />
              {i < items.length - 1 && <span className="o-seg" aria-hidden="true" />}
              <span className="o-text">
                <span className="o-name">{it.name}</span>
                {it.time && <span className="o-time">{it.time}</span>}
              </span>
            </li>
          ))}
        </ol>

        <svg className="o-end" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.5v19M5.5 8.5h13" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
        </svg>

        <Hook>And then, an evening to celebrate</Hook>
      </div>
    </section>
  );
}
