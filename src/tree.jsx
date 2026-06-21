import { createContext, useContext, useEffect, useState } from "react";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

// The organizer-built family tree, stored in config/tree (public read,
// organizer write — same rules as config/life).
//   config/tree = { honoreeName, honoreeSpouse, backdrop, people: [ Person ] }
//   Person = { id, name, parentId, spouseName, messageId }
//     parentId === "" (or null)  -> a child of the honoree (the tree root)
//     spouseName                 -> the partner who married in (shown beside)
//     messageId                  -> optional link to a contributor's page
// Generation is derived from depth, so it never has to be set by hand.

const Ctx = createContext(null);
const uid = () => `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const EMPTY = { honoreeName: "", honoreeSpouse: "", backdrop: "", people: [] };

export function makePerson(name = "", extra = {}) {
  return { id: uid(), name, parentId: "", spouseName: "", messageId: null, ...extra };
}

export function TreeProvider({ children }) {
  const [tree, setTree] = useState(EMPTY);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "config", "tree"));
        if (snap.exists()) {
          const d = snap.data();
          setTree({
            honoreeName: d.honoreeName || "",
            honoreeSpouse: d.honoreeSpouse || "",
            backdrop: d.backdrop || "",
            people: Array.isArray(d.people) ? d.people : [],
          });
        }
      } catch {
        /* not signed in / no doc yet */
      }
    })();
  }, []);

  async function saveTree(next) {
    setTree(next);
    await setDoc(doc(db, "config", "tree"), next, { merge: true });
  }

  return <Ctx.Provider value={{ tree, saveTree }}>{children}</Ctx.Provider>;
}

export function useTree() {
  return useContext(Ctx) || { tree: EMPTY, saveTree: async () => {} };
}

// All descendant ids of a person — used to keep the "parent" picker from
// creating a cycle (you can't make someone a child of their own descendant).
export function descendantIds(people, id) {
  const out = new Set();
  const walk = (pid) => {
    for (const p of people) {
      if (p.parentId === pid && !out.has(p.id)) {
        out.add(p.id);
        walk(p.id);
      }
    }
  };
  walk(id);
  return out;
}
