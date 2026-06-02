import { useEffect, useState } from "react";
import { db } from "./firebase.js";
import { doc, getDoc } from "firebase/firestore";

export default function MessageView({ id }) {
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
        <p className="kicker">Opening…</p>
      </main>
    );
  }

  if (state === "missing") {
    return (
      <main className="page narrow center">
        <p className="lede">This page of the book couldn't be found.</p>
      </main>
    );
  }

  return (
    <main className="page narrow message-view">
      <p className="kicker">{msg.prompt}</p>

      {msg.clipURL && (
        <div className="player">
          {msg.clipKind === "video" ? (
            <video src={msg.clipURL} controls playsInline />
          ) : (
            <audio src={msg.clipURL} controls />
          )}
          <small>▶ Press play to hear {msg.name.split(" ")[0]}</small>
        </div>
      )}

      <blockquote className="note">{msg.text}</blockquote>

      <p className="signoff">
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
