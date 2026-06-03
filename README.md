# A Book of Voices — collection & hosting app

A small React + Firebase app that does three jobs for the 90th-birthday keepsake:

1. **Collects** written notes, photos, and voice/video clips from 20+ relatives.
2. **Hosts** each one at a stable URL so the printed book's QR codes never rot.
3. **Generates** the QR codes and a print sheet for laying the book out.

Three views, one tiny app (no router dependency):

| URL | Who sees it | What it does |
| --- | --- | --- |
| `/` | Every contributor (share this link) | The submission form |
| `/m/<id>` | Anyone who scans a QR in the book | One person's note + voice + photos |
| `/?gallery=<secret>` | Just you | Review, approve, and print QR codes |

---

## 1. Set up Firebase (about 10 minutes)

1. Create a project at <https://console.firebase.google.com>.
2. **Build → Firestore Database** → Create database (start in production mode).
3. **Build → Storage** → Get started.
4. **Build → Authentication → Sign-in method** → enable **Anonymous** (for
   contributors) and **Google** (so you, the organizer, can sign in to review).
5. **Project settings → Your apps → Web app (`</>`)** → register, then copy the
   `firebaseConfig` object.
6. Paste it into `src/firebase.js`, and set `GALLERY_SECRET` to something private.

### Firestore rules

Paste into **Firestore → Rules**, then **replace the email** with your own.
Anyone may submit; single messages are readable so the QR pages work; but only
*you* — signed in with your Google account — can list every submission, approve,
or delete. Nothing here ever needs toggling.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 👇 Change this to YOUR Google email (must match ORGANIZER_EMAIL in src/Gallery.jsx).
    function isOrganizer() {
      return request.auth != null
        && request.auth.token.email == 'lior.shur@gmail.com'
        && request.auth.token.email_verified == true;
    }
    match /messages/{id} {
      // QR pages read one doc at a time by id.
      allow get: if true;
      // Only the organizer can list every submission (the review gallery).
      allow list: if isOrganizer();
      // Signed-in (anonymous) contributors may create their doc...
      allow create: if request.auth != null;
      // ...and patch in their own uploaded URLs, but cannot self-approve.
      // The organizer may update anything (e.g. flip `approved`).
      allow update: if isOrganizer()
        || (request.auth != null
            && request.resource.data.approved == resource.data.approved);
      // Only the organizer can delete.
      allow delete: if isOrganizer();
    }
  }
}
```

> **The organizer gallery is now self-securing.** Visit `/?gallery=YOUR_SECRET`
> and click **Sign in with Google**; the rule above lets only your email read
> the list and approve. Set the same email as `ORGANIZER_EMAIL` near the top of
> `src/Gallery.jsx`. No rule needs to be flipped on and off anymore.

### Storage rules

Paste into **Storage → Rules**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /messages/{id}/{file=**} {
      allow read: if true;                 // QR pages show the photos/clips
      allow write: if request.auth != null // any signed-in contributor
        && request.resource.size < 50 * 1024 * 1024;
    }
  }
}
```

---

## 2. Run it locally

```bash
npm install
npm run dev      # opens http://localhost:5173
```

Test the flow: submit a message at `/`, then open `/?gallery=YOUR_SECRET` to see
it, approve it, and check the QR. Scanning that QR (or visiting `/m/<id>`) should
show the note and play the clip.

## 3. Deploy

Any static host works since it's a Vite build. Two easy options:

- **Firebase Hosting** (keeps everything in one place):
  ```bash
  npm install -g firebase-tools
  firebase login
  firebase init hosting      # public dir: dist, single-page app: YES
  npm run build && firebase deploy
  ```
- **Netlify / GitHub Pages**: build with `npm run build`, deploy the `dist/`
  folder. For SPA routing, add a redirect so `/m/<id>` serves `index.html`
  (Netlify: a `_redirects` file with `/*  /index.html  200`).

Your share link becomes e.g. `https://your-project.web.app/`.

---

## 4. From submissions to a printed book

1. Collect everything (share the `/` link; chase people).
2. Open the gallery, **approve** the messages you want in.
3. Click **Print QR sheet** → you get a labelled grid of QR codes (one per
   person). Save as PDF, or use the per-card **Download QR** buttons to grab
   individual PNGs.
4. In your photobook tool (Mixbook, Artifact Uprising, Milk, Snapfish, etc.),
   build each page: the person's photo + their written note + their QR code.
   Scanning it opens `/m/<id>` and plays their voice.
5. Order the book. Done.

### Data model (Firestore `messages/<id>`)

| field | type | notes |
| --- | --- | --- |
| `name` | string | contributor's name |
| `relationship` | string | e.g. "eldest granddaughter" (optional) |
| `generation` | string | `child` / `grandchild` / `greatgrand` / `other` |
| `prompt` | string | which prompt they answered |
| `pullQuote` | string | optional short one-liner for the big page quote |
| `text` | string | the written note for the page |
| `lang` | string | UI language used to submit (`he` / `en`) |
| `photoURLs` | string[] | download URLs |
| `clipURL` | string \| null | audio/video download URL |
| `clipKind` | string \| null | `audio` / `video` |
| `approved` | bool | shown in the print sheet only when true |
| `createdAt` | timestamp | server time |

---

## Languages (Hebrew + English)

The app opens in **Hebrew, right-to-left**, with a visible **עברית / English**
toggle pinned to the top corner of every screen. The choice is remembered per
device (localStorage). All UI text — the form, the QR pages, and the organizer
gallery — lives in `src/i18n.jsx`; edit the `he` / `en` dictionaries there to
reword anything (the prompts are in that file too). Contributors' own notes are
shown with `dir="auto"`, so a Hebrew note reads RTL and an English note reads
LTR regardless of which language the *viewer* has selected.

## Notes

- Edit the prompt list and all copy in `src/i18n.jsx` — that's what keeps 20+
  notes from sounding identical (and it's where both languages live).
- In-browser recording produces `audio/webm`; if you need iOS-friendly playback
  everywhere, ask contributors to upload a clip recorded on their phone instead.
- Keep the QR target URLs stable: don't change the deployed domain after
  printing, or the codes in the book will break.
