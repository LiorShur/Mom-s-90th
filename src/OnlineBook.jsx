import { Fragment } from "react";
import { useLang } from "./i18n.jsx";
import { useBookVars, useBookContent } from "./bookStyle.jsx";
import {
  orderedApproved,
  orderedBook,
  CoverPage,
  ClosingPage,
  LeftPage,
  RightPage,
  FitBox,
  PAGE_PX,
  SPREAD_PX,
} from "./book.jsx";
import { FamilyTreePage } from "./FamilyTree.jsx";
import { LifeSpread } from "./LifeAlbum.jsx";
import { useLife } from "./life.jsx";
import { useTree } from "./tree.jsx";

// One scaled, scrollable book page (square).
function OnlinePage({ style, children }) {
  const vars = useBookVars();
  return (
    <div className="online-page">
      <FitBox w={PAGE_PX} h={PAGE_PX} maxWidth={760}>
        <div className={`book style-${style}`} style={vars}>{children}</div>
      </FitBox>
    </div>
  );
}

// A wide (2:1) page for the life spreads.
function WideOnlinePage({ style, children }) {
  const vars = useBookVars();
  return (
    <div className="online-page wide">
      <FitBox w={SPREAD_PX} h={PAGE_PX} maxWidth={900}>
        <div className={`book style-${style}`} style={vars}>{children}</div>
      </FitBox>
    </div>
  );
}

// The whole book, viewable on screen: cover, each person's two pages stacked,
// with a usable voice player under each spread, then the closing page.
export default function OnlineBook({ items, qrMap, style }) {
  const { t } = useLang();
  const { spreads } = useLife();
  const { tree } = useTree();
  const { cover, closing } = useBookContent();
  const treeNames = orderedApproved(items).map((p) => p.name).filter(Boolean);
  // Contributor pages and life spreads in one arranged sequence.
  const seq = orderedBook(items, spreads, { approvedOnly: true });
  let pageNo = 0; // running page number for the contributor spreads

  return (
    <div className="online-book screen-only">
      <OnlinePage style={style}>
        <CoverPage t={t} cover={cover} />
      </OnlinePage>
      <OnlinePage style={style}>
        <FamilyTreePage names={treeNames} tree={tree} t={t} />
      </OnlinePage>

      {seq.map((e) => {
        if (e.kind === "life") {
          return (
            <WideOnlinePage style={style} key={e.id}>
              <LifeSpread items={e.life.items} />
            </WideOnlinePage>
          );
        }
        const it = e.msg;
        const base = pageNo;
        pageNo += 2;
        return (
          <Fragment key={e.id}>
            <OnlinePage style={style}>
              <LeftPage it={it} t={t} num={base + 1} />
            </OnlinePage>
            <OnlinePage style={style}>
              <RightPage it={it} qr={qrMap[it.id]} t={t} num={base + 2} />
            </OnlinePage>
            {it.clipURL && (
              <div className="online-player">
                <span className="op-name" dir="auto">
                  {it.clipKind === "video" ? "🎬" : "🔊"} {it.name}
                </span>
                {it.clipKind === "video" ? (
                  <video src={it.clipURL} controls playsInline />
                ) : (
                  <audio src={it.clipURL} controls />
                )}
              </div>
            )}
          </Fragment>
        );
      })}

      <OnlinePage style={style}>
        <ClosingPage t={t} closing={closing} />
      </OnlinePage>
    </div>
  );
}
