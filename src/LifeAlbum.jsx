// One page of the "Her life in photos" album: a tidy grid of photos, each with
// an optional year + caption. The title appears on the first page only.
export function LifePage({ group, first, t }) {
  return (
    <section className="book-page life-page">
      {first && (
        <div className="life-head">
          <p className="ft-kicker">{t.forGrandma}</p>
          <h2 className="life-title" dir="auto">{t.lifeTitle}</h2>
        </div>
      )}
      <div className={`life-grid ${first ? "with-head" : ""}`}>
        {group.map((p, i) => (
          <figure className="life-card" key={i}>
            <div className="life-photo">
              <img src={p.url} alt="" />
            </div>
            {(p.year || p.caption) && (
              <figcaption dir="auto">
                {p.year && <span className="life-year">{p.year}</span>}
                {p.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
