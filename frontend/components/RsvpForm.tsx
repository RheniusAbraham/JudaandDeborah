'use client';

import { useRef, useState, type FormEvent } from 'react';
import { animate } from 'animejs';
import { wedding } from '@/lib/wedding';

type Reply = 'yes' | 'no';
const EVENTS = ['Holy Matrimony', 'Reception'] as const;

export default function RsvpForm() {
  const [reply, setReply] = useState<Reply>('yes');
  const [guests, setGuests] = useState(1);
  const [events, setEvents] = useState<string[]>([...EVENTS]);
  const [sentName, setSentName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const viaWhatsApp = wedding.rsvpWhatsApp.length > 0;

  const toggleEvent = (e: string) =>
    setEvents((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (viaWhatsApp) {
      const lines = [
        `RSVP for ${wedding.partnerOne} & ${wedding.partnerTwo}`,
        `Name: ${name}`,
        reply === 'yes'
          ? `Attending: yes, ${guests} ${guests === 1 ? 'guest' : 'guests'} (${events.join(' and ') || 'events not chosen'})`
          : 'Attending: no',
        message && `Message: ${message}`,
      ].filter(Boolean);
      window.open(`https://wa.me/${wedding.rsvpWhatsApp}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const show = () => {
      setSentName(name);
      if (!reduce)
        requestAnimationFrame(() => {
          if (doneRef.current) animate(doneRef.current, { opacity: [0, 1], translateY: [14, 0], duration: 800, ease: 'outQuart' });
        });
    };
    if (reduce || !formRef.current) return show();
    animate(formRef.current, { opacity: [1, 0], translateY: [0, -10], duration: 320, ease: 'inQuad', onComplete: show });
  }

  if (sentName !== null) {
    return (
      <div className="rsvp-done" ref={doneRef} role="status">
        <p className="rsvp-done-title">Thank you, {sentName}.</p>
        <p>
          {viaWhatsApp
            ? 'Your reply is ready in WhatsApp. Press send there to finish.'
            : reply === 'yes'
              ? 'We are so happy you can come.'
              : 'We will miss you, and we are grateful you let us know.'}
        </p>
        <button type="button" className="link-btn" onClick={() => setSentName(null)}>
          Change my reply
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="rsvp-form">
      <div className="field">
        <label htmlFor="rsvp-name">Your name</label>
        <input id="rsvp-name" name="name" required autoComplete="name" placeholder="Full name" />
      </div>

      <fieldset className="field">
        <legend>Will you attend?</legend>
        <div className="choice">
          <label>
            <input type="radio" name="reply" value="yes" checked={reply === 'yes'} onChange={() => setReply('yes')} />
            <span>Joyfully yes</span>
          </label>
          <label>
            <input type="radio" name="reply" value="no" checked={reply === 'no'} onChange={() => setReply('no')} />
            <span>Sadly no</span>
          </label>
        </div>
      </fieldset>

      {reply === 'yes' && (
        <>
          <fieldset className="field">
            <legend>Which will you attend?</legend>
            <div className="choice">
              {EVENTS.map((ev) => (
                <label key={ev}>
                  <input type="checkbox" name="events" value={ev} checked={events.includes(ev)} onChange={() => toggleEvent(ev)} />
                  <span>{ev}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <span className="label" id="guests-label">
              Guests, including you
            </span>
            <div className="stepper" role="group" aria-labelledby="guests-label">
              <button type="button" aria-label="Fewer guests" onClick={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1}>
                −
              </button>
              <output aria-live="polite">{guests}</output>
              <button type="button" aria-label="More guests" onClick={() => setGuests((g) => Math.min(8, g + 1))} disabled={guests >= 8}>
                +
              </button>
            </div>
          </div>
        </>
      )}

      <div className="field">
        <label htmlFor="rsvp-message">A note for the couple (optional)</label>
        <textarea id="rsvp-message" name="message" rows={3} placeholder="Wishes, dietary needs, anything else" />
      </div>

      <button className="btn" type="submit">
        {viaWhatsApp ? 'Send RSVP on WhatsApp' : 'Send RSVP'}
      </button>
    </form>
  );
}
