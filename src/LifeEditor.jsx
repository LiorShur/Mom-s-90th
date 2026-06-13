import { useState } from "react";
import { useLang } from "./i18n.jsx";
import { useLife } from "./life.jsx";
import { uploadFileResumable } from "./storageUpload.js";

const sanitize = (n = "f") => n.replace(/[^A-Za-z0-9._-]/g, "_").slice(-32);

// Organizer screen to build the "Her life in photos" album: multi-upload the
// honoree's photos, add a year + caption to each, remove, and save. The album
// sorts by year automatically.
export default function LifeEditor() {
  const { t } = useLang();
  const { photos, savePhotos } = useLife();
  const [list, setList] = useState(photos);
  const [busy, setBusy] = useState(null); // { i, n }
  const [saved, setSaved] = useState(false);

  async function onFiles(e) {
    const files = [...e.target.files];
    if (!files.length) return;
    const added = [];
    for (let i = 0; i < files.length; i++) {
      setBusy({ i: i + 1, n: files.length });
      try {
        const url = await uploadFileResumable(
          `messages/__life__/${Date.now()}_${i}_${sanitize(files[i].name)}`,
          files[i]
        );
        added.push({ url, year: "", caption: "" });
      } catch (err) {
        console.error(err);
      }
    }
    setBusy(null);
    setList((prev) => [...prev, ...added]);
    e.target.value = "";
  }

  const update = (i, patch) =>
    setList(list.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const remove = (i) => setList(list.filter((_, idx) => idx !== i));

  async function save() {
    await savePhotos(list);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section className="screen-only life-editor">
      <p className="lede">{t.lifeHint}</p>

      <label className="upload-btn life-upload">
        {t.lifeAddPhotos}
        <input type="file" accept="image/*" multiple hidden onChange={onFiles} />
      </label>

      {busy && (
        <div className="progress">
          <div
            className="progress-bar"
            style={{ width: `${Math.round((busy.i / busy.n) * 100)}%` }}
          />
          <span className="progress-label">
            {t.uploading(Math.round((busy.i / busy.n) * 100))} ({busy.i}/{busy.n})
          </span>
        </div>
      )}

      <div className="life-list">
        {list.map((p, i) => (
          <div className="life-row" key={i}>
            <img src={p.url} alt="" className="life-thumb" />
            <input
              className="life-year-in"
              inputMode="numeric"
              placeholder={t.lifeYear}
              value={p.year}
              onChange={(e) => update(i, { year: e.target.value })}
            />
            <input
              className="life-cap-in"
              dir="auto"
              placeholder={t.lifeCaption}
              value={p.caption}
              onChange={(e) => update(i, { caption: e.target.value })}
            />
            <button className="ghost" onClick={() => remove(i)} aria-label="remove">
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="primary small" onClick={save}>
        {saved ? t.savedOk : t.saveBtn}
      </button>
    </section>
  );
}
