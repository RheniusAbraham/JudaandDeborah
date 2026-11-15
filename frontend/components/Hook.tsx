// A teaser at the foot of a scene once it has settled, pulling the guest on to the next one.
// Each scene's scroll timeline fades it in at the end (and back out when scrolling up); it
// shares the landing cue's look, so guests learn it once: "there's more, keep going".

import type { ReactNode } from 'react';

export default function Hook({ children }: { children: ReactNode }) {
  return (
    <p className="hook" aria-hidden="true">
      <span>{children}</span>
      <span className="cue-arrow">
        <svg viewBox="0 0 16 16">
          <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </p>
  );
}

/** The fade-in each scene adds to its timeline, at progress `at` (0..1000). */
export const hookIn = { opacity: [0, 1], translateY: [10, 0], duration: 110, ease: 'outQuad' } as const;
