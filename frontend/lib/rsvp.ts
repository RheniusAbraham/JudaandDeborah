// Sending an RSVP to the couple's Google Sheet, and remembering on this phone that it was sent.
// The Sheet side is a small Google Apps Script (see rsvp/apps-script.gs at the project root).

import { wedding } from './wedding';

export type Meal = 'veg' | 'nonveg';
export const EVENTS = ['Holy Matrimony', 'Reception'] as const;

export type RsvpPayload = {
  id: string; // stays the same when a guest changes their reply, so the Sheet updates their row
  name: string;
  attending: 'yes' | 'no';
  events: string[];
  party: { name: string; meal: Meal | null }[]; // the person replying first; meal only if at the reception
  message: string;
  website: string; // a field real guests never see: anything in it means a spam bot
};

export type SavedReply = { payload: RsvpPayload; sentAt: string };

const KEY = 'rsvp:v1';

/** The reply sent from this phone before, if any. */
export function loadReply(): SavedReply | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedReply) : null;
  } catch {
    return null; // private browsing, or storage blocked: just show the form
  }
}

function saveReply(r: SavedReply) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* not remembered on this phone, but the Sheet has it */
  }
}

export function newReplyId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Sends the reply. Resolves when the Sheet has it; throws if it could not be saved. */
export async function sendReply(payload: RsvpPayload): Promise<SavedReply> {
  const url = wedding.rsvpSheetUrl.trim();
  if (url) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    try {
      // sent as plain text, so the browser sends it straight to Google with no pre-check request
      const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload), signal: ctl.signal, redirect: 'follow' });
      const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (!res.ok || !body?.ok) throw new Error('The Sheet did not accept the reply');
    } finally {
      clearTimeout(timer);
    }
  } else {
    // No Sheet connected yet (see rsvp/SETUP.md): behave as if it worked, so the flow can be previewed.
    console.warn('RSVP: wedding.rsvpSheetUrl is empty, so this reply was not saved anywhere.');
    await new Promise((r) => setTimeout(r, 900));
  }
  const saved = { payload, sentAt: new Date().toISOString() };
  saveReply(saved);
  return saved;
}

/** "3 people", "Holy Matrimony & Reception", "2 Veg · 1 Non-veg" for the thank-you card. */
export function summarize(p: RsvpPayload) {
  const n = p.party.length;
  const meals = p.party.filter((g) => g.meal);
  const veg = meals.filter((g) => g.meal === 'veg').length;
  const names = p.party.map((g, i) => (i === 0 ? 'You' : g.name));
  return {
    people: `${n} ${n === 1 ? 'person' : 'people'}`,
    who: names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}` : names[0],
    events: p.events.join(' & '),
    meals: meals.length ? [veg && `${veg} Veg`, meals.length - veg && `${meals.length - veg} Non-veg`].filter(Boolean).join(' · ') : '',
  };
}
