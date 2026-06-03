import { Fragment } from "react";
import { useLang } from "./i18n.jsx";

// A print-ready 30×30 cm keepsake book that mirrors the sample spreads:
// each contributor gets a TWO-PAGE spread —
//   LEFT page : script name, relationship, a big quote mark, a short pull-quote,
//               a heart divider, the longer message, a script signature, and a
//               full-bleed portrait on the inner side.
//   RIGHT page: a photo collage with a framed "scan to …" QR box in the corner.
// Plus a cover and a closing page. `style` swaps the palette/fonts.

const GEN_ORDER = ["child", "grandchild", "greatgrand", "other"];

// Split the note into a short "pull-quote" + the longer body. If the
// contributor supplied an explicit one-liner we use it; otherwise we take the
// first sentence as the quote and the remainder as the body.
function splitText(it) {
  const text = (it.text || "").trim();
  const pq = (it.pullQuote || "").trim();
  if (pq) return { pull: pq, body: text };
  const m = text.match(/^(.*?[.!?])\s+([\s\S]+)$/);
  if (m) return { pull: m[1], body: m[2] };
  return { pull: text, body: "" };
}

export default function PrintBook({ items, qrMap, style }) {
  const { t } = useLang();

  const pages = items
    .filter((i) => i.approved)
    .map((i, idx) => ({ ...i, _idx: idx }))
    .sort((a, b) => {
      const ga = GEN_ORDER.indexOf(a.generation);
      const gb = GEN_ORDER.indexOf(b.generation);
      return ga !== gb ? ga - gb : a._idx - b._idx;
    });

  const relLabel = (it) =>
    it.relationship?.trim() ||
    t.generations.find((g) => g.value === it.generation)?.label ||
    "";

  return (
    <div className={`book style-${style}`}>
      {/* Cover */}
      <section className="book-cover">
        <div className="bc-inner">
          <span className="bc-orn">❧</span>
          <h1 dir="auto">{t.bookCoverTitle}</h1>
          <p className="bc-sub" dir="auto">{t.bookCoverSubtitle}</p>
        </div>
      </section>

      {/* One two-page spread per person */}
      {pages.map((it, idx) => {
        const { pull, body } = splitText(it);
        const photos = it.photoURLs || [];
        const portrait = photos[0];
        const collage = photos.slice(1, 4);
        const scanLabel =
          it.clipKind === "video" ? t.bookScanVideo : t.bookScanAudio;
        const leftNum = idx * 2 + 1;
        const rightNum = idx * 2 + 2;

        return (
          <Fragment key={it.id}>
            {/* LEFT PAGE */}
            <section className="book-page page-left">
              <div className="pl-text">
                <h2 className="pl-name" dir="auto">{it.name}</h2>
                <p className="pl-rel" dir="auto">{relLabel(it)}</p>
                <span className="pl-qmark" aria-hidden>“</span>
                {pull && <p className="pl-quote" dir="auto">{pull}</p>}
                <span className="pl-divider" aria-hidden>♡</span>
                {body && <p className="pl-body" dir="auto">{body}</p>}
                <p className="pl-sign" dir="auto">{it.name} ♥</p>
              </div>
              <div className="pl-portrait">
                {portrait && <img src={portrait} alt="" />}
              </div>
              <span className="page-num">— {leftNum} —</span>
            </section>

            {/* RIGHT PAGE */}
            <section className="book-page page-right">
              <div className={`pr-photos count-${collage.length}`}>
                {collage.map((u, i) => (
                  <img key={i} src={u} alt="" />
                ))}
              </div>
              <div className={`pr-qr ${collage.length === 0 ? "feature" : ""}`}>
                {qrMap[it.id] && <img src={qrMap[it.id]} alt="QR" />}
                <span className="pr-scan">{scanLabel}</span>
              </div>
              <p className="pr-caption" dir="auto">{t.bookHeartCaption}</p>
              <span className="page-num">— {rightNum} —</span>
            </section>
          </Fragment>
        );
      })}

      {/* Closing */}
      <section className="book-closing">
        <span className="bc-orn">❦</span>
        <p dir="auto">{t.bookClosing}</p>
      </section>
    </div>
  );
}
