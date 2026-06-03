import { Fragment } from "react";
import { useLang } from "./i18n.jsx";
import {
  orderedApproved,
  CoverPage,
  ClosingPage,
  LeftPage,
  RightPage,
} from "./book.jsx";

// Full-size 30×30 cm print book: cover, a two-page spread per approved person,
// then a closing page. Rendered inside a .print-only wrapper by the gallery.
export default function PrintBook({ items, qrMap, style }) {
  const { t } = useLang();
  const pages = orderedApproved(items);

  return (
    <div className={`book style-${style}`}>
      <CoverPage t={t} />
      {pages.map((it, idx) => (
        <Fragment key={it.id}>
          <LeftPage it={it} t={t} num={idx * 2 + 1} />
          <RightPage it={it} qr={qrMap[it.id]} t={t} num={idx * 2 + 2} />
        </Fragment>
      ))}
      <ClosingPage t={t} />
    </div>
  );
}
