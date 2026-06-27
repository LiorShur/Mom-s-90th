import { useRef, useState } from "react";
import { useLang } from "./i18n.jsx";
import { useBookStyle } from "./bookStyle.jsx";
import { uploadFileResumable } from "./storageUpload.js";

// Organizer picks the home-screen / favicon icon: the gold "90" emblem, the
// book's cover photo, or a different uploaded photo. A chosen photo is squared
// (via html-to-image, the same path the page export uses), uploaded, and its
// URL stored in config/book.icon = { type, src, url }.
export default function IconChooser() {
  const { t } = useLang();
  const { book, saveBook } = useBookStyle();
  const [busy, setBusy] = useState(false);
  const renderRef = useRef(null);
  const imgRef = useRef(null);
  const fileRef = useRef(null);

  const coverBg = book.cover?.bg;
  const icon = book.icon || {};
  const isPhoto = icon.type === "photo" && icon.url;
  const current = !isPhoto ? "emblem" : icon.src === "upload" ? "upload" : "cover";

  // Square a source image into a 512 PNG icon, upload it, and save the choice.
  async function rasterizeAndSave(srcUrl, src) {
    const img = imgRef.current;
    await new Promise((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("image load failed"));
      img.src = srcUrl;
    });
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(renderRef.current, {
      cacheBust: true,
      width: 512,
      height: 512,
      pixelRatio: 1,
    });
    const blob = await (await fetch(dataUrl)).blob();
    const url = await uploadFileResumable(`messages/__book__/icon_${Date.now()}.png`, blob);
    await saveBook({ ...book, icon: { type: "photo", src, url } });
  }

  async function pickEmblem() {
    if (busy) return;
    await saveBook({ ...book, icon: { type: "emblem" } });
  }

  async function pickCover() {
    if (busy) return;
    if (!coverBg) {
      alert(t.iconNeedCover);
      return;
    }
    setBusy(true);
    try {
      await rasterizeAndSave(coverBg, "cover");
    } catch (e) {
      console.error(e);
      alert(t.iconError);
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(e) {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f || busy) return;
    const obj = URL.createObjectURL(f);
    setBusy(true);
    try {
      await rasterizeAndSave(obj, "upload");
    } catch (err) {
      console.error(err);
      alert(t.iconError);
    } finally {
      URL.revokeObjectURL(obj);
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
          className={`icon-opt ${current === "cover" ? "on" : ""}`}
          onClick={pickCover}
          disabled={busy || !coverBg}
          title={coverBg ? "" : t.iconNeedCover}
        >
          {coverBg ? (
            <span className="icon-prev" style={{ backgroundImage: `url(${coverBg})` }} />
          ) : (
            <span className="icon-prev empty">＋</span>
          )}
          <span>{t.iconCoverPhoto}</span>
        </button>

        <button
          type="button"
          className={`icon-opt ${current === "upload" ? "on" : ""}`}
          onClick={() => !busy && fileRef.current?.click()}
          disabled={busy}
        >
          {current === "upload" ? (
            <span className="icon-prev" style={{ backgroundImage: `url(${icon.url})` }} />
          ) : (
            <span className="icon-prev empty">⬆</span>
          )}
          <span>{busy ? t.savingBtn : t.iconUpload}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
      </div>

      {/* Off-screen square node rasterized into the photo icon. */}
      <div className="icon-render" aria-hidden="true" ref={renderRef}>
        <img ref={imgRef} alt="" />
      </div>
    </article>
  );
}
