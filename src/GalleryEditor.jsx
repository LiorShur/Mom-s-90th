import { useState } from "react";
import { db } from "./firebase.js";
import { doc, updateDoc } from "firebase/firestore";
import { useLang } from "./i18n.jsx";
import PhotoSlots from "./PhotoSlots.jsx";
import { uploadAll } from "./storageUpload.js";

// Organizer-only inline editor: fix a contributor's name, quote and note,
// and add/replace/remove their photos.
export default function GalleryEditor({ item, onSaved, onClose }) {
  const { t } = useLang();
  const [name, setName] = useState(item.name || "");
  const [pullQuote, setPullQuote] = useState(item.pullQuote || "");
  const [text, setText] = useState(item.text || "");
  const [slots, setSlots] = useState(() => {
    const urls = item.photoURLs || [];
    return [0, 1, 2, 3].map((i) => ({ url: urls[i] || null, file: null }));
  });
  const [fx, setFx] = useState(() =>
    [0, 1, 2, 3].map((i) => {
      const f = item.photoFx?.[i];
      return {
        rot: f?.rot ?? 0,
        zoom: f?.zoom ?? 1,
        ox: f?.ox ?? 50,
        oy: f?.oy ?? 50,
        tilt: f?.tilt ?? false,
      };
    })
  );
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);

  async function save() {
    setSaving(true);
    try {
      const uploads = [];
      slots.forEach((s, i) => {
        if (s.file) uploads.push({ kind: "photo", index: i, file: s.file });
      });
      const photoURLs = slots.map((s) => (s.url && !s.file ? s.url : null));
      if (uploads.length) {
        const results = await uploadAll(uploads, item.id, (pct) =>
          setProgress(pct)
        );
        results.forEach((r) => {
          photoURLs[r.index] = r.url;
        });
      }
      const fields = {
        name: name.trim(),
        pullQuote: pullQuote.trim(),
        text: text.trim(),
        photoURLs,
        photoFx: fx,
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
        <span>{t.pullQuoteLabel}</span>
        <input value={pullQuote} dir="auto" onChange={(e) => setPullQuote(e.target.value)} />
      </label>
      <label className="field">
        <span>{t.noteLabel}</span>
        <textarea rows={5} value={text} dir="auto" onChange={(e) => setText(e.target.value)} />
      </label>

      <PhotoSlots slots={slots} setSlots={setSlots} fx={fx} setFx={setFx} />

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
