import { createContext, useContext, useEffect, useState } from "react";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

// "Her life in photos" — free-form layflat spreads (58×29 cm) the organizer
// composes: each spread holds photos AND text placed/sized/rotated freely (a
// timeline, right-to-left). Stored in config/life (public read, organizer write).
//   config/life = { spreads: [ { items: [ photo|text ] } ] }
//   photo = { id, type:'photo', url, x, y, w, rot, shadow, z }
//   text  = { id, type:'text', text, x, y, w, rot, font, size, color, bold, z }

const Ctx = createContext(null);

const uid = (i) => `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;

export function makePhoto(url, i = 0) {
  const col = i % 4;
  const row = Math.floor(i / 4) % 2;
  return {
    id: uid(i), type: "photo", url,
    x: 70 - col * 20, // start at the right, step left (RTL timeline)
    y: 8 + row * 42, w: 18, rot: 0, shadow: 18, z: i,
  };
}

export function makeText(i = 0) {
  return {
    id: uid(i), type: "text", text: "טקסט",
    x: 40, y: 45, w: 24, rot: 0,
    font: "script", size: 2, color: "#2b2622", bold: false, z: 100 + i,
  };
}

export function LifeProvider({ children }) {
  const [spreads, setSpreads] = useState([]); // [{ items: [...] }]

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "config", "life"));
        const data = snap.exists() ? snap.data() : null;
        if (data && Array.isArray(data.spreads)) setSpreads(data.spreads);
      } catch {
        /* no doc / not signed in */
      }
    })();
  }, []);

  async function saveSpreads(next) {
    setSpreads(next);
    await setDoc(doc(db, "config", "life"), { spreads: next }, { merge: true });
  }

  return <Ctx.Provider value={{ spreads, saveSpreads }}>{children}</Ctx.Provider>;
}

export function useLife() {
  return useContext(Ctx) || { spreads: [], saveSpreads: async () => {} };
}
