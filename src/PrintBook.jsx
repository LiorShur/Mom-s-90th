import { Fragment } from "react";
import { useLang } from "./i18n.jsx";
import { useBookVars, useBookContent } from "./bookStyle.jsx";
import {
  orderedApproved,
  CoverPage,
  ClosingPage,
  LeftPage,
  RightPage,
} from "./book.jsx";
import { FamilyTreePage } from "./FamilyTree.jsx";

// Full-size 30×30 cm print book: cover, family tree, a two-page spread per
// approved person, then a closing page. (The life album is layflat 58×29
// spreads — see ExportSpreads / the online book.)
export default function PrintBook({ items, qrMap, style }) {
  const { t } = useLang();
  const vars = useBookVars();
  const { cover, closing } = useBookContent();
  const pages = orderedApproved(items);

  return (
    <div className={`book style-${style}`} style={vars}>
      <CoverPage t={t} cover={cover} />
      <FamilyTreePage names={pages.map((p) => p.name).filter(Boolean)} t={t} />
      {pages.map((it, idx) => (
        <Fragment key={it.id}>
          <LeftPage it={it} t={t} num={idx * 2 + 1} />
          <RightPage it={it} qr={qrMap[it.id]} t={t} num={idx * 2 + 2} />
        </Fragment>
      ))}
      <ClosingPage t={t} closing={closing} />
    </div>
  );
}
