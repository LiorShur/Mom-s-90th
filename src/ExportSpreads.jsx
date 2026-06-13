import { useLang } from "./i18n.jsx";
import { useBookVars } from "./bookStyle.jsx";
import { orderedApproved, LeftPage, RightPage } from "./book.jsx";
import { useLife } from "./life.jsx";
import { LifeSpread } from "./LifeAlbum.jsx";

// Off-screen rendering for the layflat ("Dutch bind") export: the life-album
// spreads, then each approved person's left + right page joined as one 60×30 cm
// spread (rasterized to 58×29 cm). `framed` draws a border around each page.
export default function ExportSpreads({ items, qrMap, style, framed }) {
  const { t } = useLang();
  const vars = useBookVars();
  const { spreads } = useLife();
  const pages = orderedApproved(items);
  return (
    <div className={`book style-${style}`} style={vars}>
      {spreads.map((sp, i) => (
        <div className="export-spread life-export" key={`life-${i}`}>
          <LifeSpread items={sp.items} />
        </div>
      ))}
      {pages.map((it, idx) => (
        <div className={`export-spread ${framed ? "framed" : ""}`} key={it.id}>
          <LeftPage it={it} t={t} num={idx * 2 + 1} />
          <RightPage it={it} qr={qrMap[it.id]} t={t} num={idx * 2 + 2} />
        </div>
      ))}
    </div>
  );
}
