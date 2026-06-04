import { useLang } from "./i18n.jsx";

// Four photo "slots" mapped to where each photo lands in the book:
//   slot 0 -> the big portrait on page one
//   slots 1-3 -> the collage on page two
// `slots` is an array of { url, file }: url is the preview/existing image,
// file is a freshly picked File still to upload (null for existing images).
export default function PhotoSlots({ slots, setSlots }) {
  const { t } = useLang();

  function setSlot(i, val) {
    setSlots(slots.map((s, idx) => (idx === i ? val : s)));
  }
  function onPick(i, e) {
    const f = e.target.files[0];
    if (!f) return;
    setSlot(i, { url: URL.createObjectURL(f), file: f });
  }
  const label = (i) => (i === 0 ? t.slotPortrait : t.slotCollage(i));

  return (
    <div className="field">
      <span>{t.photoSlotsLabel}</span>
      <div className="slots">
        {slots.map((s, i) => (
          <div key={i} className={`slot ${i === 0 ? "portrait" : ""}`}>
            <label className="slot-drop">
              {s.url ? (
                <img src={s.url} alt="" />
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
          </div>
        ))}
      </div>
    </div>
  );
}
