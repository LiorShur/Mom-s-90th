import { useEffect, useRef, useState } from "react";
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
import ExportSpreads from "./ExportSpreads.jsx";
import OnlineBook from "./OnlineBook.jsx";
import GalleryEditor from "./GalleryEditor.jsx";
import { SpreadThumb, splitText, PAGE_PX, orderedAll, orderKey } from "./book.jsx";
import { useBookStyle, FONTS, ROLES } from "./bookStyle.jsx";

const BOOK_STYLES = ["luxury", "modern", "vintage"];

// The Google account allowed to review submissions. This MUST match the email
// in your Firestore security rules — that rule is what actually enforces it;
// this line just gives a friendly message if the wrong account signs in.
const ORGANIZER_EMAIL = "lior.shur@gmail.com";

export default function Gallery() {
  const { t } = useLang();
  const { settings, setSettings, saveSettings } = useBookStyle();
  const [showStyle, setShowStyle] = useState(false);

  // Live-update one field of one text role (name/quote/body/sign).
  function setRole(role, key, val) {
    setSettings({ ...settings, [role]: { ...settings[role], [key]: val } });
  }

  const [user, setUser] = useState(undefined); // undefined = still checking
  const [authError, setAuthError] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrMap, setQrMap] = useState({}); // id -> dataURL
  const [printMode, setPrintMode] = useState("proof"); // proof | qr
  const [view, setView] = useState("grid"); // grid | book
  const [editingId, setEditingId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProg, setExportProg] = useState(null); // {i, n}
  const [exportFmt, setExportFmt] = useState("pages"); // pages | spread | spread-framed
  const exportRef = useRef(null);

  function applyEdit(id, fields) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)));
    setEditingId(null);
  }

  // Give every item a concrete numeric `order` (book order), then show the
  // arrange screen. Done once, so later swaps only touch two docs.
  async function enterArrange() {
    setView("arrange");
    if (items.some((i) => typeof i.order !== "number")) {
      const ord = orderedAll(items);
      await Promise.all(
        ord.map((it, i) => updateDoc(doc(db, "messages", it.id), { order: i }))
      );
      setItems((prev) =>
        prev.map((p) => ({ ...p, order: ord.findIndex((o) => o.id === p.id) }))
      );
    }
  }

  // Move an item up (-1) or down (+1) by swapping its order with its neighbour.
  async function move(it, dir) {
    const ord = orderedAll(items);
    const idx = ord.findIndex((x) => x.id === it.id);
    const j = idx + dir;
    if (j < 0 || j >= ord.length) return;
    const a = ord[idx];
    const b = ord[j];
    const ao = a.order ?? idx;
    const bo = b.order ?? j;
    await Promise.all([
      updateDoc(doc(db, "messages", a.id), { order: bo }),
      updateDoc(doc(db, "messages", b.id), { order: ao }),
    ]);
    setItems((prev) =>
      prev.map((p) =>
        p.id === a.id ? { ...p, order: bo } : p.id === b.id ? { ...p, order: ao } : p
      )
    );
  }

  // Render the book off-screen and rasterize to 300-DPI JPEGs.
  // format: "pages" (30×30 single pages) | "spread" | "spread-framed" (58×29).
  async function exportImages(format) {
    setExportFmt(format);
    setExporting(true);
    setExportProg({ i: 0, n: 0 });
    await new Promise((r) => setTimeout(r, 120)); // let the export stage mount
    try {
      const stage = exportRef.current;
      const imgs = [...stage.querySelectorAll("img")];
      await Promise.all(
        imgs.map((im) =>
          im.complete && im.naturalWidth
            ? null
            : new Promise((res) => {
                im.onload = im.onerror = res;
              })
        )
      );
      await new Promise((r) => setTimeout(r, 200)); // let fonts settle

      let nodes, ratio, prefix;
      if (format === "pages") {
        const book = stage.querySelector(".book");
        nodes = book
          ? Array.from(book.children).filter((el) => el.classList.contains("book-page"))
          : [];
        ratio = ((30 / 2.54) * 300) / PAGE_PX; // 30 cm @ 300 DPI
        prefix = "page";
      } else {
        nodes = [...stage.querySelectorAll(".export-spread")];
        ratio = ((58 / 2.54) * 300) / (2 * PAGE_PX); // 58 cm wide @ 300 DPI
        prefix = "spread";
      }

      const { toJpeg } = await import("html-to-image");
      for (let k = 0; k < nodes.length; k++) {
        setExportProg({ i: k + 1, n: nodes.length });
        const dataUrl = await toJpeg(nodes[k], {
          quality: 0.95,
          pixelRatio: ratio,
          cacheBust: true,
          backgroundColor: "#ffffff",
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${prefix}-${String(k + 1).padStart(2, "0")}.jpg`;
        a.click();
        await new Promise((r) => setTimeout(r, 450)); // let each download register
      }
    } catch (e) {
      console.error(e);
      alert(t.exportError);
    } finally {
      setExporting(false);
      setExportProg(null);
    }
  }

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
          <button
            className={`chip ${showStyle ? "on" : ""}`}
            onClick={() => setShowStyle((v) => !v)}
          >
            {t.textStyleBtn}
          </button>
        </div>

        {showStyle && (
          <div className="text-style-panel">
            <table className="ts-table">
              <thead>
                <tr>
                  <th></th>
                  <th>{t.fontLabel}</th>
                  <th>{t.boldLabel}</th>
                  <th>{t.sizeLabel}</th>
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role}>
                    <td className="ts-role">{t.textRoles[role]}</td>
                    <td>
                      <select
                        value={settings[role].font}
                        onChange={(e) => setRole(role, "font", e.target.value)}
                      >
                        {Object.keys(FONTS).map((f) => (
                          <option key={f} value={f}>{t.fontNames[f]}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={settings[role].bold}
                        onChange={(e) => setRole(role, "bold", e.target.checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="range"
                        min={role === "body" ? 0.9 : 1.5}
                        max={role === "body" ? 2 : 6}
                        step="0.1"
                        value={settings[role].size}
                        onChange={(e) => setRole(role, "size", Number(e.target.value))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="primary small" onClick={() => saveSettings(settings)}>
              {t.saveBtn}
            </button>
          </div>
        )}
        <div className="gallery-actions">
          <button
            className="primary"
            onClick={() => setView(view === "book" ? "grid" : "book")}
          >
            {view === "book" ? t.backToList : t.viewBookBtn}
          </button>
          <button
            className="ghost"
            onClick={() => (view === "arrange" ? setView("grid") : enterArrange())}
          >
            {view === "arrange" ? t.backToList : t.arrangeBtn}
          </button>
          <button className="ghost" onClick={() => printAs("proof")}>
            {t.printProofBtn}
          </button>
          <button className="ghost" onClick={() => printAs("qr")}>
            {t.printBtn}
          </button>
          <span className="export-group">
            <select
              className="export-select"
              value={exportFmt}
              disabled={exporting}
              onChange={(e) => setExportFmt(e.target.value)}
            >
              <option value="pages">{t.exportPages}</option>
              <option value="spread">{t.exportSpread}</option>
              <option value="spread-framed">{t.exportSpreadFramed}</option>
            </select>
            <button
              className="ghost"
              onClick={() => exportImages(exportFmt)}
              disabled={exporting}
            >
              {exporting && exportProg
                ? t.exportingN(exportProg.i, exportProg.n)
                : t.exportImagesBtn}
            </button>
          </span>
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

      {view === "arrange" && (
        <section className="screen-only arrange">
          <p className="lede">{t.arrangeHint}</p>
          <ol className="arrange-list">
            {orderedAll(items).map((it, i, arr) => (
              <li key={it.id} className={it.approved ? "" : "muted"}>
                <span className="ord-num">{i + 1}</span>
                <span className="ord-name" dir="auto">{it.name}</span>
                <span className="ord-quote" dir="auto">{splitText(it).pull}</span>
                <span className="ord-btns">
                  <button className="ghost" onClick={() => move(it, -1)} disabled={i === 0}>↑</button>
                  <button className="ghost" onClick={() => move(it, 1)} disabled={i === arr.length - 1}>↓</button>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {view === "grid" && (
        <section className="screen-only">
          <div className="grid">
            {orderedAll(items).map((it) => (
              <article key={it.id} className={`card sub ${it.approved ? "on" : ""}`}>
                {it.prompt && <p className="kicker" dir="auto">{it.prompt}</p>}
                {editingId === it.id ? (
                  <GalleryEditor
                    item={it}
                    style={bookStyle}
                    onSaved={(fields) => applyEdit(it.id, fields)}
                    onClose={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="card-spread">
                      <SpreadThumb it={it} qr={qrMap[it.id]} style={bookStyle} />
                    </div>
                    <p className="card-quote" dir="auto">“{splitText(it).pull}”</p>
                    <p className="signoff" dir="auto">— {it.name}</p>
                    <div className="sub-meta">
                      {it.clipURL ? (
                        <span className="tag">🔊 {t.kinds[it.clipKind] || it.clipKind}</span>
                      ) : (
                        <span className="tag muted">{t.noVoice}</span>
                      )}
                      {it.photoURLs?.filter(Boolean).length ? (
                        <span className="tag">🖼 {it.photoURLs.filter(Boolean).length}</span>
                      ) : null}
                    </div>
                    {qrMap[it.id] && (
                      <div className="qr-block">
                        <img src={qrMap[it.id]} alt="QR" className="qr" />
                        <a className="link" href={qrMap[it.id]} download={`qr-${it.name}.png`}>
                          {t.downloadQR}
                        </a>
                      </div>
                    )}
                    <div className="card-actions">
                      <button
                        className={it.approved ? "ghost" : "primary small"}
                        onClick={() => toggleApprove(it)}
                      >
                        {it.approved ? t.approvedBtn : t.approveBtn}
                      </button>
                      <button className="ghost" onClick={() => setEditingId(it.id)}>
                        {t.editBtn}
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Off-screen full-size book used only while exporting hi-res images.
          Filtered to approved here too, so only approved pages can be captured. */}
      {exporting && (
        <div className="export-stage" ref={exportRef} aria-hidden="true">
          {exportFmt === "pages" ? (
            <PrintBook
              items={items.filter((i) => i.approved)}
              qrMap={qrMap}
              style={bookStyle}
            />
          ) : (
            <ExportSpreads
              items={items}
              qrMap={qrMap}
              style={bookStyle}
              framed={exportFmt === "spread-framed"}
            />
          )}
        </div>
      )}

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
                  <figcaption dir="auto">{i.name}</figcaption>
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
