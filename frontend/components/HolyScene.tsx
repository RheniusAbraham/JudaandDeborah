'use client';

// Scene 4: The Holy Matrimony. The church rises against a soft sky; its doors swing open,
// the stained glass lights up and the bell swings; light spills down the steps; we walk in
// through the doorway into the warm light, where the ceremony details are waiting.

import { useRef } from 'react';
import { createTimeline, stagger } from 'animejs';
import ChurchArt from './ChurchArt';
import { wedding, mapsUrl, calendarUrl } from '@/lib/wedding';
import { useScrollTimeline } from '@/lib/useScrollTimeline';
import Hook, { hookIn } from './Hook';

export default function HolyScene() {
  const root = useRef<HTMLElement>(null);
  const { church } = wedding;

  useScrollTimeline(root, () =>
    createTimeline({ autoplay: false, defaults: { ease: 'outCubic' } })
      // starting states live in globals.css ("Starting states for the scroll scenes")
      // the church rises into view, the heading with it
      .add('.h-head', { opacity: [0, 1], translateY: [16, 0], duration: 200 }, 0)
      .add('.church', { translateY: ['16%', '0%'], opacity: [0, 1], duration: 260 }, 0)
      // the doors swing open (each leaf narrows toward its hinge and tilts away, like a door turning)
      .add('.door-l', { scaleX: [1, 0.12], skewY: ['0deg', '-9deg'], duration: 300, ease: 'inOutSine' }, 230)
      .add('.door-r', { scaleX: [1, 0.12], skewY: ['0deg', '9deg'], duration: 300, ease: 'inOutSine' }, 230)
      // light: the stained glass glows and light spills down the steps
      .add('.win-glow', { opacity: [0, 1], duration: 300, ease: 'linear' }, 250)
      .add('.rays', { opacity: [0, 1], duration: 260, ease: 'linear' }, 300)
      // the bell rings: a swing that settles
      .add('.bell', {
        rotate: [
          { to: 16, duration: 70, ease: 'outSine' },
          { to: -12, duration: 90, ease: 'inOutSine' },
          { to: 8, duration: 80, ease: 'inOutSine' },
          { to: -4, duration: 70, ease: 'inOutSine' },
          { to: 0, duration: 60, ease: 'inOutSine' },
        ],
      }, 280)
      // the urns by the steps come into bloom as the church settles
      .add('.urn-leaf', { opacity: [0, 1], scale: [0, 1], duration: 120, delay: stagger(5) }, 120)
      .add('.urn-rose', { opacity: [0, 1], scale: [0, 1], rotate: [-40, 0], duration: 150, delay: stagger(9), ease: 'outBack(1.5)' }, 170)
      // walk in through the doorway, into the light (the title steps aside first)
      .add('.h-head', { opacity: [1, 0], translateY: [0, -20], duration: 120, ease: 'inQuad' }, 540)
      .add('.church', { scale: [1, 3.8], duration: 300, ease: 'inQuad' }, 560)
      .add('.church', { opacity: [1, 0], duration: 120, ease: 'linear' }, 740)
      .add('.h-light', { opacity: [0, 1], duration: 220, ease: 'linear' }, 640)
      // the details, waiting in the light
      .add('.h-card', { opacity: [0, 1], translateY: [28, 0], duration: 180 }, 820)
      .add('.hook', hookIn, 900),
  );

  return (
    <section className="holy" ref={root} aria-labelledby="holy-title">
      <div className="hpin">
        <div className="h-sky" aria-hidden="true" />
        <header className="h-head">
          <h2 id="holy-title" className="h-title">The Holy Matrimony</h2>
          <p className="h-date">{wedding.dateLabel}</p>
        </header>

        <div className="church">
          <ChurchArt />
        </div>

        <div className="h-light" aria-hidden="true" />

        <div className="h-card">
          <p className="h-time">{church.time}</p>
          <p className="h-church">{church.name}</p>
          <p className="h-address">{church.address}</p>
          <div className="h-actions">
            <a className="btn" href={mapsUrl(church)} target="_blank" rel="noopener noreferrer">
              Open in Maps
            </a>
            <a
              className="btn ghost"
              href={calendarUrl(`${wedding.partnerOne} & ${wedding.partnerTwo}: Holy Matrimony`, church)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Add to calendar
            </a>
          </div>
        </div>
        <Hook>The order of service</Hook>
      </div>
    </section>
  );
}
