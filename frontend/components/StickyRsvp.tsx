'use client';

import { useEffect, useState } from 'react';

// A small RSVP button that follows the guest on phones, between the cover and the RSVP form.
export default function StickyRsvp() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('top');
    const rsvp = document.getElementById('rsvp');
    if (!hero || !rsvp || !('IntersectionObserver' in window)) return;
    const seen = { hero: true, rsvp: false };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === hero) seen.hero = e.isIntersecting;
        if (e.target === rsvp) seen.rsvp = e.isIntersecting;
      });
      setShow(!seen.hero && !seen.rsvp);
    });
    io.observe(hero);
    io.observe(rsvp);
    return () => io.disconnect();
  }, []);

  return (
    <a className={`sticky-rsvp${show ? ' show' : ''}`} href="#rsvp" aria-hidden={!show} tabIndex={show ? 0 : -1}>
      RSVP
    </a>
  );
}
