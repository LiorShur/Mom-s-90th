import { useRef, useState } from "react";
import { useLang } from "./i18n.jsx";
import { useBookStyle } from "./bookStyle.jsx";
import { uploadFileResumable } from "./storageUpload.js";

// Organizer picks the home-screen / favicon icon: the gold "90" emblem, or
// the book's cover photo squared into an icon. Choosing the photo rasterizes
// a square crop (via html-to-image, the same path the page export uses),
// uploads it, and stores its URL in config/book.icon.
export default function IconChooser() {
  const { t } = useLang();
  const { book, saveBook } = useBookStyle();
  const [busy, setBusy] = useState(false);
  const renderRef = useRef(null);

  const coverBg = book.cover?.bg;
  const current = book.icon?.type === "photo" && book.icon?.url ? "photo" : "emblem";

  async function pickEmblem() {
    if (busy) return;
    await saveBook({ ...book, icon: { type: "emblem" } });
  }

  async function pickPhoto() {
    if (busy) return;
    if (!coverBg) {
      alert(t.iconNeedCover);
      return;
    }
    setBusy(true);
    try {
      const node = renderRef.current;
      const img = node?.querySelector("img");
      if (img && !(img.complete && img.naturalWidth)) {
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });
      }
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, {
        cacheBust: true,
        width: 512,
        height: 512,
        pixelRatio: 1,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const url = await uploadFileResumable(`messages/__book__/icon_${Date.now()}.png`, blob);
      await saveBook({ ...book, icon: { type: "photo", url } });
    } catch (e) {
      console.error(e);
      alert(t.iconError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card sub on icon-chooser">
      <p className="kicker">{t.iconChooserTitle}</p>
      <p className="bg-note">{t.iconChooserHint}</p>
      <div className="icon-opts">
        <button
          type="button"
          className={`icon-opt ${current === "emblem" ? "on" : ""}`}
          onClick={pickEmblem}
          disabled={busy}
        >
          <img className="icon-prev" src="/icon-512.png" alt="" />
          <span>{t.iconEmblem}</span>
        </button>
        <button
          type="button"
          className={`icon-opt ${current === "photo" ? "on" : ""}`}
          onClick={pickPhoto}
          disabled={busy || !coverBg}
          title={coverBg ? "" : t.iconNeedCover}
        >
          {coverBg ? (
            <span className="icon-prev" style={{ backgroundImage: `url(${coverBg})` }} />
          ) : (
            <span className="icon-prev empty">＋</span>
          )}
          <span>{busy ? t.savingBtn : t.iconCoverPhoto}</span>
        </button>
      </div>

      {/* Off-screen square node rasterized into the photo icon. */}
      <div className="icon-render" aria-hidden="true" ref={renderRef}>
        {coverBg && <img src={coverBg} alt="" />}
      </div>
    </article>
  );
}
