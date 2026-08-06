import { useState } from "react";
import { useLang } from "./i18n.jsx";
import PhotoCropper from "./PhotoCropper.jsx";

// Upload widget for the 4 photo slots (slot 0 = main, 1-3 = collage).
// layout="schematic" → the contributor form's two-page-spread diagram.
// layout="compact"   → a simple row of frames for the gallery editor.
// Positioning/rotation/shadow of the collage photos is handled by CollageEditor.
//
// Picking a photo opens a square framing editor (PhotoCropper) so the
// contributor decides exactly what's kept — zoom out to bring the whole image
// back (white matte), or in to crop. The framed result is stored as the slot's
// file (a JPEG), which uploadAll() then uploads unchanged.
export default function PhotoSlots({ slots, setSlots, layout = "schematic" }) {
  const { t } = useLang();
  const [editing, setEditing] = useState(null); // { i, file, blob }

  function setSlot(i, val) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? val : s)));
  }
  function removeSlot(i) {
    setSlots((prev) =>
      prev.map((s, idx) => {
        if (idx !== i) return s;
        if (s.url) URL.revokeObjectURL(s.url);
        return { url: null, file: null };
      })
    );
  }
  function onPick(i, e) {
    const f = e.target.files[0];
    e.target.value = ""; // allow re-picking the same file after a remove
    if (!f) return;
    setEditing({ i, file: f, blob: null }); // open the framing editor
  }
  function cancelEdit() {
    setEditing(null);
  }
  function commitEdit() {
    if (!editing) return;
    const base =
      (editing.file.name || "photo").replace(/\.[^.]+$/, "") || "photo";
    const out = editing.blob
      ? new File([editing.blob], `${base}.jpg`, { type: "image/jpeg" })
      : editing.file; // fallback to the original if framing hasn't rendered yet
    const url = URL.createObjectURL(out);
    setSlots((prev) =>
      prev.map((s, idx) => {
        if (idx !== editing.i) return s;
        if (s.url) URL.revokeObjectURL(s.url);
        return { url, file: out };
      })
    );
    setEditing(null);
  }

  const label = (i) => (i === 0 ? t.slotPortrait : t.slotCollage(i));

  function renderSlot(i) {
    const s = slots[i];
    return (
      <div key={i} className={`slot ${i === 0 ? "portrait" : ""} ${s.url ? "filled" : ""}`}>
        <label className="slot-drop">
          {s.url ? <img src={s.url} alt="" /> : <span className="slot-plus">＋</span>}
          <input type="file" accept="image/*" hidden onChange={(e) => onPick(i, e)} />
        </label>
        {s.url && (
          <button
            type="button"
            className="slot-x"
            onClick={() => removeSlot(i)}
            aria-label="remove"
          >
            ✕
          </button>
        )}
        <span className="slot-cap">{label(i)}</span>
      </div>
    );
  }

  const editor = editing && (
    <div className="cropper-modal" role="dialog" aria-modal="true">
      <div className="cropper-modal-card">
        <h3 className="cropper-modal-title">{t.framePhoto}</h3>
        <PhotoCropper
          file={editing.file}
          onChange={(blob) => setEditing((e) => (e ? { ...e, blob } : e))}
        />
        <div className="cropper-modal-actions">
          <button type="button" className="ghost" onClick={cancelEdit}>
            {t.cancel}
          </button>
          <button type="button" className="cropper-done" onClick={commitEdit}>
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );

  if (layout === "compact") {
    return (
      <div className="field">
        <span>{t.photoSlotsLabel}</span>
        <div className="slots">{slots.map((s, i) => renderSlot(i))}</div>
        {editor}
      </div>
    );
  }

  // Contributor form: schematic of the book's two-page spread.
  return (
    <div className="field">
      <span>{t.photoSlotsLabel}</span>
      <p className="slots-hint">{t.photoSlotsHint}</p>
      <div className="slots-spread">
        <div className="sp-page sp-left">
          <div className="sp-text" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="sp-portrait">{renderSlot(0)}</div>
        </div>
        <div className="sp-page sp-right">
          <div className="sp-collage">
            {renderSlot(1)}
            {renderSlot(2)}
            {renderSlot(3)}
            <div className="sp-qr" aria-hidden="true">🔊<br />QR</div>
          </div>
        </div>
      </div>
      {editor}
    </div>
  );
}
