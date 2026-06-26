import { createContext, useContext, useEffect, useState } from "react";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

// A sing-along songbook for the online book, stored in config/songs (public
// read, organizer write).
//   config/songs = { published, items: [ Song ] }
//   Song = { id, title, artist, youtubeUrl, audioUrl, lyrics }

const Ctx = createContext(null);
const uid = () => `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const EMPTY = { published: true, items: [] };

// The four requested songs + a few classic Israeli sing-along favourites.
// Titles only — paste lyrics + a YouTube link per song in the editor.
export const SEED_TITLES = [
  "הכל פתוח",
  "עוד לא אהבתי די",
  "בשנה הבאה",
  "ירושלים של זהב",
  "ערב של שושנים",
  "כלניות",
  "אני ואתה",
  "לו יהי",
];

export function makeSong(title = "", extra = {}) {
  return { id: uid(), title, artist: "", youtubeUrl: "", audioUrl: "", lyrics: "", phonetic: "", ...extra };
}

export function SongsProvider({ children }) {
  const [songs, setSongs] = useState(EMPTY);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "config", "songs"));
        if (snap.exists()) {
          const d = snap.data();
          setSongs({
            published: d.published !== false,
            items: Array.isArray(d.items) ? d.items : [],
          });
        }
      } catch {
        /* not signed in / no doc yet */
      }
    })();
  }, []);

  async function saveSongs(next) {
    setSongs(next);
    await setDoc(doc(db, "config", "songs"), next, { merge: true });
  }

  return <Ctx.Provider value={{ songs, saveSongs }}>{children}</Ctx.Provider>;
}

export function useSongs() {
  return useContext(Ctx) || { songs: EMPTY, saveSongs: async () => {} };
}

// Pull a YouTube video id out of the common URL shapes.
export function youtubeId(url = "") {
  const m = url.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : "";
}
