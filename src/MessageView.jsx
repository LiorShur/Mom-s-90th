import { useEffect, useState } from "react";
import { db } from "./firebase.js";
import { doc, getDoc } from "firebase/firestore";
import { useLang } from "./i18n.jsx";

export default function MessageView({ id }) {
  const { t } = useLang();
  const [msg, setMsg] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | missing

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "messages", id));
        if (snap.exists()) {
          setMsg(snap.data());
          setState("ready");
        } else {
          setState("missing");
        }
      } catch {
        setState("missing");
      }
    })();
  }, [id]);

  if (state === "loading") {
    return (
      <main className="page narrow center">
        <p className="kicker">{t.opening}</p>
      </main>
    );
  }

  if (state === "missing") {
    return (
      <main className="page narrow center">
        <p className="lede">{t.missing}</p>
      </main>
    );
  }

  return (
    <main className="page narrow message-view">
      {/* The note and prompt are shown in whatever language the contributor
          wrote them, so let the browser auto-detect direction per item. */}
      <p className="kicker" dir="auto">{msg.prompt}</p>

      {msg.clipURL && (
        <div className="player">
          {msg.clipKind === "video" ? (
            <video src={msg.clipURL} controls playsInline />
          ) : (
            <audio src={msg.clipURL} controls />
          )}
          <small>{t.pressPlay(msg.name.split(" ")[0])}</small>
        </div>
      )}

      <blockquote className="note" dir="auto">{msg.text}</blockquote>

      <p className="signoff" dir="auto">
        — {msg.name}
        {msg.relationship ? `, ${msg.relationship}` : ""}
      </p>

      {Array.isArray(msg.photoURLs) && msg.photoURLs.length > 0 && (
        <div className="photo-strip">
          {msg.photoURLs.map((u, i) => (
            <img key={i} src={u} alt="" />
          ))}
        </div>
      )}
    </main>
  );
}
