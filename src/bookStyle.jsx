import { createContext, useContext, useEffect, useState } from "react";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Organizer-controlled typography for the dynamic (contributor) text in the
// book. Saved to config/book so every surface — gallery, online book, the
// public /book page, print and image export — renders the same way.

export const FONTS = {
  handwriting: '"Caveat", "Gveret Levin", cursive',
  script: '"Parisienne", "Gveret Levin", cursive',
  serif: '"Fraunces", "Frank Ruhl Libre", Georgia, serif',
  softserif: '"Newsreader", "Frank Ruhl Libre", Georgia, serif',
  sans: '"Assistant", system-ui, sans-serif',
};

export const ROLES = ["name", "quote", "body", "sign"];

// Defaults — note the long message (body) is handwriting now.
export const DEFAULT_TEXT = {
  name: { font: "script", bold: false, size: 4.4 },
  quote: { font: "handwriting", bold: false, size: 2.6 },
  body: { font: "handwriting", bold: false, size: 1.3 },
  sign: { font: "handwriting", bold: false, size: 2.8 },
};

export function varStyle(settings) {
  const v = {};
  for (const role of ROLES) {
    const r = settings[role] || DEFAULT_TEXT[role];
    v[`--t-${role}-font`] = FONTS[r.font] || FONTS.serif;
    v[`--t-${role}-weight`] = r.bold ? 700 : 400;
    v[`--t-${role}-size`] = `${r.size}rem`;
  }
  return v;
}

const Ctx = createContext(null);

export function BookStyleProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_TEXT);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "config", "book"));
        if (snap.exists() && snap.data().text) {
          setSettings((s) => ({ ...s, ...snap.data().text }));
        }
      } catch {
        /* not signed in / no doc yet — use defaults */
      }
    })();
  }, []);

  async function saveSettings(next) {
    setSettings(next);
    try {
      await setDoc(doc(db, "config", "book"), { text: next }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Ctx.Provider value={{ settings, setSettings, saveSettings, vars: varStyle(settings) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBookStyle() {
  return useContext(Ctx);
}

export function useBookVars() {
  const ctx = useContext(Ctx);
  return ctx ? ctx.vars : varStyle(DEFAULT_TEXT);
}
