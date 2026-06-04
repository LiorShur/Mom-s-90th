import { useLang } from "./i18n.jsx";
import { fxStyle } from "./book.jsx";

// Four photo "slots" mapped to where each photo lands in the book:
//   slot 0 -> the big portrait on page one
//   slots 1-3 -> the collage on page two
// `slots` is an array of { url, file }: url is the preview/existing image,
// file is a freshly picked File still to upload (null for existing images).
export default function PhotoSlots({ slots, setSlots, fx, setFx }) {
  const { t } = useLang();
  const editable = !!fx; // organizer mode: show rotate/zoom/pan controls

  function setSlot(i, val) {
    setSlots(slots.map((s, idx) => (idx === i ? val : s)));
  }
  function onPick(i, e) {
    const f = e.target.files[0];
    if (!f) return;
    setSlot(i, { url: URL.createObjectURL(f), file: f });
  }
  function setFxField(i, key, val) {
    setFx(fx.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)));
  }
  const label = (i) => (i === 0 ? t.slotPortrait : t.slotCollage(i));

  return (
    <div className="field">
      <span>{t.photoSlotsLabel}</span>
      <div className="slots">
        {slots.map((s, i) => (
          <div key={i} className={`slot ${i === 0 ? "portrait" : ""} ${editable ? "editable" : ""}`}>
            <label className="slot-drop">
              {s.url ? (
                <img
                  src={s.url}
                  alt=""
                  className={editable && fx[i].tilt ? "tilted" : undefined}
                  style={editable ? fxStyle(fx[i]) : undefined}
                />
              ) : (
                <span className="slot-plus">＋</span>
              )}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onPick(i, e)}
              />
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
            {editable && s.url && (
              <div className="slot-fx">
                <label className="fx-toggle">
                  <input
                    type="checkbox"
                    checked={!!fx[i].tilt}
                    onChange={(e) => setFxField(i, "tilt", e.target.checked)}
                  />
                  {t.fxTilt}
                </label>
                <label>{t.fxRotate}
                  <input type="range" min="-20" max="20" step="1" value={fx[i].rot}
                    onChange={(e) => setFxField(i, "rot", Number(e.target.value))} />
                </label>
                <label>{t.fxZoom}
                  <input type="range" min="1" max="2.5" step="0.05" value={fx[i].zoom}
                    onChange={(e) => setFxField(i, "zoom", Number(e.target.value))} />
                </label>
                <label>{t.fxPanX}
                  <input type="range" min="0" max="100" value={fx[i].ox}
                    onChange={(e) => setFxField(i, "ox", Number(e.target.value))} />
                </label>
                <label>{t.fxPanY}
                  <input type="range" min="0" max="100" value={fx[i].oy}
                    onChange={(e) => setFxField(i, "oy", Number(e.target.value))} />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
