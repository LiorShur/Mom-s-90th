import { useEffect, useState } from "react";
import { useLang } from "./i18n.jsx";
import { useTree, makePerson, descendantIds } from "./tree.jsx";
import { uploadFileResumable } from "./storageUpload.js";

const sanitize = (n = "f") => n.replace(/[^A-Za-z0-9._-]/g, "_").slice(-32);

// Organizer screen: build the family tree. Seed names from the submissions,
// add anyone who didn't submit (spouses, kids, the late grandfather), and set
// each person's parent + married-in partner. The book's tree page renders from
// this. `items` are the gallery's contributor messages (for one-click seeding).
export default function TreeEditor({ items = [] }) {
  const { t } = useLang();
  const { tree, saveTree } = useTree();
  const [draft, setDraft] = useState(tree);
  const [saved, setSaved] = useState(false);
  const [bgBusy, setBgBusy] = useState(false);

  // Adopt data once it loads, as long as we haven't started editing.
  useEffect(() => {
    setDraft((cur) =>
      cur.people.length === 0 && !cur.honoreeName && !cur.honoreeSpouse ? tree : cur
    );
  }, [tree]);

  const setHonoree = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const update = (id, patch) =>
    setDraft((d) => ({
      ...d,
      people: d.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  const addPerson = () =>
    setDraft((d) => ({ ...d, people: [...d.people, makePerson()] }));
  const removePerson = (id) =>
    setDraft((d) => {
      const removed = d.people.find((p) => p.id === id);
      const up = removed ? removed.parentId : "";
      return {
        ...d,
        people: d.people
          .filter((p) => p.id !== id)
          .map((p) => (p.parentId === id ? { ...p, parentId: up } : p)),
      };
    });
  const move = (id, dir) =>
    setDraft((d) => {
      const arr = [...d.people];
      const i = arr.findIndex((p) => p.id === id);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, people: arr };
    });
  const importFromSubmissions = () =>
    setDraft((d) => {
      const have = new Set(d.people.map((p) => p.messageId).filter(Boolean));
      const added = items
        .filter((it) => it.approved && it.name && !have.has(it.id))
        .map((it) => makePerson(it.name.trim(), { messageId: it.id }));
      return { ...d, people: [...d.people, ...added] };
    });

  async function pickBackdrop(e) {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = "";
    setBgBusy(true);
    try {
      const url = await uploadFileResumable(
        `messages/__tree__/backdrop_${Date.now()}_${sanitize(f.name)}`,
        f
      );
      setDraft((d) => ({ ...d, backdrop: url }));
    } catch (err) {
      alert(err.message || "Error");
    } finally {
      setBgBusy(false);
    }
  }

  async function save() {
    await saveTree(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const honoreeLabel = draft.honoreeName.trim() || t.treeHonoree;

  return (
    <section className="screen-only tree-editor">
      <p className="lede">{t.treeEditorHint}</p>

      <div className="card tree-root-card">
        <div className="row">
          <label className="field">
            <span>{t.treeHonoreeName}</span>
            <input
              value={draft.honoreeName}
              dir="auto"
              placeholder={t.treeHonoree}
              onChange={(e) => setHonoree({ honoreeName: e.target.value })}
            />
          </label>
          <label className="field">
            <span>{t.treeHonoreeSpouse}</span>
            <input
              value={draft.honoreeSpouse}
              dir="auto"
              onChange={(e) => setHonoree({ honoreeSpouse: e.target.value })}
            />
          </label>
        </div>
        <span className="field-title">{t.treeBackdropLabel}</span>
        <div className="bg-slots">
          <div className="bg-slot">
            <label className="slot-drop">
              {draft.backdrop ? <img src={draft.backdrop} alt="" /> : <span className="slot-plus">＋</span>}
              <input type="file" accept="image/*" hidden onChange={pickBackdrop} />
            </label>
            <span className="slot-cap">{bgBusy ? t.savingBtn : t.treeBackdropLabel}</span>
            {draft.backdrop && (
              <button type="button" className="link" onClick={() => setDraft((d) => ({ ...d, backdrop: "" }))}>
                {t.remove}
              </button>
            )}
          </div>
        </div>
        <p className="bg-note">{t.treeBackdropHint}</p>
      </div>

      <div className="tree-actions">
        <button className="ghost" onClick={importFromSubmissions}>
          {t.treeImportBtn}
        </button>
        <button className="ghost" onClick={addPerson}>
          {t.treeAddPersonBtn}
        </button>
      </div>

      {draft.people.length === 0 ? (
        <p className="bg-note">{t.treeEmpty}</p>
      ) : (
        <ul className="tree-people">
          {draft.people.map((p, i) => {
            const banned = descendantIds(draft.people, p.id);
            return (
              <li key={p.id} className="tree-person-row">
                <span className="tp-order">
                  <button className="ghost" onClick={() => move(p.id, -1)} disabled={i === 0}>↑</button>
                  <button className="ghost" onClick={() => move(p.id, 1)} disabled={i === draft.people.length - 1}>↓</button>
                </span>
                <label className="tp-field tp-name">
                  <span>{t.treeNameLabel}</span>
                  <input
                    value={p.name}
                    dir="auto"
                    placeholder={t.treeNamePlaceholder}
                    onChange={(e) => update(p.id, { name: e.target.value })}
                  />
                </label>
                <label className="tp-field tp-parent">
                  <span>{t.treeParentLabel}</span>
                  <select
                    value={p.parentId || ""}
                    onChange={(e) => update(p.id, { parentId: e.target.value })}
                  >
                    <option value="">{honoreeLabel}</option>
                    {draft.people
                      .filter((q) => q.id !== p.id && !banned.has(q.id) && q.name.trim())
                      .map((q) => (
                        <option key={q.id} value={q.id}>{q.name}</option>
                      ))}
                  </select>
                </label>
                <label className="tp-field tp-spouse">
                  <span>{t.treeSpouseLabel}</span>
                  <input
                    value={p.spouseName || ""}
                    dir="auto"
                    placeholder={t.treeSpousePlaceholder}
                    onChange={(e) => update(p.id, { spouseName: e.target.value })}
                  />
                </label>
                {p.messageId && <span className="tp-linked" title={t.treeLinked}>🔗</span>}
                <button className="link tp-remove" onClick={() => removePerson(p.id)}>
                  {t.remove}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="editor-actions">
        <button className="primary small" onClick={save}>
          {saved ? t.savedOk : t.saveBtn}
        </button>
      </div>
    </section>
  );
}
