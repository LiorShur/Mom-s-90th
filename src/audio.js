// Convert a recorded audio Blob (e.g. WebM/Opus from Chrome, MP4/AAC from iOS)
// into a WAV blob, which plays on iOS Safari AND Android/Chrome. Mono, 22.05kHz
// to keep the file small. Falls back to the original blob if anything fails.

function encodeWav(channelData, sampleRate) {
  const n = channelData.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);
  const writeStr = (off, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, n * 2, true);
  let off = 44;
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Blob([view], { type: "audio/wav" });
}

export async function blobToWav(blob) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new Error("no AudioContext");
  const arrayBuf = await blob.arrayBuffer();
  const ctx = new AudioCtx();
  const decoded = await ctx.decodeAudioData(arrayBuf);
  ctx.close();

  const targetRate = 22050;
  const length = Math.max(1, Math.round(decoded.duration * targetRate));
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const offline = new Offline(1, length, targetRate); // 1 = mono
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return encodeWav(rendered.getChannelData(0), targetRate);
}
