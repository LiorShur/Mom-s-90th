import { useRef, useState } from "react";
import { useLang } from "./i18n.jsx";
import { blobToWav } from "./audio.js";

// Record in-browser (saved as iOS-friendly WAV) or upload a clip, with a
// listen-back player. `clip` shape: { url, kind, blob?, ext? }.
// A clip with a `blob` is new (to upload); without one it's an existing clip.
export default function ClipPicker({ clip, setClip, label }) {
  const { t } = useLang();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
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
          // Convert to WAV (iOS-friendly) and trim leading silence so it
          // starts promptly on play.
          const wav = await blobToWav(raw, { trimSilence: true });
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
  async function onUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop() || "dat";
    const kind = file.type.startsWith("video") ? "video" : "audio";
    if (kind === "audio") {
      // Re-encode the uploaded audio to WAV and trim the leading silence so it
      // plays straight away. Fall back to the original file if anything fails.
      setBusy(true);
      try {
        const wav = await blobToWav(file, { trimSilence: true });
        setClip({ blob: wav, ext: "wav", kind: "audio", url: URL.createObjectURL(wav) });
      } catch {
        setClip({ blob: file, ext, kind, url: URL.createObjectURL(file) });
      } finally {
        setBusy(false);
      }
      return;
    }
    setClip({ blob: file, ext, kind, url: URL.createObjectURL(file) });
  }

  return (
    <div className="field">
      <span>{label || t.voiceLabel}</span>
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
        {busy && <span className="or">{t.processingAudio}</span>}
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
