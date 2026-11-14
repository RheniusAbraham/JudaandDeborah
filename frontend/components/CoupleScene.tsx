'use client';

// Scene 2: the couple. Parallax in four depths, back to front:
//   a church-window arch that draws itself, with a warm glow (slowest),
//   the couple rising into it,
//   the bride's and groom's names arriving from their own sides,
//   rose sprays at the bottom corners (fastest, closest to you).

import { useRef } from 'react';
import Image from 'next/image';
import { createTimeline } from 'animejs';
import couple from '@/assets/couple.webp';
import { wedding } from '@/lib/wedding';
import { useScrollTimeline, TL } from '@/lib/useScrollTimeline';
import Spray from './Spray';

const INK = '#5a2f2a';

export default function CoupleScene() {
  const root = useRef<HTMLElement>(null);

  useScrollTimeline(root, () =>
    createTimeline({ autoplay: false, defaults: { ease: 'outCubic' } })
      // starting states for anything that only appears later
      .set('.window-glow', { opacity: 0 }, 0)
      .set('.person-bride', { opacity: 0, translateX: '-48px' }, 0)
      .set('.person-groom', { opacity: 0, translateX: '48px' }, 0)
      // back: the window draws itself and glows; it drifts slowest
      .add('.window-line', { strokeDashoffset: [1, 0], duration: 420, ease: 'inOutSine' }, 0)
      .add('.window-glow', { opacity: [0, 1], duration: 420, ease: 'linear' }, 60)
      .add('.window', { translateY: ['8%', '-3%'], duration: TL, ease: 'linear' }, 0)
      // middle: the couple rise into the window, then keep a gentle drift
      .add('.couple-figure', { translateY: ['34%', '0%'], opacity: [0, 1], duration: 460 }, 0)
      .add('.couple-figure', { translateY: ['0%', '-4%'], duration: 540, ease: 'linear' }, 460)
      // names: each arrives from its own side, then rides a little faster than the couple
      .add('.person-bride', { translateX: ['-48px', '0px'], opacity: [0, 1], duration: 280 }, 300)
      .add('.person-groom', { translateX: ['48px', '0px'], opacity: [0, 1], duration: 280 }, 360)
      .add(['.person-bride', '.person-groom'], { translateY: ['0%', '-40%'], duration: 360, ease: 'linear' }, 640)
      // front: the rose sprays are closest, so they travel farthest
      .add('.spray', { translateY: ['40%', '-18%'], duration: TL, ease: 'linear' }, 0),
  );

  return (
    <section className="couple" ref={root} aria-labelledby="couple-title">
      <h2 id="couple-title" className="sr-only">
        The bride and groom
      </h2>
      <div className="cpin">
        <div className="window" aria-hidden="true">
          <svg viewBox="0 0 600 1000" preserveAspectRatio="xMidYMax meet">
            <defs>
              <radialGradient id="c-glow" cx=".5" cy=".42" r=".6">
                <stop offset="0" stopColor="#fff6ec" />
                <stop offset=".6" stopColor="#fde4d3" stopOpacity=".85" />
                <stop offset="1" stopColor="#fbd6c2" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path className="window-glow" d="M40 1000V300A260 260 0 0 1 560 300V1000Z" fill="url(#c-glow)" />
            <path className="window-line" pathLength={1} strokeDasharray="1" d="M40 1000V300A260 260 0 0 1 560 300V1000" fill="none" stroke={INK} strokeOpacity={0.45} strokeWidth={2.4} vectorEffect="non-scaling-stroke" />
            <path className="window-line" pathLength={1} strokeDasharray="1" d="M64 1000V302A236 236 0 0 1 536 302V1000" fill="none" stroke="#c98b6f" strokeOpacity={0.5} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        <div className="couple-figure">
          <Image
            src={couple}
            alt={`Illustration of ${wedding.bride.name} in an ivory and gold saree and ${wedding.groom.name} in a beige suit, holding hands`}
            fill
            sizes="(min-width: 900px) 46vh, 40vh"
            quality={90}
          />
        </div>

        {[wedding.bride, wedding.groom].map((p, i) => (
          <div key={p.name} className={`person ${i === 0 ? 'person-bride' : 'person-groom'}`}>
            <h3 className="pname">{p.name}</h3>
            <p className="parents">
              <span className="relation">{p.relation}</span>
              {p.parents.map((name) => (
                <span key={name} className="parent">
                  {name}
                </span>
              ))}
            </p>
          </div>
        ))}

        <div className="spray spray-left">
          <Spray />
        </div>
        <div className="spray spray-right">
          <Spray />
        </div>
      </div>
    </section>
  );
}
