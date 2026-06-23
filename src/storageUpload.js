import { storage } from "./firebase.js";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

function sanitize(name = "file") {
  return name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-40);
}

// Upload one file with progress callbacks (bytesTransferred, totalBytes).
export function uploadFileResumable(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef(storage, path), file);
    task.on(
      "state_changed",
      (snap) => onProgress && onProgress(snap.bytesTransferred, snap.totalBytes),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  });
}

// Upload a batch (photos + an optional clip) under messages/<docId>/, reporting
// an aggregate percentage and a rough seconds-remaining estimate.
// items: [{ kind: 'photo'|'clip', index?, ext?, file }]
export async function uploadAll(items, docId, onProgress) {
  const total = items.reduce((s, i) => s + (i.file.size || 0), 0) || 1;
  const done = new Array(items.length).fill(0);
  const startedAt = Date.now();
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const path =
      it.kind === "clip" || it.kind === "textaudio"
        ? `messages/${docId}/${it.kind}_${Date.now()}.${it.ext}`
        : `messages/${docId}/${it.kind}_${it.index ?? "x"}_${Date.now()}_${sanitize(it.file.name)}`;
    const url = await uploadFileResumable(path, it.file, (bt) => {
      done[i] = bt;
      const sum = done.reduce((a, b) => a + b, 0);
      const pct = Math.min(99, Math.round((sum / total) * 100));
      const elapsed = (Date.now() - startedAt) / 1000;
      const rate = elapsed > 0 ? sum / elapsed : 0;
      const eta = rate > 0 ? Math.max(1, Math.round((total - sum) / rate)) : null;
      onProgress && onProgress(pct, eta);
    });
    results.push({ ...it, url });
  }
  onProgress && onProgress(100, 0);
  return results;
}
