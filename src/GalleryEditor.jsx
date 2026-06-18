import { useState } from "react";
import { db } from "./firebase.js";
import { doc, updateDoc } from "firebase/firestore";
import { useLang } from "./i18n.jsx";
import PhotoSlots from "./PhotoSlots.jsx";
import CollageEditor from "./CollageEditor.jsx";
import ClipPicker from "./ClipPicker.jsx";
import { uploadAll } from "./storageUpload.js";
import { LeftPage, FitBox, PAGE_PX } from "./book.jsx";
import { useBookVars } from "./bookStyle.jsx";

// Organizer-only inline editor: fix a contributor's name, quote and note;
// add/replace/remove photos; adjust the main photo; and drag-arrange the
// floating collage photos.
export default function GalleryEditor({ item, onSaved, onClose, style }) {
  const { t } = useLang();
  const [name, setName] = useState(item.name || "");
  const [generation, setGeneration] = useState(item.generation || "other");
  const [pullQuote, setPullQuote] = useState(item.pullQuote || "");
  const [text, setText] = useState(item.text || "");
  const [slots, setSlots] = useState(() => {
    const urls = item.photoURLs || [];
    return [0, 1, 2, 3].map((i) => ({ url: urls[i] || null, file: null }));
  });
  const [fx, setFx] = useState(() =>
    [0, 1, 2, 3].map((i) => ({ ...(item.photoFx?.[i] || {}) }))
  );
  const [clip, setClip] = useState(
    item.clipURL ? { url: item.clipURL, kind: item.clipKind || "audio" } : null
  );
  const [bgLeft, setBgLeft] = useState(item.bgLeft ? { url: item.bgLeft } : null);
  const [bgRight, setBgRight] = useState(item.bgRight ? { url: item.bgRight } : null);
  const [bgLeftOpacity, setBgLeftOpacity] = useState(item.bgLeftOpacity ?? 1);
  const [bgRightOpacity, setBgRightOpacity] = useState(item.bgRightOpacity ?? 1);
  const [bgLeftPanel, setBgLeftPanel] = useState(item.bgLeftPanel ?? false);
  const [bgSpread, setBgSpread] = useState(item.bgSpread ? { url: item.bgSpread } : null);
  const [bgSpreadOpacity, setBgSpreadOpacity] = useState(item.bgSpreadOpacity ?? 1);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);

  const vars = useBookVars();
  const p = fx[0] || {};
  const pv = {
    rot: p.rot ?? 0, zoom: p.zoom ?? 1, ox: p.ox ?? 50, oy: p.oy ?? 50,
    tilt: p.tilt ?? false, fit: p.fit ?? false,
  };
  const setPortrait = (patch) =>
    setFx(fx.map((f, i) => (i === 0 ? { ...f, ...patch } : f)));

  // Live draft used for the left-page preview (updates as you edit).
  const draft = {
    name: name.trim() || item.name,
    pullQuote,
    text,
    photoURLs: slots.map((s) => s.url),
    photoFx: fx,
    bgLeft: bgLeft?.url || null,
    bgLeftOpacity,
    bgLeftPanel,
    bgSpread: bgSpread?.url || null,
    bgSpreadOpacity,
  };

  function pickBg(setter, e) {
    const f = e.target.files[0];
    if (!f) return;
    setter({ url: URL.createObjectURL(f), file: f });
  }

  async function save() {
    setSaving(true);
    try {
      const uploads = [];
      slots.forEach((s, i) => {
        if (s.file) uploads.push({ kind: "photo", index: i, file: s.file });
      });
      if (clip?.blob) uploads.push({ kind: "clip", ext: clip.ext, file: clip.blob });
      if (bgLeft?.file) uploads.push({ kind: "bgLeft", file: bgLeft.file });
      if (bgRight?.file) uploads.push({ kind: "bgRight", file: bgRight.file });
      if (bgSpread?.file) uploads.push({ kind: "bgSpread", file: bgSpread.file });

      const photoURLs = slots.map((s) => (s.url && !s.file ? s.url : null));
      let clipURL = clip ? (clip.blob ? null : clip.url) : null;
      const clipKind = clip ? clip.kind : null;
      let bgLeftURL = bgLeft ? (bgLeft.file ? null : bgLeft.url) : null;
      let bgRightURL = bgRight ? (bgRight.file ? null : bgRight.url) : null;
      let bgSpreadURL = bgSpread ? (bgSpread.file ? null : bgSpread.url) : null;
      if (uploads.length) {
        const results = await uploadAll(uploads, item.id, (pct) => setProgress(pct));
        results.forEach((r) => {
          if (r.kind === "photo") photoURLs[r.index] = r.url;
          else if (r.kind === "clip") clipURL = r.url;
          else if (r.kind === "bgLeft") bgLeftURL = r.url;
          else if (r.kind === "bgRight") bgRightURL = r.url;
          else if (r.kind === "bgSpread") bgSpreadURL = r.url;
        });
      }
      const fields = {
        name: name.trim(),
        generation,
        pullQuote: pullQuote.trim(),
        text: text.trim(),
        photoURLs,
        photoFx: fx,
        clipURL,
        clipKind,
        bgLeft: bgLeftURL,
        bgRight: bgRightURL,
        bgLeftOpacity,
        bgRightOpacity,
        bgLeftPanel,
        bgSpread: bgSpreadURL,
        bgSpreadOpacity,
      };
      await updateDoc(doc(db, "messages", item.id), fields);
      onSaved(fields);
    } catch (e) {
      alert(e.message || "Error");
    } finally {
      setSaving(false);
      setProgress(null);
    }
  }

  return (
    <div className="editor">
      <label className="field">
        <span>{t.nameLabel}</span>
        <input value={name} dir="auto" onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field">
        <span>{t.generationLabel}</span>
        <select value={generation} onChange={(e) => setGeneration(e.target.value)}>
          {t.generations.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>{t.pullQuoteLabel}</span>
        <input value={pullQuote} dir="auto" onChange={(e) => setPullQuote(e.target.value)} />
      </label>
      <label className="field">
        <span>{t.noteLabel}</span>
        <textarea rows={4} value={text} dir="auto" onChange={(e) => setText(e.target.value)} />
      </label>

      <PhotoSlots slots={slots} setSlots={setSlots} layout="compact" />

      {/* Main photo (full-bleed on the left page) with a live page preview */}
      {slots[0].url && (
        <div className="portrait-controls">
          <span className="field-title">{t.mainPhotoTitle}</span>
          <div className="left-preview">
            <FitBox w={PAGE_PX} h={PAGE_PX} maxWidth={300}>
              <div className={`book style-${style}`} style={vars}>
                <LeftPage it={draft} t={t} />
              </div>
            </FitBox>
          </div>
          <div className="cc-controls">
            <label>{t.fxRotate}
              <input type="range" min="-30" max="30" value={pv.rot}
                onChange={(e) => setPortrait({ rot: +e.target.value })} />
            </label>
            <label>{t.fxZoom}
              <input type="range" min="0.4" max="2.5" step="0.05" value={pv.zoom}
                onChange={(e) => setPortrait({ zoom: +e.target.value })} />
            </label>
            <label>{t.fxPanX}
              <input type="range" min="0" max="100" value={pv.ox}
                onChange={(e) => setPortrait({ ox: +e.target.value })} />
            </label>
            <label>{t.fxPanY}
              <input type="range" min="0" max="100" value={pv.oy}
                onChange={(e) => setPortrait({ oy: +e.target.value })} />
            </label>
            <label className="fx-toggle">
              <input type="checkbox" checked={pv.tilt}
                onChange={(e) => setPortrait({ tilt: e.target.checked })} />
              {t.fxTilt}
            </label>
            <label className="fx-toggle">
              <input type="checkbox" checked={pv.fit}
                onChange={(e) => setPortrait({ fit: e.target.checked })} />
              {t.fxFit}
            </label>
          </div>
        </div>
      )}

      {/* Collage photos (drag to arrange / overlap) */}
      <span className="field-title">{t.collageTitle}</span>
      <CollageEditor
        photoURLs={slots.map((s) => s.url)}
        fx={fx}
        setFx={setFx}
        style={style}
      />

      <span className="field-title">{t.pageBgTitle}</span>
      <div className="bg-slots">
        <div className="bg-slot">
          <label className="slot-drop">
            {bgSpread?.url ? <img src={bgSpread.url} alt="" /> : <span className="slot-plus">＋</span>}
            <input type="file" accept="image/*" hidden onChange={(e) => pickBg(setBgSpread, e)} />
          </label>
          <span className="slot-cap">{t.pageBgSpread}</span>
          {bgSpread?.url && (
            <>
              <label className="bg-opacity">
                {t.fxOpacity}
                <input type="range" min="0.1" max="1" step="0.05" value={bgSpreadOpacity}
                  onChange={(e) => setBgSpreadOpacity(+e.target.value)} />
              </label>
              <label className="fx-toggle">
                <input type="checkbox" checked={bgLeftPanel}
                  onChange={(e) => setBgLeftPanel(e.target.checked)} />
                {t.bgKeepText}
              </label>
              <button type="button" className="link" onClick={() => setBgSpread(null)}>
                {t.remove}
              </button>
            </>
          )}
        </div>
      </div>
      {bgSpread?.url && <p className="bg-note">{t.pageBgSpreadNote}</p>}
      <div className="bg-slots">
        {[
          {
            label: t.pageBgLeft, bg: bgLeft, setBg: setBgLeft,
            opacity: bgLeftOpacity, setOpacity: setBgLeftOpacity,
            panel: bgLeftPanel, setPanel: setBgLeftPanel,
          },
          {
            label: t.pageBgRight, bg: bgRight, setBg: setBgRight,
            opacity: bgRightOpacity, setOpacity: setBgRightOpacity,
          },
        ].map(({ label, bg, setBg, opacity, setOpacity, panel, setPanel }, i) => (
          <div className="bg-slot" key={i}>
            <label className="slot-drop">
              {bg?.url ? <img src={bg.url} alt="" /> : <span className="slot-plus">＋</span>}
              <input type="file" accept="image/*" hidden onChange={(e) => pickBg(setBg, e)} />
            </label>
            <span className="slot-cap">{label}</span>
            {bg?.url && (
              <>
                <label className="bg-opacity">
                  {t.fxOpacity}
                  <input type="range" min="0.1" max="1" step="0.05" value={opacity}
                    onChange={(e) => setOpacity(+e.target.value)} />
                </label>
                {setPanel && (
                  <label className="fx-toggle">
                    <input type="checkbox" checked={panel}
                      onChange={(e) => setPanel(e.target.checked)} />
                    {t.bgKeepText}
                  </label>
                )}
                <button type="button" className="link" onClick={() => setBg(null)}>
                  {t.remove}
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <ClipPicker clip={clip} setClip={setClip} />

      {saving && progress != null && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span className="progress-label">{t.uploading(progress)}</span>
        </div>
      )}

      <div className="editor-actions">
        <button className="primary small" disabled={saving} onClick={save}>
          {saving ? t.savingBtn : t.saveBtn}
        </button>
        <button className="ghost" disabled={saving} onClick={onClose}>
          {t.cancelBtn}
        </button>
      </div>
    </div>
  );
}
