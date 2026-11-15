/**
 * RSVP receiver for the wedding invitation.
 *
 * Lives inside the couple's Google Sheet (Extensions > Apps Script) and is deployed as a web
 * app. The invitation's "Send RSVP" posts each reply here; it lands as one row in the
 * "Replies" tab, and the "Totals" tab adds everything up (people, events, Veg / Non-veg).
 * A guest who changes their reply updates their own row instead of adding a new one.
 *
 * Setup steps: see SETUP.md next to this file.
 */

// An email for each new or changed reply, e.g. 'judah.deborah@gmail.com'. Leave '' for no emails.
const NOTIFY_EMAIL = '';

const REPLIES = 'Replies';
const TOTALS = 'Totals';
const HEADERS = [
  'Reply ID', 'First sent', 'Last updated', 'Name', 'Attending', 'Holy Matrimony', 'Reception',
  'People', 'Veg', 'Non-veg', 'Guests and meals', 'Message', 'Times changed',
];
const EVENTS = ['Holy Matrimony', 'Reception'];

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.website) return json({ ok: true }); // the hidden spam-bot field was filled in: ignore quietly
    const r = clean(data);
    if (!r) return json({ ok: false, error: 'invalid reply' });

    const lock = LockService.getScriptLock();
    lock.waitLock(20000); // two guests replying at the same moment never overwrite each other
    let changed;
    try {
      changed = save(r);
    } finally {
      lock.releaseLock();
    }
    notify(r, changed);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** Visiting the web-app address in a browser shows this: a quick way to check it is running. */
function doGet() {
  return json({ ok: true, message: 'The RSVP receiver is running.' });
}

/** Writes the reply: a new row, or the guest's existing row if they are changing their reply. */
function save(r) {
  const sheet = sheets().replies;
  const now = new Date();
  const last = sheet.getLastRow();
  const ids = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().map((row) => row[0]) : [];
  const at = ids.indexOf(r.id);

  const yes = r.attending === 'yes';
  const meals = r.party.filter((g) => g.meal);
  const veg = meals.filter((g) => g.meal === 'veg').length;
  const details = [
    safe(r.name),
    yes ? 'Yes' : 'No',
    yes && r.events.indexOf('Holy Matrimony') !== -1 ? 'Yes' : '',
    yes && r.events.indexOf('Reception') !== -1 ? 'Yes' : '',
    yes ? r.party.length : 0,
    yes ? veg : 0,
    yes ? meals.length - veg : 0,
    safe(yes ? r.party.map((g) => g.name + (g.meal ? ' (' + (g.meal === 'veg' ? 'Veg' : 'Non-veg') + ')' : '')).join(', ') : ''),
    safe(r.message),
  ];

  if (at === -1) {
    sheet.getRange(last + 1, 1, 1, HEADERS.length).setValues([[r.id, now, now].concat(details, [0])]);
    return false;
  }
  const rowNum = at + 2;
  const prev = sheet.getRange(rowNum, 1, 1, HEADERS.length).getValues()[0];
  sheet.getRange(rowNum, 1, 1, HEADERS.length).setValues([[r.id, prev[1], now].concat(details, [(Number(prev[12]) || 0) + 1])]);
  return true;
}

/** Checks and trims what arrived; returns null if it isn't a usable reply. */
function clean(d) {
  const text = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
  const id = String(d.id || '');
  if (!/^[\w-]{6,64}$/.test(id)) return null;
  const name = text(d.name, 80);
  if (!name) return null;
  const attending = d.attending === 'no' ? 'no' : d.attending === 'yes' ? 'yes' : null;
  if (!attending) return null;
  const events = Array.isArray(d.events) ? EVENTS.filter((ev) => d.events.indexOf(ev) !== -1) : [];
  const partyIn = Array.isArray(d.party) ? d.party.slice(0, 8) : [];
  const party = partyIn
    .map((g, i) => ({
      name: i === 0 ? name : text(g && g.name, 80),
      meal: g && (g.meal === 'veg' || g.meal === 'nonveg') ? g.meal : null,
    }))
    .filter((g) => g.name);
  if (!party.length) party.push({ name: name, meal: null });
  return { id: id, name: name, attending: attending, events: events, party: party, message: String(d.message || '').trim().slice(0, 1000) };
}

/** Text a guest typed must never run as a spreadsheet formula. */
function safe(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/** The two tabs, created (with headers and totals) the first time a reply arrives. */
function sheets() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let replies = book.getSheetByName(REPLIES);
  if (!replies) {
    replies = book.insertSheet(REPLIES, 0);
    replies.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#f8e1d6');
    replies.setFrozenRows(1);
    replies.getRange('B:C').setNumberFormat('d mmm yyyy, h:mm am/pm');
    replies.setColumnWidth(11, 320);
    replies.setColumnWidth(12, 320);
  }
  let totals = book.getSheetByName(TOTALS);
  if (!totals) {
    totals = book.insertSheet(TOTALS, 1);
    const R = REPLIES + '!';
    const rows = [
      ['Replies received', '=COUNTA(' + R + 'A2:A)'],
      ['Coming', '=COUNTIF(' + R + 'E2:E,"Yes")'],
      ['Not coming', '=COUNTIF(' + R + 'E2:E,"No")'],
      ['People coming in all', '=SUM(' + R + 'H2:H)'],
      ['People at the Holy Matrimony', '=SUMIFS(' + R + 'H2:H,' + R + 'F2:F,"Yes")'],
      ['People at the Reception', '=SUMIFS(' + R + 'H2:H,' + R + 'G2:G,"Yes")'],
      ['Veg meals', '=SUM(' + R + 'I2:I)'],
      ['Non-veg meals', '=SUM(' + R + 'J2:J)'],
    ];
    totals.getRange(1, 1, 1, 2).setValues([['Total', 'Count']]).setFontWeight('bold').setBackground('#f8e1d6');
    totals.getRange(2, 1, rows.length, 2).setValues(rows);
    totals.setColumnWidth(1, 240);
  }
  return { replies: replies, totals: totals };
}

function notify(r, changed) {
  if (!NOTIFY_EMAIL) return;
  const yes = r.attending === 'yes';
  const lines = [
    (changed ? 'Changed reply from ' : 'New reply from ') + r.name,
    '',
    'Attending: ' + (yes ? 'Yes' : 'No'),
  ];
  if (yes) {
    lines.push('For: ' + (r.events.join(' & ') || 'no events chosen'));
    lines.push('People (' + r.party.length + '): ' + r.party.map((g) => g.name + (g.meal ? ' (' + (g.meal === 'veg' ? 'Veg' : 'Non-veg') + ')' : '')).join(', '));
  }
  if (r.message) lines.push('', 'Message: ' + r.message);
  lines.push('', SpreadsheetApp.getActiveSpreadsheet().getUrl());
  MailApp.sendEmail(NOTIFY_EMAIL, (changed ? 'RSVP changed: ' : 'New RSVP: ') + r.name + (yes ? ' (' + r.party.length + ' coming)' : ' (not coming)'), lines.join('\n'));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
