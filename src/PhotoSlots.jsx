import { useLang } from "./i18n.jsx";

// Upload widget for the 4 photo slots (slot 0 = main, 1-3 = collage).
// layout="schematic" → the contributor form's two-page-spread diagram.
// layout="compact"   → a simple row of frames for the gallery editor.
// Positioning/rotation/shadow of the collage photos is handled by CollageEditor.
export default function PhotoSlots({ slots, setSlots, layout = "schematic" }) {
  const { t } = useLang();

  function setSlot(i, val) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? val : s)));
  }
  function onPick(i, e) {
    const f = e.target.files[0];
    if (!f) return;
    setSlot(i, { url: URL.createObjectURL(f), file: f });
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
            onClick={() => setSlot(i, { url: null, file: null })}
            aria-label="remove"
          >
            ✕
          </button>
        )}
        <span className="slot-cap">{label(i)}</span>
      </div>
    );
  }

  if (layout === "compact") {
    return (
      <div className="field">
        <span>{t.photoSlotsLabel}</span>
        <div className="slots">{slots.map((s, i) => renderSlot(i))}</div>
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
    </div>
  );
}
