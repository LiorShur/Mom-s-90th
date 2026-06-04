import { useEffect, useRef, useState } from "react";
import { useLang } from "./i18n.jsx";

// Shared building blocks for the keepsake book, used three ways:
//  - PrintBook (full-size 30×30 cm pages for PDF/print)
//  - the gallery spread thumbnails (scaled to fit a card)
//  - the online scrollable book (scaled to fit the screen)

export const GEN_ORDER = ["child", "grandchild", "greatgrand", "other"];

// One CSS cm = 96/2.54 px; a page is 30 cm square.
export const PAGE_PX = (30 * 96) / 2.54; // ≈ 1133.86
export const SPREAD_PX = PAGE_PX * 2;

export function orderedApproved(items) {
  return items
    .filter((i) => i.approved)
    .map((i, idx) => ({ ...i, _idx: idx }))
    .sort((a, b) => {
      const ga = GEN_ORDER.indexOf(a.generation);
      const gb = GEN_ORDER.indexOf(b.generation);
      return ga !== gb ? ga - gb : a._idx - b._idx;
    });
}

// Split the note into a short "pull-quote" + the longer body.
export function splitText(it) {
  const text = (it.text || "").trim();
  const pq = (it.pullQuote || "").trim();
  if (pq) return { pull: pq, body: text };
  const m = text.match(/^(.*?[.!?])\s+([\s\S]+)$/);
  if (m) return { pull: m[1], body: m[2] };
  return { pull: text, body: "" };
}

// Per-photo design transform (rotate / zoom / pan) set by the organizer.
export function fxStyle(f) {
  if (!f) return undefined;
  const { rot = 0, zoom = 1, ox = 50, oy = 50 } = f;
  return {
    transform: `scale(${zoom}) rotate(${rot}deg)`,
    transformOrigin: "center center",
    objectPosition: `${ox}% ${oy}%`,
  };
}

export function relLabel(t, it) {
  return (
    it.relationship?.trim() ||
    t.generations.find((g) => g.value === it.generation)?.label ||
    ""
  );
}

export function CoverPage({ t }) {
  return (
    <section className="book-cover">
      <span className="bc-orn">❧</span>
      <h1 dir="auto">{t.bookCoverTitle}</h1>
      <p className="bc-sub" dir="auto">{t.bookCoverSubtitle}</p>
    </section>
  );
}

export function ClosingPage({ t }) {
  return (
    <section className="book-closing">
      <span className="bc-orn">❦</span>
      <p dir="auto">{t.bookClosing}</p>
    </section>
  );
}

// LEFT page: message column + a single full-bleed portrait (photo #1).
export function LeftPage({ it, t, num }) {
  const { pull, body } = splitText(it);
  const portrait = (it.photoURLs || [])[0] || null;
  const portraitFx = (it.photoFx || [])[0];
  return (
    <section className="book-page page-left">
      <div className="pl-text">
        <h2 className="pl-name" dir="auto">{it.name}</h2>
        <p className="pl-rel" dir="auto">{relLabel(t, it)}</p>
        <span className="pl-qmark" aria-hidden>“</span>
        {pull && <p className="pl-quote" dir="auto">{pull}</p>}
        <span className="pl-divider" aria-hidden>♡</span>
        {body && <p className="pl-body" dir="auto">{body}</p>}
        <p className="pl-sign" dir="auto">{it.name} ♥</p>
      </div>
      <div className="pl-portrait">
        {portrait && (
          <img
            src={portrait}
            alt=""
            className={portraitFx?.tilt ? "tilted" : undefined}
            style={fxStyle(portraitFx)}
          />
        )}
      </div>
      <Sprig />
      {num != null && <span className="page-num">— {num} —</span>}
    </section>
  );
}

// A small botanical flourish (inherits the theme's gold via currentColor) —
// a tasteful CSS-friendly nod to the reference florals.
function Sprig() {
  return (
    <svg className="pl-sprig" viewBox="0 0 80 110" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M41 106 C41 80 37 50 46 16" />
      <path d="M45 30 C31 25 22 31 18 44 C33 47 41 41 45 30Z" fill="currentColor" stroke="none" opacity="0.65" />
      <path d="M44 48 C58 43 67 49 71 62 C56 65 47 59 44 48Z" fill="currentColor" stroke="none" opacity="0.65" />
      <path d="M42 66 C29 63 21 69 18 81 C32 84 39 77 42 66Z" fill="currentColor" stroke="none" opacity="0.65" />
      <circle cx="46" cy="13" r="3.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

// RIGHT page: collage of up to 3 photos (#2–#4) + framed QR box.
export function RightPage({ it, qr, t, num }) {
  const collage = [1, 2, 3]
    .map((i) => ({ url: (it.photoURLs || [])[i], fx: (it.photoFx || [])[i] }))
    .filter((e) => e.url);
  const scanLabel = it.clipKind === "video" ? t.bookScanVideo : t.bookScanAudio;
  return (
    <section className="book-page page-right">
      <div className={`pr-photos count-${collage.length}`}>
        {collage.map((e, i) => (
          <img
            key={i}
            src={e.url}
            alt=""
            className={e.fx?.tilt ? "tilted" : undefined}
            style={fxStyle(e.fx)}
          />
        ))}
      </div>
      <div className={`pr-qr ${collage.length === 0 ? "feature" : ""}`}>
        {qr && <img src={qr} alt="QR" />}
        <span className="pr-scan">{scanLabel}</span>
      </div>
      <p className="pr-caption" dir="auto">{t.bookHeartCaption}</p>
      {num != null && <span className="page-num">— {num} —</span>}
    </section>
  );
}

// Scales fixed-size book content down to fit the available width.
export function FitBox({ w, h, maxWidth, children }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / w);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div className="fitbox" ref={ref} style={{ aspectRatio: `${w} / ${h}`, maxWidth }}>
      <div
        className="fitbox-inner"
        style={{ width: w, height: h, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

// A scaled, on-screen two-page spread (used for gallery thumbnails).
export function SpreadThumb({ it, qr, style }) {
  const { t } = useLang();
  return (
    <FitBox w={SPREAD_PX} h={PAGE_PX}>
      <div className={`book style-${style}`} style={{ display: "flex" }}>
        <LeftPage it={it} t={t} />
        <RightPage it={it} qr={qr} t={t} />
      </div>
    </FitBox>
  );
}
