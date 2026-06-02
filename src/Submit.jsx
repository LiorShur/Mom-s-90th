import { useRef, useState } from "react";
import { db, storage, ensureSignedIn } from "./firebase.js";
import { collection, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// Edit this list freely — it's what keeps 20+ notes from sounding identical.
const PROMPTS = [
  "A memory only I have of you",
  "Something you taught me without meaning to",
  "A saying of yours I still use",
  "The first thing I picture when I think of you",
  "What I want my own children to know about you",
  "A time you made me laugh",
  "I'll write my own",
];

const GENERATIONS = [
  { value: "child", label: "Your child" },
  { value: "grandchild", label: "Grandchild" },
  { value: "greatgrand", label: "Great-grandchild" },
  { value: "other", label: "Family / friend" },
];

export default function Submit() {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [generation, setGeneration] = useState("grandchild");
  const [prompt, setPrompt] = useState(PROMPTS[0]);
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
        prompt,
        text: text.trim(),
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
      setError(e.message || "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <main className="page narrow">
        <div className="card thanks">
          <p className="kicker">Received with love</p>
          <h1>Thank you, {name.split(" ")[0]}.</h1>
          <p className="lede">
            Your words and your voice are now part of the book. She's going to
            treasure them.
          </p>
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
            Add another from someone else
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page narrow">
      <header className="masthead">
        <p className="kicker">For Grandma's 90th</p>
        <h1>A Book of Voices</h1>
        <p className="lede">
          We're making a keepsake from all of us — children, grandchildren and
          great-grandchildren. Leave a short note and, if you can, a few seconds
          of your actual voice. Hearing you will mean the world to her.
        </p>
      </header>

      <div className="card">
        <label className="field">
          <span>Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah"
          />
        </label>

        <div className="row">
          <label className="field">
            <span>You are her…</span>
            <select
              value={generation}
              onChange={(e) => setGeneration(e.target.value)}
            >
              {GENERATIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Exactly (optional)</span>
            <input
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. eldest granddaughter"
            />
          </label>
        </div>

        <label className="field">
          <span>Pick a prompt to answer</span>
          <select value={prompt} onChange={(e) => setPrompt(e.target.value)}>
            {PROMPTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Your note for the page</span>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write it the way you'd say it to her…"
          />
          <small>{text.trim().length} characters</small>
        </label>

        <PhotoPicker photos={photos} setPhotos={setPhotos} />
        <ClipPicker clip={clip} setClip={setClip} />

        {error && <p className="error">{error}</p>}

        <button className="primary" disabled={!canSubmit} onClick={handleSubmit}>
          {status === "saving" ? "Saving…" : "Add to the book"}
        </button>
      </div>
    </main>
  );
}

function PhotoPicker({ photos, setPhotos }) {
  return (
    <label className="field">
      <span>A photo or two (optional)</span>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setPhotos(Array.from(e.target.files).slice(0, 3))}
      />
      {photos.length > 0 && (
        <small>
          {photos.length} photo{photos.length > 1 ? "s" : ""} selected
        </small>
      )}
    </label>
  );
}

// Lets people either upload a clip recorded on their phone, or record audio
// right here in the browser (great for kids — one big button).
function ClipPicker({ clip, setClip }) {
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
      alert("Couldn't access the microphone. You can upload a clip instead.");
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
      <span>Your voice (the part she'll love most)</span>
      <div className="clip-controls">
        {!recording ? (
          <button type="button" className="record" onClick={startRecording}>
            ● Record audio
          </button>
        ) : (
          <button type="button" className="record stop" onClick={stopRecording}>
            ■ Stop
          </button>
        )}
        <span className="or">or</span>
        <label className="upload-btn">
          Upload audio / video
          <input type="file" accept="audio/*,video/*" onChange={onUpload} hidden />
        </label>
      </div>
      {clip && (
        <small className="clip-ok">
          ✓ {clip.kind} clip ready{" "}
          <button
            type="button"
            className="link"
            onClick={() => setClip(null)}
          >
            remove
          </button>
        </small>
      )}
    </div>
  );
}
