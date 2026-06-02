import { useRef, useState } from "react";
import { db, storage, ensureSignedIn } from "./firebase.js";
import { collection, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useLang } from "./i18n.jsx";

export default function Submit() {
  const { t, lang } = useLang();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [generation, setGeneration] = useState("grandchild");
  // Track the prompt by index so switching language keeps the same choice
  // (the stored value is the localized prompt text, resolved at submit time).
  const [promptIndex, setPromptIndex] = useState(0);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState([]);
  const [clip, setClip] = useState(null); // {blob, ext, kind}
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [error, setError] = useState("");

  const canSubmit = name.trim() && text.trim() && status !== "saving";

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus("saving");
    setError("");
    try {
      await ensureSignedIn();
      const docData = {
        name: name.trim(),
        relationship: relationship.trim(),
        generation,
        prompt: t.prompts[promptIndex],
        text: text.trim(),
        lang,
        photoURLs: [],
        clipURL: null,
        clipKind: clip?.kind || null,
        approved: false,
        createdAt: serverTimestamp(),
      };
      // Create the doc first so we have an id to namespace uploads under.
      const docRef = await addDoc(collection(db, "messages"), docData);

      const photoURLs = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        const r = storageRef(storage, `messages/${docRef.id}/photo_${i}_${p.name}`);
        await uploadBytes(r, p);
        photoURLs.push(await getDownloadURL(r));
      }

      let clipURL = null;
      if (clip) {
        const r = storageRef(storage, `messages/${docRef.id}/clip.${clip.ext}`);
        await uploadBytes(r, clip.blob);
        clipURL = await getDownloadURL(r);
      }

      // Patch in the URLs now that uploads are done.
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
              setRelationship("");
              setText("");
              setPhotos([]);
              setClip(null);
              setStatus("idle");
            }}
          >
            {t.addAnother}
          </button>
        </div>
      </main>
    );
  }

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

        <div className="row">
          <label className="field">
            <span>{t.youAreHer}</span>
            <select
              value={generation}
              onChange={(e) => setGeneration(e.target.value)}
            >
              {t.generations.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t.relationshipLabel}</span>
            <input
              value={relationship}
              dir="auto"
              onChange={(e) => setRelationship(e.target.value)}
              placeholder={t.relationshipPlaceholder}
            />
          </label>
        </div>

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
          <span>{t.noteLabel}</span>
          <textarea
            rows={5}
            value={text}
            dir="auto"
            onChange={(e) => setText(e.target.value)}
            placeholder={t.notePlaceholder}
          />
          <small>{t.charsCount(text.trim().length)}</small>
        </label>

        <PhotoPicker photos={photos} setPhotos={setPhotos} />
        <ClipPicker clip={clip} setClip={setClip} />

        {error && <p className="error">{error}</p>}

        <button className="primary" disabled={!canSubmit} onClick={handleSubmit}>
          {status === "saving" ? t.savingBtn : t.submitBtn}
        </button>
      </div>
    </main>
  );
}

function PhotoPicker({ photos, setPhotos }) {
  const { t } = useLang();
  return (
    <label className="field">
      <span>{t.photoLabel}</span>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setPhotos(Array.from(e.target.files).slice(0, 3))}
      />
      {photos.length > 0 && <small>{t.photosSelected(photos.length)}</small>}
    </label>
  );
}

// Lets people either upload a clip recorded on their phone, or record audio
// right here in the browser (great for kids — one big button).
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
        setClip({ blob, ext: "webm", kind: "audio" });
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (e) {
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
    setClip({ blob: file, ext, kind });
  }

  return (
    <div className="field">
      <span>{t.voiceLabel}</span>
      <div className="clip-controls">
        {!recording ? (
          <button type="button" className="record" onClick={startRecording}>
            {t.recordBtn}
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
        <small className="clip-ok">
          {t.clipReady(t.kinds[clip.kind] || clip.kind)}{" "}
          <button type="button" className="link" onClick={() => setClip(null)}>
            {t.remove}
          </button>
        </small>
      )}
    </div>
  );
}
