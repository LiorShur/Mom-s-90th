import { useRef, useState } from "react";
import { useLang } from "./i18n.jsx";
import { blobToWav } from "./audio.js";

// Record in-browser (saved as iOS-friendly WAV) or upload a clip, with a
// listen-back player. `clip` shape: { url, kind, blob?, ext? }.
// A clip with a `blob` is new (to upload); without one it's an existing clip.
export default function ClipPicker({ clip, setClip }) {
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
      rec.onstop = async () => {
        const raw = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        stream.getTracks().forEach((tr) => tr.stop());
        try {
          // Convert to WAV so it plays on iOS Safari (WebM/Opus does not).
          const wav = await blobToWav(raw);
          setClip({ blob: wav, ext: "wav", kind: "audio", url: URL.createObjectURL(wav) });
        } catch {
          setClip({ blob: raw, ext: "webm", kind: "audio", url: URL.createObjectURL(raw) });
        }
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
