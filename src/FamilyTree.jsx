import { ScaleToFit } from "./book.jsx";
import { useBookVars } from "./bookStyle.jsx";

// One person (and their married-in partner), with their children nested below.
function TreeNode({ person, people, onJump }) {
  const kids = people.filter((p) => p.parentId === person.id);
  const clickable = onJump && person.messageId;
  return (
    <li>
      <div
        className={`ft-node ${clickable ? "ft-clickable" : ""}`}
        onClick={clickable ? () => onJump(person.messageId) : undefined}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={
          clickable
            ? (e) => (e.key === "Enter" || e.key === " ") && onJump(person.messageId)
            : undefined
        }
        title={clickable ? person.name : undefined}
      >
        <span className="ft-person" dir="auto">{person.name}</span>
        {person.spouseName?.trim() && (
          <span className="ft-spouse" dir="auto">&amp; {person.spouseName}</span>
        )}
      </div>
      {kids.length > 0 && (
        <ul>
          {kids.map((k) => (
            <TreeNode key={k.id} person={k} people={people} onJump={onJump} />
          ))}
        </ul>
      )}
    </li>
  );
}

// The actual node-link graph: honoree at the root, then each top-level person
// (a child of the honoree) and their descendants.
function TreeGraph({ people, honoreeName, honoreeSpouse, onJump }) {
  const roots = people.filter((p) => !p.parentId);
  return (
    <ul className="ft-tree">
      <li>
        <div className="ft-node ft-root">
          <span className="ft-person" dir="auto">{honoreeName}</span>
          {honoreeSpouse && <span className="ft-spouse" dir="auto">&amp; {honoreeSpouse}</span>}
        </div>
        {roots.length > 0 && (
          <ul>
            {roots.map((r) => (
              <TreeNode key={r.id} person={r} people={people} onJump={onJump} />
            ))}
          </ul>
        )}
      </li>
    </ul>
  );
}

const honoreeNames = (tree, t) => ({
  honoreeName: (tree?.honoreeName || "").trim() || t.treeHonoree,
  honoreeSpouse: (tree?.honoreeSpouse || "").trim(),
});

// DIGITAL book: the family tree as a wide 58×29-style spread, with the
// organizer's backdrop image behind it and the whole tree scaled to fit.
export function OnlineFamilyTree({ tree, t, style, onJump }) {
  const vars = useBookVars();
  const people = tree?.people || [];
  const { honoreeName, honoreeSpouse } = honoreeNames(tree, t);
  return (
    <section className={`tree-spread book style-${style}`} style={vars}>
      {tree?.backdrop && (
        <div className="ts-bg" aria-hidden="true">
          <img src={tree.backdrop} alt="" />
        </div>
      )}
      <div className="ts-head">
        <p className="ft-kicker">{t.forGrandma}</p>
        <h2 className="ft-title" dir="auto">{t.treeTitle}</h2>
        {onJump && <p className="ot-hint">{t.treeTapHint}</p>}
      </div>
      <ScaleToFit className="ts-tree">
        <TreeGraph
          people={people}
          honoreeName={honoreeName}
          honoreeSpouse={honoreeSpouse}
          onJump={onJump}
        />
      </ScaleToFit>
    </section>
  );
}

// PRINT/page version: a fixed family-tree book page. When the organizer has
// built a tree it renders the structured graph (scaled to fit the page);
// otherwise it falls back to the stylised canopy of names from the submissions.
export function FamilyTreePage({ names, tree, t }) {
  const people = tree?.people || [];
  const hasTree = people.length > 0;
  const { honoreeName, honoreeSpouse } = honoreeNames(tree, t);

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

        {hasTree ? (
          <ScaleToFit className="ft-tree-wrap">
            <TreeGraph people={people} honoreeName={honoreeName} honoreeSpouse={honoreeSpouse} />
          </ScaleToFit>
        ) : (
          <>
            <div className="ft-names">
              {names.map((n, i) => (
                <span className="ft-leaf" key={i} dir="auto">{n}</span>
              ))}
            </div>
            <div className="ft-honoree" dir="auto">{honoreeName}</div>
          </>
        )}
      </div>
    </section>
  );
}
