'use client';

// Scene 3: two families, one blessing. Deborah's parents rise into view, then Judah's,
// and their names arrive beside them.

import { useRef } from 'react';
import Image from 'next/image';
import { createTimeline } from 'animejs';
import brideFamily from '@/assets/family1.webp';
import groomFamily from '@/assets/family2.webp';
import { wedding } from '@/lib/wedding';
import { useScrollTimeline } from '@/lib/useScrollTimeline';
import Hook, { hookIn } from './Hook';

const first = (name: string) => name.split(' ')[0];
// keep titles and initials with the name after them, so a line never ends on "& Mrs."
const glue = (s: string) => s.replace(/(&|Late|Mrs?\.|[A-Z]\.) /g, '$1 ');

export default function FamiliesScene() {
  const root = useRef<HTMLElement>(null);

  useScrollTimeline(root, () =>
    createTimeline({ autoplay: false, defaults: { ease: 'outCubic' } })
      // starting states live in globals.css ("Starting states for the scroll scenes")
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
      .add('.fam-bride figcaption', { translateX: ['32px', '0px'], opacity: [0, 1], duration: 240 }, 330)
      .add('.fam-groom figcaption', { translateX: ['-32px', '0px'], opacity: [0, 1], duration: 240 }, 450)
      .add('.hook', hookIn, 760),
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

        {families.map((f) => (
          <figure key={f.cls} className={`fam ${f.cls}`}>
            <div className="fam-glow" aria-hidden="true" />
            <div className="fam-img">
              <Image
                src={f.src}
                alt={`Illustration of ${f.parents.join(' and ')}`}
                fill
                sizes="(min-width: 900px) 62vh, 36vh"
                quality={90}
              />
            </div>
            <figcaption>
              <span className="fam-who">{f.who}’s parents</span>
              {f.parents.map((p, i) => (
                <span key={p} className="fam-name">
                  {glue(`${i > 0 ? '& ' : ''}${p}`)}
                </span>
              ))}
            </figcaption>
          </figure>
        ))}
        <Hook>Come with us to the church</Hook>
      </div>
    </section>
  );
}
