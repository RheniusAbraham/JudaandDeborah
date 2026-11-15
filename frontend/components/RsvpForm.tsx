'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { animate } from 'animejs';
import { wedding } from '@/lib/wedding';

type Reply = 'yes' | 'no';
type Meal = 'veg' | 'nonveg';
type Guest = { id: number; name: string; meal: Meal };
const EVENTS = ['Holy Matrimony', 'Reception'] as const;
const MEALS: [Meal, string][] = [
  ['veg', 'Veg'],
  ['nonveg', 'Non-veg'],
];
const MAX_PARTY = 8; // including the person replying
const mealLabel = (m: Meal) => (m === 'veg' ? 'Veg' : 'Non-veg');

/** Veg / Non-veg for one person, as two radio buttons styled as a toggle. */
function MealChoice({ group, value, onChange, label }: { group: string; value: Meal; onChange: (m: Meal) => void; label: string }) {
  return (
    <div className="meal" role="radiogroup" aria-label={label}>
      {MEALS.map(([m, text]) => (
        <label key={m}>
          <input type="radio" name={group} value={m} checked={value === m} onChange={() => onChange(m)} />
          <span className={`meal-${m}`}>
            <i aria-hidden="true" />
            {text}
          </span>
        </label>
      ))}
    </div>
  );
}

export default function RsvpForm() {
  const [reply, setReply] = useState<Reply>('yes');
  // the person replying is always first; everyone they bring follows
  const [party, setParty] = useState<Guest[]>([{ id: 0, name: '', meal: 'veg' }]);
  const nextId = useRef(1);
  const focusId = useRef<number | null>(null);
  // once a new guest's row is on screen, move straight to their name
  useEffect(() => {
    if (focusId.current === null) return;
    document.getElementById(`guest-${focusId.current}`)?.focus();
    focusId.current = null;
  }, [party.length]);
  const [events, setEvents] = useState<string[]>([...EVENTS]);
  const [sentName, setSentName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const viaWhatsApp = wedding.rsvpWhatsApp.length > 0;

  const toggleEvent = (e: string) =>
    setEvents((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));
  const dinner = events.includes('Reception'); // the meal is served at the reception
  const setGuest = (id: number, change: Partial<Guest>) =>
    setParty((cur) => cur.map((g) => (g.id === id ? { ...g, ...change } : g)));
  const addGuest = () => {
    const id = nextId.current++;
    focusId.current = id;
    setParty((cur) => (cur.length >= MAX_PARTY ? cur : [...cur, { id, name: '', meal: 'veg' }]));
  };
  const removeGuest = (id: number) => setParty((cur) => cur.filter((g) => g.id !== id));

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (viaWhatsApp) {
      const n = party.length;
      const who = party.map((g, i) => `- ${i === 0 ? `${name} (me)` : g.name.trim()}${dinner ? `: ${mealLabel(g.meal)}` : ''}`);
      const veg = party.filter((g) => g.meal === 'veg').length;
      const lines = [
        `RSVP for ${wedding.partnerOne} & ${wedding.partnerTwo}`,
        `Name: ${name}`,
        ...(reply === 'yes'
          ? [
              `Attending: yes, ${n} ${n === 1 ? 'person' : 'people'} (${events.join(' and ') || 'events not chosen'})`,
              ...who,
              ...(dinner ? [`Meals: ${veg} Veg, ${n - veg} Non-veg`] : []),
            ]
          : ['Attending: no']),
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

          <fieldset className="field">
            <legend>Who’s coming?</legend>
            {dinner && <p className="hint">Dinner is served at the reception. Choose a meal for each person.</p>}
            <ul className="party">
              {party.map((g, i) => (
                <li key={g.id} className="guest">
                  {i === 0 ? (
                    <span className="guest-you">You</span>
                  ) : (
                    <div className="guest-name">
                      <label className="sr-only" htmlFor={`guest-${g.id}`}>
                        Guest {i + 1} name
                      </label>
                      <input
                        id={`guest-${g.id}`}
                        value={g.name}
                        onChange={(e) => setGuest(g.id, { name: e.target.value })}
                        required
                        autoComplete="off"
                        placeholder={`Guest ${i + 1}’s name`}
                      />
                      <button type="button" className="guest-remove" aria-label={`Remove ${g.name.trim() || `guest ${i + 1}`}`} onClick={() => removeGuest(g.id)}>
                        ×
                      </button>
                    </div>
                  )}
                  {dinner && (
                    <MealChoice
                      group={`meal-${g.id}`}
                      value={g.meal}
                      onChange={(meal) => setGuest(g.id, { meal })}
                      label={i === 0 ? 'Your meal' : `Meal for ${g.name.trim() || `guest ${i + 1}`}`}
                    />
                  )}
                </li>
              ))}
            </ul>
            {party.length < MAX_PARTY ? (
              <button type="button" className="add-guest" onClick={addGuest}>
                <span aria-hidden="true">+</span> Add a guest
              </button>
            ) : (
              <p className="hint">That’s the most we can seat for one reply. Please ask others to reply separately.</p>
            )}
          </fieldset>
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
