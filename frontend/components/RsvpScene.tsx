'use client';

// Scene 6: the invitation itself. A sealed envelope rises into view; the wax seal lifts, the
// flap folds open, and a card slides out with a live countdown. The RSVP form follows below,
// in normal scrolling so it is easy to fill in.
//
// The envelope is stacked (back to front): back panel with its floral liner, the opened flap,
// the card, the front pocket, the closed flap, the wax seal. The flap is two pieces: the closed
// one folds up to nothing in front of the card, then the open one unfolds behind it.

import { useRef } from 'react';
import { createTimeline } from 'animejs';
import Countdown from './Countdown';
import RsvpForm from './RsvpForm';
import { wedding } from '@/lib/wedding';
import { useScrollTimeline } from '@/lib/useScrollTimeline';

const INK = '#5a2f2a';
// envelope drawing space: 1000 x 800, envelope body from (100, 260) to (900, 760)
const VB = '0 0 1000 800';

function EnvDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ev-paper" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fbe3d6" />
          <stop offset="1" stopColor="#f3cdbb" />
        </linearGradient>
        <linearGradient id="ev-paper2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f6d5c4" />
          <stop offset="1" stopColor="#eec2ad" />
        </linearGradient>
        <linearGradient id="ev-flap" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f8dccc" />
          <stop offset="1" stopColor="#efc4af" />
        </linearGradient>
        <pattern id="ev-liner" width="70" height="70" patternUnits="userSpaceOnUse">
          <rect width="70" height="70" fill="#f7d7dc" />
          <circle cx="18" cy="18" r="7" fill="#e88a9c" fillOpacity=".55" />
          <circle cx="18" cy="18" r="3" fill="#f4c46e" />
          <circle cx="53" cy="53" r="6" fill="#f2a493" fillOpacity=".6" />
          <path d="M30 40q6 -8 12 0q-6 6 -12 0z" fill="#a9c3b2" fillOpacity=".8" />
          <path d="M50 14q6 -8 12 0q-6 6 -12 0z" fill="#a9c3b2" fillOpacity=".8" />
        </pattern>
        <radialGradient id="ev-wax" cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#e66b7f" />
          <stop offset=".6" stopColor="#b83a52" />
          <stop offset="1" stopColor="#8e2639" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export default function RsvpScene() {
  const root = useRef<HTMLElement>(null);

  useScrollTimeline(root, () =>
    createTimeline({ autoplay: false, defaults: { ease: 'outCubic' } })
      // starting state: the opened flap is folded away until the closed one has lifted
      .set('.env-flap-open', { scaleY: 0 }, 0)
      .add('.env-head', { opacity: [0, 1], translateY: [16, 0], duration: 180 }, 0)
      .add('.env', { translateY: ['24%', '0%'], opacity: [0, 1], duration: 260 }, 0)
      // the seal lifts away
      .add('.env-seal', { scale: [1, 1.35], opacity: [1, 0], duration: 110, ease: 'inQuad' }, 230)
      // the flap folds up (in front), then unfolds open (behind the card)
      .add('.env-flap-closed', { scaleY: [1, 0], duration: 110, ease: 'inSine' }, 300)
      .add('.env-flap-open', { scaleY: [0, 1], duration: 110, ease: 'outSine' }, 410)
      // the card slides out and comes forward a little
      .add('.env-card', { translateY: ['0%', '-66%'], duration: 300, ease: 'inOutCubic' }, 520)
      .add('.env-card', { scale: [1, 1.08], duration: 180 }, 760)
      .add('.env', { translateY: ['0%', '10%'], duration: 300, ease: 'inOutCubic' }, 520),
  );

  return (
    <>
      <section className="invite-env" ref={root} aria-labelledby="env-title">
        <EnvDefs />
        <div className="epin">
          <header className="env-head">
            <h2 id="env-title" className="env-title">Will you join us?</h2>
            <p className="env-sub">A reply card is waiting for you</p>
          </header>

          <div className="env">
            {/* back panel and its floral liner */}
            <svg className="env-part env-back" viewBox={VB} aria-hidden="true">
              <rect x={100} y={260} width={800} height={500} rx={10} fill="url(#ev-paper2)" stroke={INK} strokeOpacity={0.4} strokeWidth={2} />
              <path d="M112 272L500 520L888 272Z" fill="url(#ev-liner)" opacity={0.9} />
            </svg>
            {/* the flap, opened (behind the card) */}
            <svg className="env-part env-flap-open" viewBox={VB} aria-hidden="true">
              <path d="M100 262L500 30L900 262Z" fill="url(#ev-flap)" stroke={INK} strokeOpacity={0.4} strokeWidth={2} strokeLinejoin="round" />
              <path d="M126 254L500 46L874 254Z" fill="url(#ev-liner)" opacity={0.9} />
            </svg>

            {/* the reply card */}
            <div className="env-card">
              <p className="card-kicker">Counting down to forever</p>
              <Countdown />
              <p className="card-by">Kindly reply by {wedding.rsvpBy}</p>
              <a className="btn small card-btn" href="#rsvp">
                Reply below
              </a>
            </div>

            {/* the front pocket: side flaps and bottom flap */}
            <svg className="env-part env-front" viewBox={VB} aria-hidden="true">
              <path d="M100 262L470 520L100 760Z" fill="url(#ev-paper)" stroke={INK} strokeOpacity={0.35} strokeWidth={2} strokeLinejoin="round" />
              <path d="M900 262L530 520L900 760Z" fill="url(#ev-paper)" stroke={INK} strokeOpacity={0.35} strokeWidth={2} strokeLinejoin="round" />
              <path d="M100 760L500 470L900 760Z" fill="url(#ev-paper2)" stroke={INK} strokeOpacity={0.4} strokeWidth={2} strokeLinejoin="round" />
              <path d="M140 742L500 486L860 742" fill="none" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={2} />
            </svg>
            {/* the flap, closed */}
            <svg className="env-part env-flap-closed" viewBox={VB} aria-hidden="true">
              <path d="M100 262L500 560L900 262Z" fill="url(#ev-flap)" stroke={INK} strokeOpacity={0.45} strokeWidth={2} strokeLinejoin="round" />
              <path d="M140 276L500 540L860 276" fill="none" stroke="#ffffff" strokeOpacity={0.45} strokeWidth={2} />
            </svg>
            {/* wax seal stamped with their initials */}
            <svg className="env-part env-seal" viewBox={VB} aria-hidden="true">
              <path
                d="M500 486c14 0 20 8 32 10s20 10 22 22-4 18-2 30-6 22-18 26-16 12-34 12-24-8-34-12-20-14-18-26-4-18-2-30 10-20 22-22 18-10 32-10z"
                fill="url(#ev-wax)"
              />
              <circle cx={500} cy={552} r={46} fill="none" stroke="#7d2032" strokeOpacity={0.6} strokeWidth={3} />
              <circle cx={500} cy={552} r={38} fill="none" stroke="#f3a3b0" strokeOpacity={0.45} strokeWidth={1.5} />
              <text x={500} y={566} textAnchor="middle" fontFamily="var(--font-script), cursive" fontSize={40} fill="#fbd3da" fillOpacity={0.9}>
                {wedding.partnerOne[0]} &amp; {wedding.partnerTwo[0]}
              </text>
              <path d="M470 528q10 -10 22 -6" stroke="#ffffff" strokeOpacity={0.45} strokeWidth={5} strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
      </section>

      <section className="rsvp-sec" id="rsvp" aria-labelledby="rsvp-title">
        <div className="col">
          <h2 id="rsvp-title" className="rsvp-title">Kindly reply</h2>
          <p className="lede">Please let us know by {wedding.rsvpBy}.</p>
          <div className="panel">
            <RsvpForm />
          </div>
        </div>
      </section>
    </>
  );
}
