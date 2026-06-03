import { useEffect, useState } from "react";
import { db, ensureSignedIn } from "./firebase.js";
import { collection, getDocs, query, where } from "firebase/firestore";
import QRCode from "qrcode";
import { useLang } from "./i18n.jsx";
import OnlineBook from "./OnlineBook.jsx";

const STYLES = ["luxury", "modern", "vintage"];

// Optional ?style= override, otherwise Luxury.
function styleFromUrl() {
  const s = new URL(window.location.href).searchParams.get("style");
  return STYLES.includes(s) ? s : "luxury";
}

// The public, shareable book at /book — lists ONLY approved entries (the
// Firestore rule enforces that; drafts stay private). No sign-in for visitors.
export default function PublicBook() {
  const { t } = useLang();
  const [items, setItems] = useState(null); // null = loading
  const style = styleFromUrl();
  const [qrMap, setQrMap] = useState({});

  useEffect(() => {
    (async () => {
      try {
        await ensureSignedIn();
        const q = query(
          collection(db, "messages"),
          where("approved", "==", true)
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(rows);

        const map = {};
        for (const r of rows) {
          map[r.id] = await QRCode.toDataURL(
            `${window.location.origin}/m/${r.id}`,
            { margin: 1, width: 320 }
          );
        }
        setQrMap(map);
      } catch (e) {
        console.error(e);
        setItems([]);
      }
    })();
  }, []);

  if (items === null) {
    return (
      <main className="page center">
        <p className="kicker">{t.opening}</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="page narrow center">
        <p className="lede">{t.missing}</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="public-intro">
        <p className="kicker">{t.forGrandma}</p>
        <h1 dir="auto">{t.bookCoverTitle}</h1>
        <p className="lede" dir="auto">{t.bookWelcome}</p>
      </header>
      <OnlineBook items={items} qrMap={qrMap} style={style} />
      <footer className="public-credits" dir="auto">{t.bookCredits}</footer>
    </main>
  );
}
