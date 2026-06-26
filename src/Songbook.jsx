import { useEffect, useState } from "react";
import { useLang } from "./i18n.jsx";
import { useSongs, youtubeId } from "./songs.jsx";

// One song in the accordion: a clickable title row that expands to reveal a
// play-on-tap video (YouTube) and/or audio, with its lyrics for singing.
function SongCard({ song, open, onToggle }) {
  const { t } = useLang();
  const [playing, setPlaying] = useState(false);
  const yid = youtubeId(song.youtubeUrl);

  // Collapsing a card stops its video (the iframe unmounts), so make sure it
  // reopens to the poster rather than auto-playing again.
  useEffect(() => {
    if (!open) setPlaying(false);
  }, [open]);

  return (
    <article className={`song-card ${open ? "open" : ""}`}>
      <h3 className="song-head-h">
        <button type="button" className="song-head" onClick={onToggle} aria-expanded={open}>
          <span className="song-title" dir="auto">{song.title}</span>
          {song.artist?.trim() && <span className="song-artist" dir="auto">{song.artist}</span>}
          <span className="song-chevron" aria-hidden="true">▾</span>
        </button>
      </h3>

      {open && (
        <div className="song-body">
          {yid &&
            (playing ? (
              <div className="song-video">
                <iframe
                  src={`https://www.youtube.com/embed/${yid}?autoplay=1&rel=0`}
                  title={song.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  style={{ border: 0 }}
                />
              </div>
            ) : (
              <button
                type="button"
                className="song-play"
                onClick={() => setPlaying(true)}
                style={{ backgroundImage: `url(https://img.youtube.com/vi/${yid}/hqdefault.jpg)` }}
                aria-label={t.songPlay}
              >
                <span className="song-play-icon">▶</span>
              </button>
            ))}

          {/* Uploaded audio plays independently of any YouTube clip, so an
              organizer who added both still gets their audio file. */}
          {song.audioUrl && <audio src={song.audioUrl} controls />}

          {song.lyrics?.trim() && (
            <pre className="song-lyrics" dir="auto">{song.lyrics}</pre>
          )}
        </div>
      )}
    </article>
  );
}

// The whole sing-along section, shown in the online book.
export default function Songbook() {
  const { t } = useLang();
  const { songs } = useSongs();
  // Which song is expanded; only one at a time (null = all collapsed).
  const [openId, setOpenId] = useState(null);
  if (songs.published === false || !songs.items?.length) return null;

  return (
    <section className="songbook">
      <div className="sb-head">
        <p className="sb-kicker">{t.songbookKicker}</p>
        <h2 className="sb-title" dir="auto">{t.songbookTitle}</h2>
        <p className="sb-sub">{t.songbookSub}</p>
      </div>
      <div className="sb-list">
        {songs.items.map((s) => (
          <SongCard
            key={s.id}
            song={s}
            open={openId === s.id}
            onToggle={() => setOpenId((cur) => (cur === s.id ? null : s.id))}
          />
        ))}
      </div>
    </section>
  );
}
