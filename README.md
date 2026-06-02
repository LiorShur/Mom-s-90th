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
4. **Build → Authentication → Sign-in method** → enable **Anonymous**.
5. **Project settings → Your apps → Web app (`</>`)** → register, then copy the
   `firebaseConfig` object.
6. Paste it into `src/firebase.js`, and set `GALLERY_SECRET` to something private.

### Firestore rules

Paste into **Firestore → Rules**. Anyone may submit; nobody can read the full
list or edit/delete except via the console — single messages are readable so the
QR pages work.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{id} {
      // QR pages read one doc at a time by id; the list query is blocked.
      allow get: if true;
      allow list: if false;
      // Signed-in (anonymous) visitors may create and patch their own new doc.
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && request.resource.data.approved == resource.data.approved; // can't self-approve
      allow delete: if false;
    }
  }
}
```

> The organizer gallery uses a `list` query, so when you want to review
> submissions, temporarily set `allow list: if true;` (or run the gallery while
> signed in as yourself with a stricter rule). Flip it back to `false` before
> sharing the link widely. Approving/deleting is safest done from the Firebase
> console directly if you prefer not to loosen rules at all.

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
| `text` | string | the written note for the page |
| `photoURLs` | string[] | download URLs |
| `clipURL` | string \| null | audio/video download URL |
| `clipKind` | string \| null | `audio` / `video` |
| `approved` | bool | shown in the print sheet only when true |
| `createdAt` | timestamp | server time |

---

## Notes

- Edit the prompt list and copy in `src/Submit.jsx` — that's what keeps 20+
  notes from sounding identical.
- In-browser recording produces `audio/webm`; if you need iOS-friendly playback
  everywhere, ask contributors to upload a clip recorded on their phone instead.
- Keep the QR target URLs stable: don't change the deployed domain after
  printing, or the codes in the book will break.
