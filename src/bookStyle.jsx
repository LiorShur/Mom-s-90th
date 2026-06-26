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

export const ROLES = ["quote", "body", "sign"];

// Defaults — note the long message (body) is handwriting now.
export const DEFAULT_TEXT = {
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

// Editable cover/closing content (text + optional background image). Empty
// fields fall back to the language defaults in CoverPage/ClosingPage.
export const DEFAULT_BOOK = { precover: {}, cover: {}, closing: {}, icon: {} };

export function BookStyleProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_TEXT);
  const [book, setBook] = useState(DEFAULT_BOOK);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "config", "book"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.text) setSettings((s) => ({ ...s, ...data.text }));
          setBook({
            precover: data.precover || {},
            cover: data.cover || {},
            closing: data.closing || {},
            icon: data.icon || {},
          });
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

  async function saveBook(next) {
    setBook(next);
    try {
      await setDoc(
        doc(db, "config", "book"),
        {
          precover: next.precover,
          cover: next.cover,
          closing: next.closing,
          icon: next.icon || {},
        },
        { merge: true }
      );
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Ctx.Provider
      value={{ settings, setSettings, saveSettings, book, saveBook, vars: varStyle(settings) }}
    >
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

export function useBookContent() {
  const ctx = useContext(Ctx);
  return ctx ? ctx.book : DEFAULT_BOOK;
}
