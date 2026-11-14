'use client';

// Scene 3: two families, one blessing. Deborah's parents rise into view, then Judah's;
// their names arrive beside them; and a golden three-strand cord draws itself between the
// two families and ties a small knot (echoing "a cord of three strands" from scene 1).

import { useRef } from 'react';
import Image from 'next/image';
import { createTimeline } from 'animejs';
import brideFamily from '@/assets/family1.webp';
import groomFamily from '@/assets/family2.webp';
import { wedding } from '@/lib/wedding';
import { useScrollTimeline } from '@/lib/useScrollTimeline';

const first = (name: string) => name.split(' ')[0];

/** Three gently braided strands along one route (all coordinates in percent of the scene). */
function Cord({ d, className }: { d: [string, string, string]; className: string }) {
  return (
    <svg className={`cord ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {d.map((path, i) => (
        <path
          key={i}
          className="cord-strand"
          d={path}
          pathLength={1}
          strokeDasharray="1"
          fill="none"
          stroke={['#b8873f', '#d8b06a', '#c99a52'][i]}
          strokeWidth={[2.4, 1.6, 2][i]}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export default function FamiliesScene() {
  const root = useRef<HTMLElement>(null);

  useScrollTimeline(root, () =>
    createTimeline({ autoplay: false, defaults: { ease: 'outCubic' } })
      // starting states for anything that only appears later
      .set('.fam-glow', { opacity: 0, scale: 0.7 }, 0)
      .set('.fam-img', { opacity: 0, translateY: '28%' }, 0)
      .set('.fam-bride figcaption', { opacity: 0, translateX: '-32px' }, 0)
      .set('.fam-groom figcaption', { opacity: 0, translateX: '32px' }, 0)
      .set('.cord-strand', { strokeDashoffset: 1 }, 0)
      .set('.knot', { opacity: 0, scale: 0.4 }, 0)
      .add('.blessing', { opacity: [0, 1], translateY: [18, 0], duration: 240 }, 0)
      // back layer: soft glows, drifting slowest
      .add('.fam-bride .fam-glow', { opacity: [0, 1], scale: [0.7, 1], duration: 340 }, 60)
      .add('.fam-groom .fam-glow', { opacity: [0, 1], scale: [0.7, 1], duration: 340 }, 200)
      .add('.fam-glow', { translateY: ['6%', '-6%'], duration: 1000, ease: 'linear' }, 0)
      // the families rise into view, Deborah's first, then Judah's
      .add('.fam-bride .fam-img', { translateY: ['28%', '0%'], opacity: [0, 1], duration: 340 }, 80)
      .add('.fam-groom .fam-img', { translateY: ['28%', '0%'], opacity: [0, 1], duration: 340 }, 220)
      .add('.fam-img', { translateY: ['0%', '-3%'], duration: 440, ease: 'linear' }, 560)
      // their names arrive from the outside edges
      .add('.fam-bride figcaption', { translateX: ['-32px', '0px'], opacity: [0, 1], duration: 240 }, 330)
      .add('.fam-groom figcaption', { translateX: ['32px', '0px'], opacity: [0, 1], duration: 240 }, 450)
      // and the golden cord binds them
      .add('.cord-strand', { strokeDashoffset: [1, 0], duration: 320, ease: 'inOutSine' }, 600)
      .add('.knot', { opacity: [0, 1], scale: [0.4, 1], duration: 120, ease: 'outBack(2)' }, 880),
  );

  const families = [
    { cls: 'fam-bride', src: brideFamily, who: first(wedding.bride.name), parents: wedding.bride.parents },
    { cls: 'fam-groom', src: groomFamily, who: first(wedding.groom.name), parents: wedding.groom.parents },
  ];

  return (
    <section className="families" ref={root} aria-labelledby="families-title">
      <div className="fpin">
        <h2 id="families-title" className="blessing">
          With the blessings of God
          <br />
          and our families
        </h2>

        {/* the cord: swinging between the two families on computers, an S between them on phones */}
        <Cord className="cord-wide" d={['M40 47C45 63 55 63 60 47', 'M40 48C45 62 55 64 60 48', 'M40 46C45 64 55 62 60 46']} />
        <Cord className="cord-tall" d={['M74 40C66 52 34 48 26 62', 'M74 41C65 51 35 50 26 63', 'M74 39C67 53 33 47 26 61']} />
        <span className="knot" aria-hidden="true" />

        {families.map((f) => (
          <figure key={f.cls} className={`fam ${f.cls}`}>
            <div className="fam-glow" aria-hidden="true" />
            <div className="fam-img">
              <Image
                src={f.src}
                alt={`Illustration of ${f.parents.join(' and ')}`}
                fill
                sizes="(min-width: 900px) 52vh, 32vh"
                quality={90}
              />
            </div>
            <figcaption>
              <span className="fam-who">{f.who}’s parents</span>
              {f.parents.map((p, i) => (
                <span key={p} className="fam-name">
                  {i > 0 ? '& ' : ''}
                  {p}
                </span>
              ))}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
