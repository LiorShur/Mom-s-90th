import { useRef, useState } from "react";
import { db, ensureSignedIn } from "./firebase.js";
import { collection, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useLang } from "./i18n.jsx";
import PhotoSlots from "./PhotoSlots.jsx";
import { uploadAll } from "./storageUpload.js";

const MAX_BODY = 600; // recommended characters for the page to fit nicely
const MAX_QUOTE = 80;

const emptySlots = () => [0, 1, 2, 3].map(() => ({ url: null, file: null }));

export default function Submit() {
  const { t, lang } = useLang();
  const [name, setName] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [pullQuote, setPullQuote] = useState("");
  const [text, setText] = useState("");
  const [slots, setSlots] = useState(emptySlots);
  const [clip, setClip] = useState(null); // {blob, ext, kind, url}
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [progress, setProgress] = useState(null); // {pct, eta}
  const [error, setError] = useState("");

  const canSubmit = name.trim() && text.trim() && status !== "saving";

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus("saving");
    setError("");
    setProgress({ pct: 0, eta: null });
    try {
      await ensureSignedIn();
      const docRef = await addDoc(collection(db, "messages"), {
        name: name.trim(),
        // Relationship + generation are assigned by the organizer in the gallery.
        generation: "other",
        relationship: "",
        prompt: t.prompts[promptIndex],
        pullQuote: pullQuote.trim(),
        text: text.trim(),
        lang,
        photoURLs: [],
        clipURL: null,
        clipKind: clip?.kind || null,
        approved: false,
        createdAt: serverTimestamp(),
      });

      const uploads = [];
      slots.forEach((s, i) => {
        if (s.file) uploads.push({ kind: "photo", index: i, file: s.file });
      });
      if (clip) uploads.push({ kind: "clip", ext: clip.ext, file: clip.blob });

      const photoURLs = slots.map((s) => s.url && !s.file ? s.url : null);
      let clipURL = null;
      if (uploads.length) {
        const results = await uploadAll(uploads, docRef.id, (pct, eta) =>
          setProgress({ pct, eta })
        );
        results.forEach((r) => {
          if (r.kind === "photo") photoURLs[r.index] = r.url;
          else clipURL = r.url;
        });
      }

      await updateDoc(docRef, { photoURLs, clipURL });
      setStatus("done");
    } catch (e) {
      console.error(e);
      setError(e.message || t.genericError);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <main className="page narrow">
        <div className="card thanks">
          <p className="kicker">{t.thanksKicker}</p>
          <h1>{t.thanksTitle(name.split(" ")[0])}</h1>
          <p className="lede">{t.thanksLede}</p>
          <button
            className="ghost"
            onClick={() => {
              setName("");
              setPullQuote("");
              setText("");
              setSlots(emptySlots());
              setClip(null);
              setProgress(null);
              setStatus("idle");
            }}
          >
            {t.addAnother}
          </button>
        </div>
      </main>
    );
  }

  const overBody = text.trim().length > MAX_BODY;

  return (
    <main className="page narrow">
      <header className="masthead">
        <p className="kicker">{t.forGrandma}</p>
        <h1>{t.appTitle}</h1>
        <p className="lede">{t.submitLede}</p>
      </header>

      <div className="card">
        <label className="field">
          <span>{t.nameLabel}</span>
          <input
            value={name}
            dir="auto"
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
          />
        </label>

        <label className="field">
          <span>{t.promptLabel}</span>
          <select
            value={promptIndex}
            onChange={(e) => setPromptIndex(Number(e.target.value))}
          >
            {t.prompts.map((p, i) => (
              <option key={i} value={i}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>{t.pullQuoteLabel}</span>
          <input
            className="handwritten"
            value={pullQuote}
            dir="auto"
            maxLength={MAX_QUOTE + 20}
            onChange={(e) => setPullQuote(e.target.value)}
            placeholder={t.pullQuotePlaceholder}
          />
        </label>

        <label className="field">
          <span>{t.noteLabel}</span>
          <textarea
            className="handwritten"
            rows={5}
            value={text}
            dir="auto"
            onChange={(e) => setText(e.target.value)}
            placeholder={t.notePlaceholder}
          />
          <small className={overBody ? "warn" : ""}>
            {t.charsCount(text.trim().length)}
            {overBody ? ` — ${t.textTooLong}` : ` / ~${MAX_BODY}`}
          </small>
        </label>

        <PhotoSlots slots={slots} setSlots={setSlots} />
        <ClipPicker clip={clip} setClip={setClip} />

        {error && <p className="error">{error}</p>}

        {status === "saving" && progress && (
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progress.pct}%` }} />
            <span className="progress-label">
              {t.uploading(progress.pct)}
              {progress.eta ? ` · ${t.uploadingEta(progress.eta)}` : ""}
            </span>
          </div>
        )}

        <button className="primary" disabled={!canSubmit} onClick={handleSubmit}>
          {status === "saving" ? t.savingBtn : t.submitBtn}
        </button>
      </div>
    </main>
  );
}

// Record in-browser or upload a clip, then listen back before submitting.
function ClipPicker({ clip, setClip }) {
  const { t } = useLang();
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setClip({ blob, ext: "webm", kind: "audio", url: URL.createObjectURL(blob) });
        stream.getTracks().forEach((tr) => tr.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      alert(t.micError);
    }
  }
  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }
  function onUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop() || "dat";
    const kind = file.type.startsWith("video") ? "video" : "audio";
    setClip({ blob: file, ext, kind, url: URL.createObjectURL(file) });
  }

  return (
    <div className="field">
      <span>{t.voiceLabel}</span>
      <div className="clip-controls">
        {!recording ? (
          <button type="button" className="record" onClick={startRecording}>
            {clip ? t.recordAgain : t.recordBtn}
          </button>
        ) : (
          <button type="button" className="record stop" onClick={stopRecording}>
            {t.stopBtn}
          </button>
        )}
        <span className="or">{t.or}</span>
        <label className="upload-btn">
          {t.uploadBtn}
          <input type="file" accept="audio/*,video/*" onChange={onUpload} hidden />
        </label>
      </div>

      {clip && (
        <div className="clip-preview">
          <small className="clip-ok">{t.clipPreviewHint}</small>
          {clip.kind === "video" ? (
            <video src={clip.url} controls playsInline />
          ) : (
            <audio src={clip.url} controls />
          )}
          <button type="button" className="link" onClick={() => setClip(null)}>
            {t.remove}
          </button>
        </div>
      )}
    </div>
  );
}
