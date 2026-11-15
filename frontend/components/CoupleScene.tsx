'use client';

// Scene 2: the couple. Parallax in three depths, back to front:
//   a church-window arch that draws itself, with a warm glow, and flowers that grow up its
//   sides as it draws (slowest),
//   the couple rising into it,
//   the bride's and groom's names arriving from their own sides.

import { useRef } from 'react';
import Image from 'next/image';
import { createTimeline, stagger } from 'animejs';
import couple from '@/assets/couple.webp';
import { wedding } from '@/lib/wedding';
import { useScrollTimeline, TL } from '@/lib/useScrollTimeline';
import FloralArch from './FloralArch';
import Hook, { hookIn } from './Hook';

export default function CoupleScene() {
  const root = useRef<HTMLElement>(null);

  useScrollTimeline(root, () =>
    createTimeline({ autoplay: false, defaults: { ease: 'outCubic' } })
      // starting states for anything that only appears later
      .set('.window-glow', { opacity: 0 }, 0)
      .set('.af', { opacity: 0, scale: 0 }, 0)
      .set('.person-bride', { opacity: 0, translateX: '-48px' }, 0)
      .set('.person-groom', { opacity: 0, translateX: '48px' }, 0)
      // back: the window draws itself and glows; it drifts slowest
      .add('.window-line', { strokeDashoffset: [1, 0], duration: 420, ease: 'inOutSine' }, 0)
      .add('.window-glow', { opacity: [0, 1], duration: 420, ease: 'linear' }, 60)
      .add('.window', { translateY: ['8%', '-3%'], duration: TL, ease: 'linear' }, 0)
      // the flowers grow up the arch from the ground: leaves unfurl, then the roses open
      .add('.af-leaf', { opacity: [0, 1], scale: [0, 1], duration: 140, delay: stagger(4) }, 140)
      .add('.af-rose', { opacity: [0, 1], scale: [0, 1], rotate: [-40, 0], duration: 180, delay: stagger(10), ease: 'outBack(1.5)' }, 220)
      // middle: the couple rise into the window, then keep a gentle drift
      .add('.couple-figure', { translateY: ['34%', '0%'], opacity: [0, 1], duration: 460 }, 0)
      .add('.couple-figure', { translateY: ['0%', '-4%'], duration: 540, ease: 'linear' }, 460)
      // names: each arrives from its own side, then rides a little faster than the couple
      .add('.person-bride', { translateX: ['-48px', '0px'], opacity: [0, 1], duration: 280 }, 300)
      .add('.person-groom', { translateX: ['48px', '0px'], opacity: [0, 1], duration: 280 }, 360)
      .add(['.person-bride', '.person-groom'], { translateY: ['0%', '-40%'], duration: 360, ease: 'linear' }, 640)
      .add('.hook', hookIn, 720),
  );

  return (
    <section className="couple" ref={root} aria-labelledby="couple-title">
      <h2 id="couple-title" className="sr-only">
        The bride and groom
      </h2>
      <div className="cpin">
        <div className="window" aria-hidden="true">
          <FloralArch id="c-arch" leftTop={560} rightTop={760} seed={2024} />
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
        <Hook>Meet the families</Hook>
      </div>
    </section>
  );
}
