'use client';

import { useEffect, useState } from 'react';
import { wedding } from '@/lib/wedding';

function left(target: number) {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  return { days: Math.floor(mins / 1440), hours: Math.floor(mins / 60) % 24, minutes: mins % 60 };
}

/** Days, hours and minutes until the ceremony, updating live. */
export default function Countdown() {
  // undefined until mounted, so server and browser render the same first frame
  const [t, setT] = useState<ReturnType<typeof left> | undefined>(undefined);

  useEffect(() => {
    const target = new Date(wedding.start).getTime();
    const tick = () => setT(left(target));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  if (t === null) return <p className="cd-today">Today is the day.</p>;
  const units: [string, number | undefined][] = [
    ['days', t?.days],
    ['hours', t?.hours],
    ['minutes', t?.minutes],
  ];
  return (
    <div className="cd" role="timer" aria-live="off">
      {units.map(([label, n]) => (
        <div key={label} className="cd-unit">
          <span className="cd-n">{n ?? '–'}</span>
          <span className="cd-l">{label}</span>
        </div>
      ))}
    </div>
  );
}
