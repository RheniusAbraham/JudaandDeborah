'use client';

// Scene 5: The Reception. A dim evening hall; as you scroll, the fairy lights come on bulb by
// bulb, the chandeliers glow, the candles catch, the room warms from dusk to gold and the rose
// arch blooms. Five depths move at their own speeds. Then the reception details arrive.

import { useRef } from 'react';
import { createTimeline, stagger } from 'animejs';
import { ReceptionDefs, ReceptionLayers } from './ReceptionArt';
import { wedding, mapsUrl, calendarUrl } from '@/lib/wedding';
import { useScrollTimeline, TL } from '@/lib/useScrollTimeline';

export default function ReceptionScene() {
  const root = useRef<HTMLElement>(null);
  const { reception } = wedding;

  useScrollTimeline(root, () =>
    createTimeline({ autoplay: false, defaults: { ease: 'outCubic' } })
      // starting states for anything that only appears later
      .set('.rose-arch', { opacity: 0.55, scale: 0.94 }, 0)
      .set('.r-couple', { opacity: 0, translateY: 40 }, 0)
      .set('.r-card', { opacity: 0, translateY: 30 }, 0)
      .add('.r-head', { opacity: [0, 1], translateY: [16, 0], duration: 180 }, 0)
      // the lights come on: bulbs one after another, then chandeliers and candles
      .add('.bulb-glow', { opacity: [0, 1], duration: 90, delay: stagger(2.2, { from: 'center' }), ease: 'outQuad' }, 120)
      .add('.chandelier-glow', { opacity: [0, 1], scale: [0.6, 1], duration: 240 }, 260)
      .add('.flame-c', { opacity: [0.25, 1], duration: 160, delay: stagger(14) }, 280)
      .add('.candle-glow', { opacity: [0, 1], duration: 200, delay: stagger(20) }, 320)
      .add('.floor-glow', { opacity: [0, 1], duration: 260, ease: 'linear' }, 360)
      // the room warms from dusk to gold
      .add('.r-dim', { opacity: [1, 0], duration: 360, ease: 'inOutSine' }, 200)
      .add('.rose-arch', { scale: [0.94, 1], opacity: [0.55, 1], duration: 300 }, 340)
      // and the couple step into the arch as the room lights up
      .add('.r-couple', { opacity: [0, 1], translateY: [40, 0], duration: 280 }, 400)
      // depth: the farther the layer, the less it moves
      .add('.rl-wall', { translateY: ['2%', '-2%'], duration: TL, ease: 'linear' }, 0)
      .add('.rl-arch', { translateY: ['4%', '-4%'], duration: TL, ease: 'linear' }, 0)
      .add('.rl-lights', { translateY: ['7%', '-9%'], duration: TL, ease: 'linear' }, 0)
      .add('.rl-strings', { translateY: ['10%', '-14%'], duration: TL, ease: 'linear' }, 0)
      .add('.rl-front', { translateY: ['18%', '-10%'], duration: TL, ease: 'linear' }, 0)
      // the details
      .add('.r-card', { opacity: [0, 1], translateY: [30, 0], duration: 200 }, 680),
  );

  return (
    <section className="reception" ref={root} aria-labelledby="reception-title">
      <ReceptionDefs />
      <div className="rpin">
        <ReceptionLayers />
        <div className="r-dim" aria-hidden="true" />

        <header className="r-head">
          <h2 id="reception-title" className="r-title">The Reception</h2>
          <p className="r-note">{reception.note}</p>
          <p className="sr-only">
            An illustration of {wedding.groom.name} in a navy suit and {wedding.bride.name} in a red and gold saree, standing
            in a rose arch behind the head table.
          </p>
        </header>

        <div className="r-card">
          <p className="r-time">{reception.time}</p>
          <p className="r-venue">{reception.name}</p>
          <p className="r-address">{reception.address}</p>
          <div className="r-actions">
            <a className="btn" href={mapsUrl(reception)} target="_blank" rel="noopener noreferrer">
              Open in Maps
            </a>
            <a
              className="btn ghost"
              href={calendarUrl(`${wedding.partnerOne} & ${wedding.partnerTwo}: Reception`, reception)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Add to calendar
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
