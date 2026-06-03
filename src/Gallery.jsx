import { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
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
import PrintBook from "./PrintBook.jsx";
import OnlineBook from "./OnlineBook.jsx";
import { SpreadThumb, splitText } from "./book.jsx";

const BOOK_STYLES = ["luxury", "modern", "vintage"];

// The Google account allowed to review submissions. This MUST match the email
// in your Firestore security rules — that rule is what actually enforces it;
// this line just gives a friendly message if the wrong account signs in.
const ORGANIZER_EMAIL = "lior.shur@gmail.com";

const GEN_ORDER = ["child", "grandchild", "greatgrand", "other"];

export default function Gallery() {
  const { t } = useLang();
  const [user, setUser] = useState(undefined); // undefined = still checking
  const [authError, setAuthError] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrMap, setQrMap] = useState({}); // id -> dataURL
  const [printMode, setPrintMode] = useState("proof"); // proof | qr
  const [view, setView] = useState("grid"); // grid | book
  const [copied, setCopied] = useState(false);

  function copyBookLink() {
    const url = `${window.location.origin}/book`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }
  const [bookStyle, setBookStyle] = useState(
    () => localStorage.getItem("bookStyle") || "luxury"
  );

  function chooseStyle(s) {
    setBookStyle(s);
    try {
      localStorage.setItem("bookStyle", s);
    } catch {
      /* ignore */
    }
  }

  // Switch the print layout, then open the print dialog once it has rendered.
  function printAs(mode) {
    setPrintMode(mode);
    setTimeout(() => window.print(), 60);
  }

  const isOrganizer =
    user && !user.isAnonymous && user.email === ORGANIZER_EMAIL;

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), []);

  useEffect(() => {
    if (!isOrganizer) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (cancelled) return;
      setItems(rows);
      setLoading(false);

      // Pre-generate a QR per message.
      const map = {};
      for (const r of rows) {
        const url = `${window.location.origin}/m/${r.id}`;
        map[r.id] = await QRCode.toDataURL(url, { margin: 1, width: 320 });
      }
      if (!cancelled) setQrMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOrganizer]);

  const grouped = useMemo(() => {
    const g = {};
    for (const it of items) (g[it.generation] ||= []).push(it);
    return g;
  }, [items]);

  async function handleSignIn() {
    setAuthError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      setAuthError(e.message || "");
    }
  }

  async function toggleApprove(it) {
    await updateDoc(doc(db, "messages", it.id), { approved: !it.approved });
    setItems((prev) =>
      prev.map((p) => (p.id === it.id ? { ...p, approved: !p.approved } : p))
    );
  }

  const approvedCount = items.filter((i) => i.approved).length;

  // --- Auth gate: only the organizer's Google account reaches the data ---
  if (user === undefined) {
    return (
      <main className="page center">
        <p className="kicker">{t.checkingAuth}</p>
      </main>
    );
  }

  if (!isOrganizer) {
    return (
      <main className="page narrow center">
        <div className="card thanks">
          <p className="kicker">{t.organizerKicker}</p>
          <h1>{t.reviewSignInTitle}</h1>
          <p className="lede">{t.reviewSignInLede}</p>
          <button className="primary" onClick={handleSignIn}>
            {t.signInBtn}
          </button>
          {user && user.email && user.email !== ORGANIZER_EMAIL && (
            <p className="error" style={{ marginTop: 16 }}>
              {t.notOrganizer(user.email)}{" "}
              <button className="link" onClick={() => signOut(auth)}>
                {t.signOutBtn}
              </button>
            </p>
          )}
          {authError && <p className="error">{authError}</p>}
        </div>
      </main>
    );
  }

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
        <div className="style-picker">
          <span className="style-label">{t.styleLabel}</span>
          {BOOK_STYLES.map((s) => (
            <button
              key={s}
              className={`chip ${bookStyle === s ? "on" : ""}`}
              onClick={() => chooseStyle(s)}
            >
              {t.styles[s]}
            </button>
          ))}
        </div>
        <div className="gallery-actions">
          <button
            className="primary"
            onClick={() => setView(view === "book" ? "grid" : "book")}
          >
            {view === "book" ? t.backToList : t.viewBookBtn}
          </button>
          <button className="ghost" onClick={() => printAs("proof")}>
            {t.printProofBtn}
          </button>
          <button className="ghost" onClick={() => printAs("qr")}>
            {t.printBtn}
          </button>
          <button className="ghost" onClick={copyBookLink}>
            {copied ? t.linkCopied : t.shareBtn}
          </button>
          <button className="ghost" onClick={() => signOut(auth)}>
            {t.signOutBtn}
          </button>
        </div>
      </header>

      {view === "book" && (
        <OnlineBook items={items} qrMap={qrMap} style={bookStyle} />
      )}

      {view === "grid" && GEN_ORDER.filter((g) => grouped[g]?.length).map((g) => (
        <section key={g} className="screen-only">
          <h2 className="gen-head">{t.genHeads[g]}</h2>
          <div className="grid">
            {grouped[g].map((it) => (
              <article key={it.id} className={`card sub ${it.approved ? "on" : ""}`}>
                <p className="kicker" dir="auto">{it.prompt}</p>
                <div className="card-spread">
                  <SpreadThumb it={it} qr={qrMap[it.id]} style={bookStyle} />
                </div>
                <p className="card-quote" dir="auto">“{splitText(it).pull}”</p>
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
                {it.photoURLs?.length > 0 && (
                  <div className="thumb-strip">
                    {it.photoURLs.map((u, i) => (
                      <a key={i} href={u} target="_blank" rel="noreferrer">
                        <img src={u} alt="" />
                      </a>
                    ))}
                  </div>
                )}
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

      {/* Print-only output. "proof" = a composed page per person (photo +
          note + QR), "qr" = just the QR contact sheet. */}
      {printMode === "qr" ? (
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
      ) : (
        <div className="print-only">
          <PrintBook items={items} qrMap={qrMap} style={bookStyle} />
        </div>
      )}
    </main>
  );
}
