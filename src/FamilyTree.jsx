// A family-tree opening page: a stylised tree whose canopy is filled with all
// the family members' names, with the honoree at the root. Auto-populated from
// the approved submissions; styled with the book's palette/fonts.
export function FamilyTreePage({ names, t }) {
  return (
    <section className="book-page family-tree">
      <svg className="ft-bg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {/* trunk */}
        <path d="M47.5 100 C49 82 46.5 70 49 60 L51 60 C53.5 70 51 82 52.5 100 Z" fill="#9c7b53" />
        {/* branches */}
        <g stroke="#9c7b53" strokeWidth="1.3" fill="none" strokeLinecap="round">
          <path d="M50 61 C40 56 30 55 21 47" />
          <path d="M50 61 C60 56 70 55 79 47" />
          <path d="M50 59 C46 51 44 45 44 36" />
          <path d="M50 59 C54 51 56 45 56 36" />
          <path d="M50 60 C39 55 30 52 22 57" />
          <path d="M50 60 C61 55 70 52 78 57" />
        </g>
        {/* canopy foliage */}
        <g fill="#a9bf95">
          <ellipse cx="50" cy="30" rx="41" ry="27" opacity="0.40" />
          <ellipse cx="26" cy="40" rx="21" ry="17" opacity="0.45" />
          <ellipse cx="74" cy="40" rx="21" ry="17" opacity="0.45" />
          <ellipse cx="50" cy="17" rx="27" ry="15" opacity="0.45" />
          <ellipse cx="37" cy="25" rx="19" ry="15" opacity="0.38" />
          <ellipse cx="63" cy="25" rx="19" ry="15" opacity="0.38" />
        </g>
      </svg>

      <div className="ft-content">
        <div className="ft-head">
          <p className="ft-kicker">{t.forGrandma}</p>
          <h2 className="ft-title" dir="auto">{t.treeTitle}</h2>
        </div>
        <div className="ft-names">
          {names.map((n, i) => (
            <span className="ft-leaf" key={i} dir="auto">{n}</span>
          ))}
        </div>
        <div className="ft-honoree" dir="auto">{t.treeHonoree}</div>
      </div>
    </section>
  );
}
