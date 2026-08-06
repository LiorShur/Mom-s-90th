import { useState } from "react";
import { useLang } from "./i18n.jsx";
import { useBookStyle } from "./bookStyle.jsx";
import { uploadFileResumable } from "./storageUpload.js";
import { PreCoverPage, CoverPage, ClosingPage, FitBox, PAGE_PX } from "./book.jsx";

const sanitize = (n = "f") => n.replace(/[^A-Za-z0-9._-]/g, "_").slice(-32);

// Gallery cards for the book's first (cover) and last (closing) pages: live
// preview, editable text, an optional background image and its opacity. Saved
// to config/book so the online book, print and image export all pick it up.
export default function BookPagesEditor({ style }) {
  const { t } = useLang();
  const { book, saveBook } = useBookStyle();

  return (
    <>
      <BookEndCard
        kind="precover"
        title={t.bookEndsPreCover}
        content={book.precover || {}}
        style={style}
        onSave={(next) => saveBook({ ...book, precover: next })}
        render={(c) => <PreCoverPage precover={c} />}
        fields={() => <p className="bg-note">{t.preCoverHint}</p>}
      />
      <BookEndCard
        kind="cover"
        title={t.bookEndsCover}
        content={book.cover || {}}
        style={style}
        onSave={(next) => saveBook({ ...book, cover: next })}
        render={(c) => <CoverPage t={t} cover={c} />}
        fields={(draft, set) => (
          <>
            <label className="field">
              <span>{t.coverTitleField}</span>
              <input value={draft.title || ""} dir="auto"
                onChange={(e) => set({ title: e.target.value })} />
            </label>
            <label className="field">
              <span>{t.coverSubtitleField}</span>
              <input value={draft.subtitle || ""} dir="auto"
                onChange={(e) => set({ subtitle: e.target.value })} />
            </label>
            <label className="fx-toggle">
              <input type="checkbox" checked={!!draft.photoOnly}
                onChange={(e) => set({ photoOnly: e.target.checked })} />
              {t.coverPhotoOnly}
            </label>
          </>
        )}
      />
      <BookEndCard
        kind="closing"
        title={t.bookEndsClosing}
        content={book.closing || {}}
        style={style}
        onSave={(next) => saveBook({ ...book, closing: next })}
        render={(c) => <ClosingPage t={t} closing={c} />}
        fields={(draft, set) => (
          <label className="field">
            <span>{t.closingTextField}</span>
            <textarea rows={2} value={draft.text || ""} dir="auto"
              onChange={(e) => set({ text: e.target.value })} />
          </label>
        )}
      />
    </>
  );
}

function BookEndCard({ kind, title, content, style, onSave, render, fields }) {
  const { t } = useLang();
  const { vars } = useBookStyle();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [bgFile, setBgFile] = useState(null); // { url, file } pending upload
  const [busy, setBusy] = useState(false);

  function open() {
    setDraft(content);
    setBgFile(null);
    setEditing(true);
  }
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  function pickBg(e) {
    const f = e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setBgFile({ url, file: f });
    set({ bg: url });
  }

  async function save() {
    setBusy(true);
    try {
      let next = { ...draft };
      if (bgFile) {
        next.bg = await uploadFileResumable(
          `messages/__book__/${kind}_${Date.now()}_${sanitize(bgFile.file.name)}`,
          bgFile.file
        );
      }
      await onSave(next);
      setEditing(false);
    } catch (e) {
      alert(e.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  const preview = editing ? draft : content;

  return (
    <article className="card sub on book-end-card">
      <p className="kicker">{title}</p>
      <div className="card-spread">
        <FitBox w={PAGE_PX} h={PAGE_PX}>
          <div className={`book style-${style}`} style={vars}>
            {render(preview)}
          </div>
        </FitBox>
      </div>

      {editing ? (
        <div className="editor">
          {fields(draft, set)}
          <span className="field-title">{t.bookBgTitle}</span>
          <div className="bg-slots">
            <div className="bg-slot">
              <label className="slot-drop">
                {preview.bg ? <img src={preview.bg} alt="" /> : <span className="slot-plus">＋</span>}
                <input type="file" accept="image/*" hidden onChange={pickBg} />
              </label>
              <span className="slot-cap">{t.bookBgTitle}</span>
              {preview.bg && (
                <>
                  <label className="bg-opacity">
                    {t.fxOpacity}
                    <input type="range" min="0.1" max="1" step="0.05"
                      value={draft.bgOpacity ?? 1}
                      onChange={(e) => set({ bgOpacity: +e.target.value })} />
                  </label>
                  <button type="button" className="link"
                    onClick={() => { setBgFile(null); set({ bg: null }); }}>
                    {t.remove}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="editor-actions">
            <button className="primary small" disabled={busy} onClick={save}>
              {busy ? t.savingBtn : t.saveBtn}
            </button>
            <button className="ghost" disabled={busy} onClick={() => setEditing(false)}>
              {t.cancelBtn}
            </button>
          </div>
        </div>
      ) : (
        <div className="card-actions">
          <button className="ghost" onClick={open}>{t.editBtn}</button>
        </div>
      )}
    </article>
  );
}
