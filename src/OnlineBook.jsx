import { Fragment } from "react";
import { useLang } from "./i18n.jsx";
import {
  orderedApproved,
  CoverPage,
  ClosingPage,
  LeftPage,
  RightPage,
  FitBox,
  PAGE_PX,
} from "./book.jsx";

// One scaled, scrollable book page.
function OnlinePage({ style, children }) {
  return (
    <div className="online-page">
      <FitBox w={PAGE_PX} h={PAGE_PX} maxWidth={760}>
        <div className={`book style-${style}`}>{children}</div>
      </FitBox>
    </div>
  );
}

// The whole book, viewable on screen: cover, each person's two pages stacked,
// with a usable voice player under each spread, then the closing page.
export default function OnlineBook({ items, qrMap, style }) {
  const { t } = useLang();
  const pages = orderedApproved(items);

  return (
    <div className="online-book screen-only">
      <OnlinePage style={style}>
        <CoverPage t={t} />
      </OnlinePage>

      {pages.map((it, idx) => (
        <Fragment key={it.id}>
          <OnlinePage style={style}>
            <LeftPage it={it} t={t} num={idx * 2 + 1} />
          </OnlinePage>
          <OnlinePage style={style}>
            <RightPage it={it} qr={qrMap[it.id]} t={t} num={idx * 2 + 2} />
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
      ))}

      <OnlinePage style={style}>
        <ClosingPage t={t} />
      </OnlinePage>
    </div>
  );
}
