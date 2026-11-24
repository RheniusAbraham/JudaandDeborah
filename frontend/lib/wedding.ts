// All wedding details live here. Change a line, and every place on the page follows.
export const wedding = {
  // First names, for the big script names on the opening arch.
  partnerOne: 'Judah',
  partnerTwo: 'Deborah',

  // Scene 2: the couple, with their parents.
  bride: {
    name: 'Deborah Daniel',
    relation: 'Daughter of',
    parents: ['Late Mr. P. Daniel', 'Mrs. Jesi Daniel'],
  },
  groom: {
    name: 'Judah Oushed Rajkumar',
    relation: 'Son of',
    parents: ['Mr. Antony Rajkumar', 'Mrs. Nirmala Rajkumar'],
  },

  // The day. The countdown runs to the start of the ceremony (local time).
  // Times carry India's offset (+05:30), so guests abroad see the right countdown and
  // calendar time.
  start: '2027-01-04T15:00:00+05:30',
  dateLabel: 'Monday, 4 January 2027',
  footerDate: '4 January 2027',

  // Scene 4: the church ceremony.
  church: {
    name: 'City Harvest AG Church',
    address: 'HBR Layout, Bengaluru',
    time: '3:00 PM',
    start: '2027-01-04T15:00:00+05:30',
    end: '2027-01-04T17:00:00+05:30',
    // opens this exact place in Google Maps (from the map link shared for the church)
    maps: 'https://maps.google.com/?cid=15349422656933301550',
    // The order of service, shown in the scene after the church. A `time` is optional.
    order: [
      { name: 'Groom’s Entry', time: '2:55 PM' },
      { name: 'Bridal March', time: '3:00 PM' },
      { name: 'Opening Prayer' },
      { name: 'Worship' },
      { name: 'Message' },
      { name: 'Special Song' },
      { name: 'Solemnisation' },
      { name: 'Blessing Prayer' },
      { name: 'Registration' },
      { name: 'Declaration of Marriage' },
      { name: 'Greetings' },
      { name: 'Vote of Thanks' },
      { name: 'Prayer and Benediction' },
    ] as { name: string; time?: string }[],
  },

  // Scene 5: the reception, the same evening.
  reception: {
    name: 'CMA Palace Convention & Wedding Hall',
    address: 'Bengaluru',
    time: '6:30 PM',
    note: 'Dinner, music and dancing',
    start: '2027-01-04T18:30:00+05:30',
    end: '2027-01-04T22:30:00+05:30',
    // opens this exact place in Google Maps (from the map link shared for the hall)
    maps: 'https://maps.google.com/?cid=12115308714572026884',
  },

  rsvpBy: '20 December 2026',
  // Where RSVPs are saved: the web-app address of the couple's Google Sheet script
  // (it ends in /exec; see rsvp/SETUP.md). Empty: the form works, but replies go nowhere.
  rsvpSheetUrl: 'https://script.google.com/macros/s/AKfycbyK7uVMd8Js8EKVhLRXuFzRSHlnxqA2-LrwF11AqY_Zy4bKZREPNw3FiFMsT3GyZJjEWw/exec',
};

type Place = { name: string; address: string; maps?: string };
type Timed = Place & { start: string; end: string };

/** A link that opens the place in Google Maps (its exact listing when we have one). */
export function mapsUrl(p: Place) {
  if (p.maps) return p.maps;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name}, ${p.address}`)}`;
}

/** A Google Calendar link for one event of the day. */
export function calendarUrl(title: string, e: Timed) {
  // in UTC (the trailing Z), so the event lands at the right moment in any guest's calendar
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(e.start)}/${fmt(e.end)}`,
    location: `${e.name}, ${e.address}`,
    ctz: 'Asia/Kolkata',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
