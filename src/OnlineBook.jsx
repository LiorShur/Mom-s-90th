import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "./i18n.jsx";
import { useBookVars, useBookContent } from "./bookStyle.jsx";
import {
  orderedApproved,
  orderedBook,
  PreCoverPage,
  CoverPage,
  ClosingPage,
  LeftPage,
  RightPage,
  FitBox,
  PAGE_PX,
  SPREAD_PX,
} from "./book.jsx";
import { FamilyTreePage, OnlineFamilyTree } from "./FamilyTree.jsx";
import { LifeSpread } from "./LifeAlbum.jsx";
import { useLife } from "./life.jsx";
import { useTree } from "./tree.jsx";
import Lightbox from "./Lightbox.jsx";

// Photos that should open in the lightbox (excludes QR codes + backgrounds).
const ZOOMABLE = ".pl-portrait img, .pr-float img, .life-float:not(.bg) img";

// Fades + lifts a section into view the first time it's scrolled to.
function Reveal({ children, className = "", id }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} id={id} className={`reveal ${className} ${shown ? "in" : ""}`}>
      {children}
    </div>
  );
}

// One scaled, scrollable book page (square).
function OnlinePage({ style, children, id }) {
  const vars = useBookVars();
  return (
    <Reveal className="online-page" id={id}>
      <FitBox w={PAGE_PX} h={PAGE_PX} maxWidth={760}>
        <div className={`book style-${style}`} style={vars}>{children}</div>
      </FitBox>
    </Reveal>
  );
}

// A wide (2:1) page for the life spreads.
function WideOnlinePage({ style, children }) {
  const vars = useBookVars();
  return (
    <Reveal className="online-page wide">
      <FitBox w={SPREAD_PX} h={PAGE_PX} maxWidth={900}>
        <div className={`book style-${style}`} style={vars}>{children}</div>
      </FitBox>
    </Reveal>
  );
}

// The whole book, viewable on screen: cover, each person's two pages stacked,
// with a usable voice player under each spread, then the closing page.
export default function OnlineBook({ items, qrMap, style }) {
  const { t } = useLang();
  const { spreads } = useLife();
  const { tree } = useTree();
  const { precover, cover, closing } = useBookContent();
  const rootRef = useRef(null);
  const textAudioRef = useRef(null);
  const [box, setBox] = useState(null); // { srcs, index } | null
  const [playingId, setPlayingId] = useState(null); // message id whose note is playing

  const treeNames = orderedApproved(items).map((p) => p.name).filter(Boolean);
  // Contributor pages and life spreads in one arranged sequence.
  const seq = orderedBook(items, spreads, { approvedOnly: true });
  let pageNo = 0; // running page number for the contributor spreads

  // Tap the note text → play that person's reading of it (toggle).
  function playText(it) {
    const a = textAudioRef.current;
    if (!a) return;
    if (playingId === it.id) {
      a.pause();
      setPlayingId(null);
      return;
    }
    a.src = it.textAudioURL;
    a.currentTime = 0;
    a.play().catch(() => {});
    setPlayingId(it.id);
  }

  function onBookClick(e) {
    // 1) note text → play the contributor's reading
    const textEl = e.target.closest(".pl-text");
    if (textEl) {
      const pageEl = textEl.closest('[id^="person-"]');
      const id = pageEl?.id.replace("person-", "");
      const it = items.find((x) => x.id === id);
      if (it?.textAudioURL) {
        playText(it);
        return;
      }
    }
    // 2) any photo → open it full-screen (prev/next across the book)
    const img = e.target.closest("img");
    if (!img || !rootRef.current) return;
    const all = [...rootRef.current.querySelectorAll(ZOOMABLE)];
    const idx = all.indexOf(img);
    if (idx < 0) return; // not a zoomable photo (QR / background)
    setBox({ srcs: all.map((im) => im.currentSrc || im.src), index: idx });
  }

  // Clickable tree → jump to that person's page.
  const jumpToPerson = useCallback((messageId) => {
    const el = document.getElementById(`person-${messageId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="online-book screen-only" ref={rootRef} onClick={onBookClick}>
      {precover?.bg && (
        <OnlinePage style={style}>
          <PreCoverPage precover={precover} />
        </OnlinePage>
      )}
      <OnlinePage style={style}>
        <CoverPage t={t} cover={cover} />
      </OnlinePage>
      {tree?.published === false ? null : tree?.people?.length ? (
        <Reveal className="reveal-tree">
          <OnlineFamilyTree tree={tree} t={t} style={style} onJump={jumpToPerson} />
        </Reveal>
      ) : (
        <OnlinePage style={style}>
          <FamilyTreePage names={treeNames} t={t} />
        </OnlinePage>
      )}

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
            <OnlinePage style={style} id={`person-${it.id}`}>
              <LeftPage
                it={it}
                t={t}
                num={base + 1}
                hasAudio={!!it.textAudioURL}
                playing={playingId === it.id}
              />
            </OnlinePage>
            <OnlinePage style={style}>
              <RightPage it={it} qr={qrMap[it.id]} t={t} num={base + 2} />
            </OnlinePage>
            {it.clipURL && (
              <Reveal className="online-player">
                <span className="op-name" dir="auto">
                  {it.clipKind === "video" ? "🎬" : "🔊"} {it.name}
                </span>
                {it.clipKind === "video" ? (
                  <video src={it.clipURL} controls playsInline />
                ) : (
                  <audio src={it.clipURL} controls />
                )}
              </Reveal>
            )}
          </Fragment>
        );
      })}

      <OnlinePage style={style}>
        <ClosingPage t={t} closing={closing} />
      </OnlinePage>

      {box && (
        <Lightbox
          srcs={box.srcs}
          index={box.index}
          onIndex={(i) => setBox((b) => (b ? { ...b, index: i } : b))}
          onClose={() => setBox(null)}
        />
      )}

      <audio ref={textAudioRef} onEnded={() => setPlayingId(null)} hidden />
    </div>
  );
}
