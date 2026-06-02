// ---------------------------------------------------------------------------
// firebase.js
// ---------------------------------------------------------------------------
// 1. Create a project at https://console.firebase.google.com
// 2. Add a Web app, then copy its config object into firebaseConfig below.
// 3. In the console enable: Firestore Database, Storage, and
//    Authentication > Sign-in method > Anonymous.
// 4. Paste the security rules from README.md into Firestore + Storage.
// ---------------------------------------------------------------------------

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "PASTE_ME",
  authDomain: "PASTE_ME.firebaseapp.com",
  projectId: "PASTE_ME",
  storageBucket: "PASTE_ME.appspot.com",
  messagingSenderId: "PASTE_ME",
  appId: "PASTE_ME",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Contributors don't log in — we sign them in anonymously so security rules
// can still distinguish "a real visitor" from random API traffic.
export function ensureSignedIn() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return signInAnonymously(auth).then((cred) => cred.user);
}

// Flip to true only when you (the organizer) want to see the admin gallery.
// Simplest approach: append ?gallery=YOUR_SECRET to the URL (see App.jsx).
export const GALLERY_SECRET = "change-me-to-something-private";
