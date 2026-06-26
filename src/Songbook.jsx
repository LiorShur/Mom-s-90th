import { useState } from "react";
import { useLang } from "./i18n.jsx";
import { useSongs, youtubeId } from "./songs.jsx";

// One song: a play-on-tap video (YouTube) or audio, with its lyrics for singing.
function SongCard({ song }) {
  const { t } = useLang();
  const [playing, setPlaying] = useState(false);
  const yid = youtubeId(song.youtubeUrl);

  return (
    <article className="song-card">
      <header className="song-head">
        <h3 className="song-title" dir="auto">{song.title}</h3>
        {song.artist?.trim() && <span className="song-artist" dir="auto">{song.artist}</span>}
      </header>

      {yid ? (
        playing ? (
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
        )
      ) : song.audioUrl ? (
        <audio src={song.audioUrl} controls />
      ) : null}

      {song.lyrics?.trim() && (
        <pre className="song-lyrics" dir="auto">{song.lyrics}</pre>
      )}
    </article>
  );
}

// The whole sing-along section, shown in the online book.
export default function Songbook() {
  const { t } = useLang();
  const { songs } = useSongs();
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
          <SongCard key={s.id} song={s} />
        ))}
      </div>
    </section>
  );
}
