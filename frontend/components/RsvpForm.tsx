'use client';

// The reply form. "Send RSVP" checks the reply, saves it to the couple's Google Sheet
// (lib/rsvp.ts), then folds into a thank-you card. The phone remembers the reply, so a guest
// who comes back sees it (and can change it) instead of a blank form.

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { animate, stagger } from 'animejs';
import { wedding, calendarUrl } from '@/lib/wedding';
import { EVENTS, loadReply, newReplyId, sendReply, summarize, type Meal, type RsvpPayload, type SavedReply } from '@/lib/rsvp';

type Reply = 'yes' | 'no';
type Guest = { id: number; name: string; meal: Meal };
type Errors = { name?: string; events?: string; guests?: string };
const MEALS: [Meal, string][] = [
  ['veg', 'Veg'],
  ['nonveg', 'Non-veg'],
];
const MAX_PARTY = 8; // including the person replying
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

const HEART = 'M50 88C22 68 5 50 10 30C14 13 38 8 50 27C62 8 86 13 90 30C95 50 78 68 50 88Z';

/** The thank-you card: what they told us, the calendar for their events, and a way to change it. */
function Done({ saved, fresh, onChange }: { saved: SavedReply; fresh: boolean; onChange: () => void }) {
  const p = saved.payload;
  const s = summarize(p);
  const first = p.name.split(' ')[0];
  const yes = p.attending === 'yes';
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fresh || !ref.current || reduceMotion()) return;
    animate(ref.current, { opacity: [0, 1], translateY: [14, 0], duration: 800, ease: 'outQuart' });
    animate(ref.current.querySelectorAll('.done-hearts path'), {
      opacity: [0, 1],
      scale: [0.4, 1],
      translateY: [24, 0],
      delay: stagger(120, { start: 250 }),
      duration: 700,
      ease: 'outBack(2)',
    });
  }, [fresh]);
  const titled = (ev: string) => `${wedding.partnerOne} & ${wedding.partnerTwo}: ${ev}`;
  return (
    <div className="rsvp-done" ref={ref} role="status" tabIndex={-1}>
      <svg className="done-hearts" viewBox="0 0 120 40" aria-hidden="true">
        {/* each heart is placed by its group; the pop-in animates the path inside it */}
        <g transform="translate(14 14) scale(.22)">
          <path d={HEART} fill="#f6b39b" />
        </g>
        <g transform="translate(44 2) scale(.32)">
          <path d={HEART} fill="#e44c67" />
        </g>
        <g transform="translate(84 14) scale(.22)">
          <path d={HEART} fill="#ec8ea0" />
        </g>
      </svg>
      <p className="rsvp-done-title">Thank you, {first}!</p>
      {!fresh && <p className="done-note">Your reply is with us.</p>}
      {yes ? (
        <>
          <p className="done-lede">We are so happy you can come.</p>
          <dl className="done-summary">
            <div>
              <dt>Coming</dt>
              <dd>
                {s.people}
                {p.party.length > 1 && <span className="done-who">{s.who}</span>}
              </dd>
            </div>
            <div>
              <dt>For</dt>
              <dd>{s.events}</dd>
            </div>
            {s.meals && (
              <div>
                <dt>Meals</dt>
                <dd>{s.meals}</dd>
              </div>
            )}
          </dl>
          <div className="done-cal">
            {p.events.includes('Holy Matrimony') && (
              <a className="btn ghost" href={calendarUrl(titled('Holy Matrimony'), wedding.church)} target="_blank" rel="noopener noreferrer">
                Add the ceremony to calendar
              </a>
            )}
            {p.events.includes('Reception') && (
              <a className="btn ghost" href={calendarUrl(titled('Reception'), wedding.reception)} target="_blank" rel="noopener noreferrer">
                Add the reception to calendar
              </a>
            )}
          </div>
        </>
      ) : (
        <p className="done-lede">We will miss you, and we are grateful you let us know.</p>
      )}
      <button type="button" className="link-btn" onClick={onChange}>
        Change my reply
      </button>
    </div>
  );
}

export default function RsvpForm() {
  const [saved, setSaved] = useState<SavedReply | null>(null);
  const [fresh, setFresh] = useState(false); // just sent (animate), or remembered from before
  const [editing, setEditing] = useState<RsvpPayload | null>(null); // the reply being changed

  // a reply sent from this phone before (read after mounting, so the first render matches the server's)
  useEffect(() => {
    const r = loadReply();
    if (r) setSaved(r);
  }, []);

  if (saved && !editing) {
    return (
      <Done
        saved={saved}
        fresh={fresh}
        onChange={() => {
          setEditing(saved.payload);
          setFresh(false);
        }}
      />
    );
  }
  return (
    <Form
      key={editing?.id ?? 'new'}
      initial={editing}
      onSent={(r) => {
        setSaved(r);
        setFresh(true);
        setEditing(null);
      }}
    />
  );
}

function Form({ initial, onSent }: { initial: RsvpPayload | null; onSent: (r: SavedReply) => void }) {
  const [reply, setReply] = useState<Reply>(initial?.attending ?? 'yes');
  const [events, setEvents] = useState<string[]>(initial?.attending === 'yes' ? initial.events : [...EVENTS]);
  // the person replying is always first; everyone they bring follows
  const [party, setParty] = useState<Guest[]>(() =>
    initial?.party.length ? initial.party.map((g, i) => ({ id: i, name: i === 0 ? '' : g.name, meal: g.meal ?? 'veg' })) : [{ id: 0, name: '', meal: 'veg' }],
  );
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed'>('idle');
  const nextId = useRef(party.length);
  const focusId = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const replyId = useRef(initial?.id ?? '');

  // once a new guest's row is on screen, move straight to their name
  useEffect(() => {
    if (focusId.current === null) return;
    document.getElementById(`guest-${focusId.current}`)?.focus();
    focusId.current = null;
  }, [party.length]);

  const toggleEvent = (e: string) => {
    setEvents((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));
    setErrors((er) => ({ ...er, events: undefined }));
  };
  const dinner = events.includes('Reception'); // the meal is served at the reception
  const setGuest = (id: number, change: Partial<Guest>) => {
    setParty((cur) => cur.map((g) => (g.id === id ? { ...g, ...change } : g)));
    if (change.name !== undefined) setErrors((er) => ({ ...er, guests: undefined }));
  };
  const addGuest = () => {
    const id = nextId.current++;
    focusId.current = id;
    setParty((cur) => (cur.length >= MAX_PARTY ? cur : [...cur, { id, name: '', meal: 'veg' }]));
  };
  const removeGuest = (id: number) => setParty((cur) => cur.filter((g) => g.id !== id));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'sending') return;
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') || '').trim().replace(/\s+/g, ' ');
    const message = String(data.get('message') || '').trim();
    const yes = reply === 'yes';

    // check before sending, and point at the first thing to fix
    const er: Errors = {};
    if (!name) er.name = 'Please tell us your name.';
    if (yes && events.length === 0) er.events = 'Please choose at least one.';
    const unnamed = yes ? party.slice(1).find((g) => !g.name.trim()) : undefined;
    if (unnamed) er.guests = 'Please add a name for each guest, or remove the empty row.';
    setErrors(er);
    if (er.name || er.events || er.guests) {
      const first = er.name ? '#rsvp-name' : er.events ? '.rsvp-events input' : `#guest-${unnamed!.id}`;
      document.querySelector<HTMLElement>(first)?.focus();
      return;
    }

    if (!replyId.current) replyId.current = newReplyId();
    const payload: RsvpPayload = {
      id: replyId.current,
      name,
      attending: reply,
      events: yes ? EVENTS.filter((ev) => events.includes(ev)) : [],
      party: yes ? party.map((g, i) => ({ name: i === 0 ? name : g.name.trim().replace(/\s+/g, ' '), meal: dinner ? g.meal : null })) : [{ name, meal: null }],
      message,
      website: String(data.get('website') || ''),
    };

    setStatus('sending');
    try {
      const saved = await sendReply(payload);
      const done = () => onSent(saved);
      if (reduceMotion() || !formRef.current) return done();
      animate(formRef.current, { opacity: [1, 0], translateY: [0, -10], duration: 320, ease: 'inQuad', onComplete: done });
    } catch {
      setStatus('failed'); // everything they typed stays where it is
    }
  }

  const sending = status === 'sending';
  return (
    <form ref={formRef} onSubmit={onSubmit} className="rsvp-form" noValidate aria-busy={sending}>
      <div className="field">
        <label htmlFor="rsvp-name">Your name</label>
        <input
          id="rsvp-name"
          name="name"
          autoComplete="name"
          placeholder="Full name"
          maxLength={80}
          defaultValue={initial?.name}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'err-name' : undefined}
          onChange={() => errors.name && setErrors((er) => ({ ...er, name: undefined }))}
        />
        {errors.name && (
          <p className="field-error" id="err-name">
            {errors.name}
          </p>
        )}
      </div>

      {/* a trap for spam bots: hidden from guests and screen readers */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="rsvp-website">Website</label>
        <input id="rsvp-website" name="website" tabIndex={-1} autoComplete="off" />
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
          <fieldset className="field rsvp-events" aria-describedby={errors.events ? 'err-events' : undefined}>
            <legend>Which will you attend?</legend>
            <div className="choice">
              {EVENTS.map((ev) => (
                <label key={ev}>
                  <input type="checkbox" name="events" value={ev} checked={events.includes(ev)} onChange={() => toggleEvent(ev)} />
                  <span>{ev}</span>
                </label>
              ))}
            </div>
            {errors.events && (
              <p className="field-error" id="err-events">
                {errors.events}
              </p>
            )}
          </fieldset>

          <fieldset className="field" aria-describedby={errors.guests ? 'err-guests' : undefined}>
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
                        maxLength={80}
                        autoComplete="off"
                        placeholder={`Guest ${i + 1}’s name`}
                        aria-invalid={!!errors.guests && !g.name.trim()}
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
            {errors.guests && (
              <p className="field-error" id="err-guests">
                {errors.guests}
              </p>
            )}
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
        <textarea id="rsvp-message" name="message" rows={3} maxLength={1000} placeholder="Wishes, dietary needs, anything else" defaultValue={initial?.message} />
      </div>

      {status === 'failed' && (
        <p className="send-error" role="alert">
          We couldn’t send your reply just now. Please check your connection and try again. Nothing you typed is lost.
        </p>
      )}
      <button className={`btn${sending ? ' is-sending' : ''}`} type="submit" disabled={sending}>
        {sending ? (
          <>
            <span className="spinner" aria-hidden="true" /> Sending…
          </>
        ) : status === 'failed' ? (
          'Try again'
        ) : initial ? (
          'Update my RSVP'
        ) : (
          'Send RSVP'
        )}
      </button>
    </form>
  );
}
