import { useState } from "react";
import { useLang } from "./i18n.jsx";
import { useLife, makePhoto, makeText } from "./life.jsx";
import { uploadFileResumable } from "./storageUpload.js";
import LifeCanvas from "./LifeCanvas.jsx";

const sanitize = (n = "f") => n.replace(/[^A-Za-z0-9._-]/g, "_").slice(-32);

// Organizer screen: build free-form 58×29 life spreads — photos + text, as many
// per page and as many pages as wanted.
export default function LifeEditor({ style }) {
  const { t } = useLang();
  const { spreads, saveSpreads } = useLife();
  const [list, setList] = useState(spreads.length ? spreads : [{ items: [] }]);
  const [busy, setBusy] = useState(null);
  const [saved, setSaved] = useState(false);

  const setSpreadItems = (idx, items) =>
    setList(list.map((s, i) => (i === idx ? { ...s, items } : s)));

  async function onAddPhotos(idx, e) {
    const files = [...e.target.files];
    if (!files.length) return;
    e.target.value = "";
    const start = list[idx].items.length;
    const added = [];
    for (let i = 0; i < files.length; i++) {
      setBusy({ i: i + 1, n: files.length });
      try {
        const url = await uploadFileResumable(
          `messages/__life__/${Date.now()}_${i}_${sanitize(files[i].name)}`,
          files[i]
        );
        added.push(makePhoto(url, start + i));
      } catch (err) {
        console.error(err);
      }
    }
    setBusy(null);
    setList((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, items: [...s.items, ...added] } : s))
    );
  }

  const addText = (idx) =>
    setList(list.map((s, i) => (i === idx ? { ...s, items: [...s.items, makeText(s.items.length)] } : s)));
  const addPage = () => setList([...list, { items: [] }]);
  const removePage = (idx) => setList(list.filter((_, i) => i !== idx));

  // Only approved spreads are printed/shown in the book — keep work-in-progress
  // pages out of test runs. Persists immediately, like the per-person approval.
  async function toggleApprove(idx) {
    const next = list.map((s, i) => (i === idx ? { ...s, approved: !s.approved } : s));
    setList(next);
    await saveSpreads(next);
  }

  async function save() {
    await saveSpreads(list);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section className="screen-only life-editor">
      <p className="lede">{t.lifeHint}</p>

      {list.map((sp, idx) => (
        <div className={`life-spread-block ${sp.approved ? "" : "muted"}`} key={idx}>
          <div className="life-spread-bar">
            <span className="field-title">{t.lifePage} {idx + 1}</span>
            <label className="upload-btn">
              {t.lifeAddPhotos}
              <input type="file" accept="image/*" multiple hidden
                onChange={(e) => onAddPhotos(idx, e)} />
            </label>
            <button className="ghost" onClick={() => addText(idx)}>{t.lifeAddText}</button>
            <button className="ghost" onClick={() => removePage(idx)}>{t.lifeRemovePage}</button>
            <button
              className={sp.approved ? "ghost" : "primary small"}
              onClick={() => toggleApprove(idx)}
            >
              {sp.approved ? t.approvedBtn : t.approveBtn}
            </button>
          </div>
          <LifeCanvas
            items={sp.items}
            setItems={(items) => setSpreadItems(idx, items)}
            style={style}
          />
        </div>
      ))}

      {busy && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${Math.round((busy.i / busy.n) * 100)}%` }} />
          <span className="progress-label">
            {t.uploading(Math.round((busy.i / busy.n) * 100))} ({busy.i}/{busy.n})
          </span>
        </div>
      )}

      <div className="editor-actions">
        <button className="ghost" onClick={addPage}>{t.lifeAddPage}</button>
        <button className="primary small" onClick={save}>{saved ? t.savedOk : t.saveBtn}</button>
      </div>
    </section>
  );
}
