# Connecting the RSVP form to a Google Sheet

About 10 minutes, once. Do it in the Google account that should own the guest list.

## 1. Make the Sheet
1. Go to [sheets.new](https://sheets.new) and name it, for example **Judah & Deborah – RSVPs**.
2. In the menu, open **Extensions → Apps Script**.

## 2. Add the script
1. Delete everything in the editor (`function myFunction() {}`).
2. Paste in the whole of [`apps-script.gs`](apps-script.gs) from this folder.
3. Optional: to get an email for every reply, put the address in the first setting:
   `const NOTIFY_EMAIL = 'you@gmail.com';`
4. Click **Save** (the disk icon).

## 3. Publish it as a web app
1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, then **Authorize access**, and choose your account.
   Google warns that the app isn't verified, because it's your own script. Click
   **Advanced → Go to (project name) (unsafe)**, then **Allow**. The script can only
   reach this one spreadsheet and, if you set an email, send you emails.
5. Copy the **Web app URL**. It ends in `/exec`.

To check it, open that URL in a browser. You should see
`{"ok":true,"message":"The RSVP receiver is running."}`.

## 4. Connect the invitation
In `frontend/lib/wedding.ts`, paste the URL in:

```ts
rsvpSheetUrl: 'https://script.google.com/macros/s/…/exec',
```

Then send a test reply from the invitation. A **Replies** tab and a **Totals** tab appear
in the Sheet with the first reply. Delete your test row afterwards (the totals update by
themselves).

## What the Sheet holds
- **Replies:** one row per reply. Columns: name, attending, which events, number of people,
  Veg / Non-veg counts, each guest with their meal, the message, and when it was sent. A
  guest who changes their reply updates their own row; *Times changed* counts how often.
- **Totals:** replies received, coming and not coming, people at each event, and Veg /
  Non-veg meals: the numbers for the caterer.

## If you edit the script later
Saving isn't enough. Use **Deploy → Manage deployments → (pencil) Edit → Version: New
version → Deploy**. The URL stays the same.
