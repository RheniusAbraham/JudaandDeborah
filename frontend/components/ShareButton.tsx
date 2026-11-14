'use client';

import { useState } from 'react';
import { wedding } from '@/lib/wedding';

/** Shares the invitation link: the phone's share sheet when there is one, WhatsApp otherwise. */
export default function ShareButton() {
  const [copied, setCopied] = useState(false);
  const text = `You're invited to the wedding of ${wedding.partnerOne} & ${wedding.partnerTwo} on ${wedding.dateLabel}.`;

  async function share() {
    const url = window.location.href.split('#')[0];
    const title = `${wedding.partnerOne} & ${wedding.partnerTwo}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        return; // the guest closed the share sheet
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener');
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      /* clipboard not available: WhatsApp already opened */
    }
  }

  return (
    <button type="button" className="btn" onClick={share}>
      {copied ? 'Link copied' : 'Share the invitation'}
    </button>
  );
}
