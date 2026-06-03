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
  const portrait = (it.photoURLs || [])[0];
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
        {portrait && <img src={portrait} alt="" />}
      </div>
      {num != null && <span className="page-num">— {num} —</span>}
    </section>
  );
}

// RIGHT page: collage of up to 3 photos (#2–#4) + framed QR box.
export function RightPage({ it, qr, t, num }) {
  const collage = (it.photoURLs || []).slice(1, 4);
  const scanLabel = it.clipKind === "video" ? t.bookScanVideo : t.bookScanAudio;
  return (
    <section className="book-page page-right">
      <div className={`pr-photos count-${collage.length}`}>
        {collage.map((u, i) => (
          <img key={i} src={u} alt="" />
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
