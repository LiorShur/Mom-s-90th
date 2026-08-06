import { useEffect, useState } from "react";
import { useLang } from "./i18n.jsx";
import { useSongs, makeSong, youtubeId, SEED_TITLES } from "./songs.jsx";
import { uploadFileResumable } from "./storageUpload.js";

const sanitize = (n = "f") => n.replace(/[^A-Za-z0-9._-]/g, "_").slice(-32);

// Organizer screen: build the sing-along songbook. Each song has a title, an
// optional YouTube link to play, and a lyrics box to paste the words into.
export default function SongsEditor() {
  const { t } = useLang();
  const { songs, saveSongs } = useSongs();
  // Seed the requested + suggested titles the first time (empty songbook).
  const [draft, setDraft] = useState(() =>
    songs.items.length
      ? songs
      : { published: true, items: SEED_TITLES.map((tt) => makeSong(tt)) }
  );
  const [saved, setSaved] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (songs.items.length) setDraft((d) => (d.items.length ? d : songs));
  }, [songs]);

  const update = (id, patch) =>
    setDraft((d) => ({ ...d, items: d.items.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  const add = () => setDraft((d) => ({ ...d, items: [...d.items, makeSong()] }));
  const remove = (id) => setDraft((d) => ({ ...d, items: d.items.filter((s) => s.id !== id) }));
  const move = (id, dir) =>
    setDraft((d) => {
      const arr = [...d.items];
      const i = arr.findIndex((s) => s.id === id);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, items: arr };
    });

  async function pickAudio(id, e) {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = "";
    setBusyId(id);
    try {
      const url = await uploadFileResumable(
        `messages/__songs__/${id}_${Date.now()}_${sanitize(f.name)}`,
        f
      );
      update(id, { audioUrl: url });
    } catch (err) {
      alert(err.message || "Error");
    } finally {
      setBusyId(null);
    }
  }

  function togglePublish(e) {
    const next = { ...draft, published: e.target.checked };
    setDraft(next);
    saveSongs(next);
  }

  async function save() {
    await saveSongs(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const published = draft.published !== false;

  return (
    <section className="screen-only songs-editor">
      <p className="lede">{t.songsEditorHint}</p>

      <label className={`tree-publish ${published ? "on" : "off"}`}>
        <input type="checkbox" checked={published} onChange={togglePublish} />
        {published ? t.songsPublishOn : t.songsPublishOff}
      </label>

      <ul className="songs-list">
        {draft.items.map((s, i) => {
          const yid = youtubeId(s.youtubeUrl);
          return (
            <li key={s.id} className="song-edit">
              <div className="song-edit-bar">
                <span className="tp-order">
                  <button className="ghost" onClick={() => move(s.id, -1)} disabled={i === 0}>↑</button>
                  <button className="ghost" onClick={() => move(s.id, 1)} disabled={i === draft.items.length - 1}>↓</button>
                </span>
                <input
                  className="song-edit-title"
                  value={s.title}
                  dir="auto"
                  placeholder={t.songTitleLabel}
                  onChange={(e) => update(s.id, { title: e.target.value })}
                />
                <input
                  className="song-edit-artist"
                  value={s.artist}
                  dir="auto"
                  placeholder={t.songArtistLabel}
                  onChange={(e) => update(s.id, { artist: e.target.value })}
                />
                {yid && <span className="song-ok" title={t.songLinkOk}>▶</span>}
                <button className="link" onClick={() => remove(s.id)}>{t.remove}</button>
              </div>
              <input
                className="song-edit-yt"
                value={s.youtubeUrl}
                dir="ltr"
                placeholder={t.songYoutubePlaceholder}
                onChange={(e) => update(s.id, { youtubeUrl: e.target.value })}
              />
              <div className="song-audio-row">
                <span className="song-or">{t.songOr}</span>
                <label className="upload-btn">
                  {busyId === s.id ? t.savingBtn : s.audioUrl ? t.songAudioReplace : t.songAudioUpload}
                  <input type="file" accept="audio/*" hidden onChange={(e) => pickAudio(s.id, e)} />
                </label>
                {s.audioUrl && (
                  <>
                    <audio src={s.audioUrl} controls />
                    <button type="button" className="link" onClick={() => update(s.id, { audioUrl: "" })}>
                      {t.remove}
                    </button>
                  </>
                )}
              </div>
              <textarea
                className="song-edit-lyrics"
                rows={5}
                value={s.lyrics}
                dir="auto"
                placeholder={t.songLyricsPlaceholder}
                onChange={(e) => update(s.id, { lyrics: e.target.value })}
              />
              <textarea
                className="song-edit-lyrics"
                rows={5}
                value={s.phonetic || ""}
                dir="ltr"
                placeholder={t.songPhoneticPlaceholder}
                onChange={(e) => update(s.id, { phonetic: e.target.value })}
              />
            </li>
          );
        })}
      </ul>

      <div className="editor-actions">
        <button className="ghost" onClick={add}>{t.songAddBtn}</button>
        <button className="primary small" onClick={save}>{saved ? t.savedOk : t.saveBtn}</button>
      </div>
    </section>
  );
}
