import { useRef, useState } from "react";
import { useLang } from "./i18n.jsx";
import { useBookStyle } from "./bookStyle.jsx";
import { uploadFileResumable } from "./storageUpload.js";

// Load an image element, optionally requesting it CORS-clean (needed before a
// remote image can be read back off a canvas without tainting it).
function loadImage(src, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load"));
    img.src = src;
  });
}

// Organizer picks the home-screen / favicon icon: the gold "90" emblem, the
// book's cover photo, or a different uploaded photo. A chosen photo is
// center-cropped to a 512 square on a canvas, uploaded, and its URL stored in
// config/book.icon = { type, src, url }.
export default function IconChooser() {
  const { t } = useLang();
  const { book, saveBook } = useBookStyle();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const coverBg = book.cover?.bg;
  const icon = book.icon || {};
  const isPhoto = icon.type === "photo" && icon.url;
  const current = !isPhoto ? "emblem" : icon.src === "upload" ? "upload" : "cover";

  // Center-crop an already-loaded image to a 512 square PNG, upload it, save.
  async function squareUploadSave(img, src) {
    const S = 512;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d");
    const scale = Math.max(S / img.naturalWidth, S / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
    const blob = await new Promise((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/png")
    );
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
      // Remote photo: must load CORS-clean to read it back off the canvas.
      const img = await loadImage(coverBg, true);
      await squareUploadSave(img, "cover");
    } catch (e) {
      console.error(e);
      alert(t.iconCoverFailed);
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
      const img = await loadImage(obj); // local file — no CORS needed
      await squareUploadSave(img, "upload");
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
    </article>
  );
}
