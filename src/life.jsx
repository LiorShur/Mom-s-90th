import { createContext, useContext, useEffect, useState } from "react";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

// "Her life in photos" — an organizer-curated set of the honoree's own photos
// with a year + caption each. Stored in config/life (public read, organizer
// write — same rule as the other config docs).

const Ctx = createContext(null);

export function LifeProvider({ children }) {
  const [photos, setPhotos] = useState([]); // [{ url, year, caption }]

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "config", "life"));
        if (snap.exists() && Array.isArray(snap.data().photos)) {
          setPhotos(snap.data().photos);
        }
      } catch {
        /* no doc yet / not signed in */
      }
    })();
  }, []);

  async function savePhotos(next) {
    setPhotos(next);
    await setDoc(doc(db, "config", "life"), { photos: next }, { merge: true });
  }

  return <Ctx.Provider value={{ photos, savePhotos }}>{children}</Ctx.Provider>;
}

export function useLife() {
  return useContext(Ctx) || { photos: [], savePhotos: async () => {} };
}

// Chronological pages of up to `perPage` photos (sorted by year; blanks last).
export function lifePages(photos, perPage = 6) {
  const sorted = (photos || []).slice().sort((a, b) => {
    const ya = parseInt(a.year, 10);
    const yb = parseInt(b.year, 10);
    return (isNaN(ya) ? 9999 : ya) - (isNaN(yb) ? 9999 : yb);
  });
  const pages = [];
  for (let i = 0; i < sorted.length; i += perPage) {
    pages.push(sorted.slice(i, i + perPage));
  }
  return pages;
}
