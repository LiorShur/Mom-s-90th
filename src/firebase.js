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
  apiKey: "AIzaSyBDV__k9aN2L6648atm04gx8LRan4zGwUE",
  authDomain: "miriam-s-90th-album.firebaseapp.com",
  projectId: "miriam-s-90th-album",
  storageBucket: "miriam-s-90th-album.firebasestorage.app",
  messagingSenderId: "604826170908",
  appId: "1:604826170908:web:7ac0fad6439ca5405f91d9",
  measurementId: "G-FL2DJHZNH1"
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
export const GALLERY_SECRET = "miriam-90-book";
