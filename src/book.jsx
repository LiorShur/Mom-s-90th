import { useEffect, useRef, useState } from "react";
import { useLang } from "./i18n.jsx";
import { useBookVars } from "./bookStyle.jsx";

// Shared building blocks for the keepsake book, used three ways:
//  - PrintBook (full-size 30×30 cm pages for PDF/print)
//  - the gallery spread thumbnails (scaled to fit a card)
//  - the online scrollable book (scaled to fit the screen)

export const GEN_ORDER = ["child", "grandchild", "greatgrand", "other"];

// One CSS cm = 96/2.54 px; a page is 30 cm square.
export const PAGE_PX = (30 * 96) / 2.54; // ≈ 1133.86
export const SPREAD_PX = PAGE_PX * 2;

// Sort key: an explicit `order` (set by the organizer) wins; otherwise fall
// back to generation order, then submission order — so the book reads sensibly
// before anyone has manually arranged it.
export function orderKey(it, idx = 0) {
  return typeof it.order === "number" ? it.order : idx;
}

export function orderedApproved(items) {
  return items
    .filter((i) => i.approved)
    .map((i, idx) => ({ ...i, _idx: idx }))
    .sort((a, b) => orderKey(a, a._idx) - orderKey(b, b._idx));
}

// All items (approved or not) in book order — used by the arrange screen.
export function orderedAll(items) {
  return items
    .map((i, idx) => ({ ...i, _idx: idx }))
    .sort((a, b) => orderKey(a, a._idx) - orderKey(b, b._idx));
}

// One unified book sequence that merges contributor pages and life-in-photos
// spreads by a shared `order`, so spreads can be positioned anywhere among the
// pages (and reordered on the arrange screen). Each entry is:
//   { kind: "msg"|"life", id, order, msg?, life?, lifeIndex? }
// An un-arranged spread sorts to the end until the organizer places it.
export function orderedBook(items = [], spreads = [], { approvedOnly = false } = {}) {
  const entries = [];
  items.forEach((it, idx) => {
    if (approvedOnly && !it.approved) return;
    entries.push({
      kind: "msg",
      id: it.id,
      order: typeof it.order === "number" ? it.order : idx,
      msg: it,
    });
  });
  spreads.forEach((sp, idx) => {
    if (approvedOnly && !sp.approved) return;
    entries.push({
      kind: "life",
      id: sp.id || `life-${idx}`,
      // Un-arranged spreads sort to the END (so adding one never disrupts an
      // already-arranged book); once arranged they carry an explicit order.
      order: typeof sp.order === "number" ? sp.order : 1e6 + idx,
      life: sp,
      lifeIndex: idx,
    });
  });
  return entries
    .map((e, i) => ({ ...e, _i: i }))
    .sort((a, b) => a.order - b.order || a._i - b._i)
    .map(({ _i, ...e }) => e);
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

// --- Floating collage photos (right page) -----------------------------------
// Each collage photo is a free element on the page (position/size/rotation/
// shadow in % so it scales to any render size). Defaults arrange them in the
// quarters; the organizer can drag/resize/rotate them to overlap.
export const COLLAGE_DEFAULTS = [
  { x: 5, y: 5, w: 42 },
  { x: 53, y: 5, w: 42 },
  { x: 5, y: 53, w: 42 },
];

export function floatFx(fx, idx) {
  const base = COLLAGE_DEFAULTS[idx] || COLLAGE_DEFAULTS[0];
  // Photo #3 defaults to the bottom corner OPPOSITE the QR (the QR sits on the
  // inline-end side: bottom-left in RTL, bottom-right in LTR).
  const rtl =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("dir") === "rtl";
  const d = idx === 2 ? { ...base, x: rtl ? 53 : 5 } : base;
  const f = fx || {};
  return {
    x: f.x ?? d.x, y: f.y ?? d.y, w: f.w ?? d.w,
    rot: f.rot ?? 0, zoom: f.zoom ?? 1, ox: f.ox ?? 50, oy: f.oy ?? 50,
    shadow: f.shadow ?? 0, tilt: f.tilt ?? false, fit: f.fit ?? false, z: f.z ?? 0,
  };
}

export function shadowCss(s) {
  const v = Number(s) || 0;
  if (!v) return "none";
  const off = (v * 0.012).toFixed(2);
  const blur = (v * 0.045).toFixed(2);
  const op = Math.min(0.55, 0.12 + v * 0.007).toFixed(2);
  return `${off}cm ${off}cm ${blur}cm rgba(40,30,20,${op})`;
}

// Style for the floating frame (position/size/rotation/shadow).
export function frameStyle(f) {
  return {
    left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`,
    transform: `rotate(${f.rot}deg)`,
    boxShadow: shadowCss(f.shadow),
    zIndex: f.z,
  };
}

// Style for the image inside the frame (crop: zoom + pan).
export function cropStyle(f) {
  return {
    transform: `scale(${f.zoom})`,
    transformOrigin: `${f.ox}% ${f.oy}%`,
    objectPosition: `${f.ox}% ${f.oy}%`,
  };
}


// Per-photo design transform (rotate / zoom / pan) set by the organizer.
export function fxStyle(f) {
  if (!f) return undefined;
  const { rot = 0, zoom = 1, ox = 50, oy = 50 } = f;
  return {
    transform: `scale(${zoom}) rotate(${rot}deg)`,
    transformOrigin: `${ox}% ${oy}%`,
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

export function CoverPage({ t, cover }) {
  const c = cover || {};
  // "Photo only": a self-contained cover image stands alone, no overlaid text.
  if (c.bg && c.photoOnly) {
    return (
      <section className="book-cover cover-photo-only">
        <div className="page-bg" style={{ opacity: c.bgOpacity ?? 1 }}>
          <img src={c.bg} alt="" />
        </div>
      </section>
    );
  }
  return (
    <section className="book-cover">
      {c.bg && (
        <div className="page-bg" style={{ opacity: c.bgOpacity ?? 1 }}>
          <img src={c.bg} alt="" />
        </div>
      )}
      <span className="bc-orn">❧</span>
      <h1 dir="auto">{c.title?.trim() || t.bookCoverTitle}</h1>
      <p className="bc-sub" dir="auto">{c.subtitle?.trim() || t.bookCoverSubtitle}</p>
    </section>
  );
}

export function ClosingPage({ t, closing }) {
  const c = closing || {};
  return (
    <section className="book-closing">
      {c.bg && (
        <div className="page-bg" style={{ opacity: c.bgOpacity ?? 1 }}>
          <img src={c.bg} alt="" />
        </div>
      )}
      <span className="bc-orn">❦</span>
      <p dir="auto">{c.text?.trim() || t.bookClosing}</p>
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
      {it.bgSpread ? (
        <>
          <div className="spread-bg" style={{ opacity: it.bgSpreadOpacity ?? 1 }}>
            <img src={it.bgSpread} alt="" />
          </div>
          {it.bgLeftPanel && <div className="text-panel" />}
        </>
      ) : it.bgLeft && (
        <>
          <div className="page-bg" style={{ opacity: it.bgLeftOpacity ?? 1 }}>
            <img src={it.bgLeft} alt="" />
          </div>
          {it.bgLeftPanel && <div className="text-panel" />}
        </>
      )}
      <div className="pl-text">
        <span className="pl-qmark" aria-hidden>“</span>
        {pull && <p className="pl-quote" dir="auto">{pull}</p>}
        <span className="pl-divider" aria-hidden>♡</span>
        {body && <p className="pl-body" dir="auto">{body}</p>}
        <p className="pl-sign" dir="auto">{it.name} ♥</p>
      </div>
      <div className={`pl-portrait ${(portraitFx?.zoom ?? 1) < 1 ? "shrunk" : ""} ${portraitFx?.fit ? "fit" : ""} ${(it.bgSpread || it.bgLeft) && !it.bgLeftPanel ? "no-feather" : ""}`}>
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

// RIGHT page: free-floating collage photos (each a frame that can be moved,
// resized, rotated and overlapped) + the QR box in the corner. With no collage
// photos at all, the QR is shown large and centered.
export function RightPage({ it, qr, t, num }) {
  const collage = [1, 2, 3].map((i) => ({
    url: (it.photoURLs || [])[i],
    fx: floatFx((it.photoFx || [])[i], i - 1),
  }));
  const hasPhotos = collage.some((c) => c.url);
  const scanLabel = it.clipKind === "video" ? t.bookScanVideo : t.bookScanAudio;

  return (
    <section className="book-page page-right">
      {it.bgSpread ? (
        <div className="spread-bg" style={{ opacity: it.bgSpreadOpacity ?? 1 }}>
          <img src={it.bgSpread} alt="" />
        </div>
      ) : it.bgRight && (
        <div className="page-bg" style={{ opacity: it.bgRightOpacity ?? 1 }}>
          <img src={it.bgRight} alt="" />
        </div>
      )}
      {collage.map((c, i) =>
        c.url ? (
          <div
            key={i}
            className={`pr-float ${c.fx.tilt ? "tilted" : ""} ${c.fx.fit ? "fit" : ""}`}
            style={frameStyle(c.fx)}
          >
            <img src={c.url} alt="" style={c.fx.fit ? undefined : cropStyle(c.fx)} />
          </div>
        ) : null
      )}
      {hasPhotos ? (
        <div className="pr-qr">
          {qr && <img src={qr} alt="QR" />}
          <span className="pr-scan">{scanLabel}</span>
        </div>
      ) : (
        <div className="pr-qr feature">
          {qr && <img src={qr} alt="QR" />}
          <span className="pr-scan">{scanLabel}</span>
        </div>
      )}
      <p className="pr-caption" dir="auto">{t.bookHeartCaption}</p>
      {num != null && <span className="page-num">— {num} —</span>}
    </section>
  );
}

// Scales variable-size content (e.g. the family tree) down so it fits inside
// its box, centred. Never scales up past 1.
export function ScaleToFit({ className = "", children }) {
  const boxRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner) return;
    const fit = () => {
      const bw = box.clientWidth;
      const bh = box.clientHeight;
      const iw = inner.scrollWidth;
      const ih = inner.scrollHeight;
      if (!iw || !ih) return;
      setScale(Math.min(1, bw / iw, bh / ih));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={boxRef} className={`scale-to-fit ${className}`}>
      <div ref={innerRef} className="scale-to-fit-inner" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
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
  const vars = useBookVars();
  return (
    <FitBox w={SPREAD_PX} h={PAGE_PX}>
      <div className={`book style-${style}`} style={{ display: "flex", ...vars }}>
        <LeftPage it={it} t={t} />
        <RightPage it={it} qr={qr} t={t} />
      </div>
    </FitBox>
  );
}
