import { useEffect, useMemo, useState } from "react";
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import QRCode from "qrcode";
import { useLang } from "./i18n.jsx";

const GEN_ORDER = ["child", "grandchild", "greatgrand", "other"];

export default function Gallery() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrMap, setQrMap] = useState({}); // id -> dataURL

  useEffect(() => {
    (async () => {
      const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(rows);
      setLoading(false);

      // Pre-generate a QR per message.
      const map = {};
      for (const r of rows) {
        const url = `${window.location.origin}/m/${r.id}`;
        map[r.id] = await QRCode.toDataURL(url, { margin: 1, width: 320 });
      }
      setQrMap(map);
    })();
  }, []);

  const grouped = useMemo(() => {
    const g = {};
    for (const it of items) (g[it.generation] ||= []).push(it);
    return g;
  }, [items]);

  async function toggleApprove(it) {
    await updateDoc(doc(db, "messages", it.id), { approved: !it.approved });
    setItems((prev) =>
      prev.map((p) => (p.id === it.id ? { ...p, approved: !p.approved } : p))
    );
  }

  const approvedCount = items.filter((i) => i.approved).length;

  if (loading) {
    return (
      <main className="page center">
        <p className="kicker">{t.loading}</p>
      </main>
    );
  }

  return (
    <main className="page gallery">
      <header className="masthead">
        <p className="kicker">{t.organizerKicker}</p>
        <h1>{t.submissionsTitle}</h1>
        <p className="lede">{t.galleryLede(items.length, approvedCount)}</p>
        <button className="primary" onClick={() => window.print()}>
          {t.printBtn}
        </button>
      </header>

      {GEN_ORDER.filter((g) => grouped[g]?.length).map((g) => (
        <section key={g} className="screen-only">
          <h2 className="gen-head">{t.genHeads[g]}</h2>
          <div className="grid">
            {grouped[g].map((it) => (
              <article key={it.id} className={`card sub ${it.approved ? "on" : ""}`}>
                <p className="kicker" dir="auto">{it.prompt}</p>
                <blockquote className="note small" dir="auto">{it.text}</blockquote>
                <p className="signoff" dir="auto">
                  — {it.name}
                  {it.relationship ? `, ${it.relationship}` : ""}
                </p>
                <div className="sub-meta">
                  {it.clipURL ? (
                    <span className="tag">🔊 {t.kinds[it.clipKind] || it.clipKind}</span>
                  ) : (
                    <span className="tag muted">{t.noVoice}</span>
                  )}
                  {it.photoURLs?.length ? <span className="tag">🖼 {it.photoURLs.length}</span> : null}
                </div>
                {qrMap[it.id] && (
                  <div className="qr-block">
                    <img src={qrMap[it.id]} alt="QR" className="qr" />
                    <a className="link" href={qrMap[it.id]} download={`qr-${it.name}.png`}>
                      {t.downloadQR}
                    </a>
                  </div>
                )}
                <button
                  className={it.approved ? "ghost" : "primary small"}
                  onClick={() => toggleApprove(it)}
                >
                  {it.approved ? t.approvedBtn : t.approveBtn}
                </button>
              </article>
            ))}
          </div>
        </section>
      ))}

      {/* Print-only QR contact sheet: clean labels for laying out the book. */}
      <section className="print-only qr-sheet">
        <h2>{t.qrSheetTitle}</h2>
        <div className="qr-sheet-grid">
          {items
            .filter((i) => i.approved && qrMap[i.id])
            .map((i) => (
              <figure key={i.id}>
                <img src={qrMap[i.id]} alt="" />
                <figcaption dir="auto">
                  {i.name}
                  {i.relationship ? ` · ${i.relationship}` : ""}
                </figcaption>
              </figure>
            ))}
        </div>
      </section>
    </main>
  );
}
