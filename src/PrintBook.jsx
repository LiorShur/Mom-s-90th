import { useLang } from "./i18n.jsx";

// A print-ready, designed keepsake book: a cover, one composed landscape page
// per approved contributor (name + relationship + message + photos + QR), and
// a closing page. The `style` prop ("luxury" | "modern" | "vintage") swaps the
// palette/fonts. Everything is hidden on screen and only shows when printing.

const GEN_ORDER = ["child", "grandchild", "greatgrand", "other"];

export default function PrintBook({ items, qrMap, style }) {
  const { t } = useLang();

  // Approved only, ordered by generation (children → great-grandchildren),
  // preserving submission order within each generation.
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

      {/* One page per person */}
      {pages.map((it) => (
        <section className="book-page" key={it.id}>
          <div className="bp-text">
            <p className="bp-rel" dir="auto">{relLabel(it)}</p>
            <h2 className="bp-name" dir="auto">{it.name}</h2>
            <span className="bp-quote" aria-hidden>“</span>
            <blockquote className="bp-msg" dir="auto">{it.text}</blockquote>
            <p className="bp-sign" dir="auto">{it.name} ♥</p>
          </div>

          <div className="bp-media">
            {it.photoURLs?.length > 0 && (
              <div className="bp-photos">
                {it.photoURLs.slice(0, 4).map((u, i) => (
                  <img key={i} src={u} className={i === 0 ? "main" : ""} alt="" />
                ))}
              </div>
            )}
            {qrMap[it.id] && (
              <div className="bp-qrbox">
                <img src={qrMap[it.id]} alt="QR" />
                <span>{t.bookScan}</span>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* Closing */}
      <section className="book-closing">
        <span className="bc-orn">❦</span>
        <p dir="auto">{t.bookClosing}</p>
      </section>
    </div>
  );
}
