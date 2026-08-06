import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "./i18n.jsx";

// ---------------------------------------------------------------------------
// PhotoCropper.jsx — frame a photo for the page without losing any of it.
//
// The frame is square. Zoom = 1 means the WHOLE image fits inside the frame
// (nothing cropped — short side is letterboxed onto white). Zooming in past
// that lets you crop and reposition to taste. Crucially, you can always zoom
// back out to 1 and every edge of the original comes back — which is the bug
// the old "cover-only" frame could never undo.
//
// The framed result is rendered to a square canvas and handed up as a JPEG
// blob, so what the contributor sees is exactly what gets stored.
// ---------------------------------------------------------------------------

const OUT_SIZE = 1024; // px, square output
const COMMIT_DELAY = 150; // ms debounce before we re-render the blob

export default function PhotoCropper({ file, onChange, onRemove }) {
  const { t } = useLang();
  const frameRef = useRef(null);
  const imgRef = useRef(null); // decoded HTMLImageElement (source pixels)
  const dragRef = useRef(null);
  const commitRef = useRef(null);

  const [srcUrl, setSrcUrl] = useState(null);
  const [dims, setDims] = useState(null); // { iw, ih }
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(3);
  const [off, setOff] = useState({ x: 0, y: 0 }); // fraction of frame, from center

  // Decode the source once. Default the zoom to "fill the frame" so the photo
  // looks full-bleed on arrival, but the slider can always go back down to 1.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrcUrl(url);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      setDims({ iw, ih });
      const coverZoom = Math.max(iw, ih) / Math.min(iw, ih); // fills the square
      setMaxZoom(Math.max(3, coverZoom * 1.5));
      setZoom(coverZoom);
      setOff({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // At zoom 1 the longest side equals the frame; the short side is a fraction.
  const baseW = dims ? (dims.iw >= dims.ih ? 1 : dims.iw / dims.ih) : 1;
  const baseH = dims ? (dims.ih >= dims.iw ? 1 : dims.ih / dims.iw) : 1;
  const fracW = baseW * zoom;
  const fracH = baseH * zoom;

  // Keep the image from sliding off into empty space: when it fills an axis you
  // can pan within the overflow; when it doesn't, it stays centered on that axis.
  const clamp = useCallback(
    (o) => {
      const limX = fracW > 1 ? (fracW - 1) / 2 : 0;
      const limY = fracH > 1 ? (fracH - 1) / 2 : 0;
      return {
        x: Math.max(-limX, Math.min(limX, o.x)),
        y: Math.max(-limY, Math.min(limY, o.y)),
      };
    },
    [fracW, fracH]
  );

  const cOff = clamp(off);

  // Render the framed crop to a canvas and hand the blob up.
  const render = useCallback(() => {
    const img = imgRef.current;
    if (!img || !dims) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT_SIZE;
    canvas.height = OUT_SIZE;
    const ctx = canvas.getContext("2d");
    // White matte fills any letterboxed area (prints clean in the book).
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUT_SIZE, OUT_SIZE);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const c = clamp(off);
    const dw = fracW * OUT_SIZE;
    const dh = fracH * OUT_SIZE;
    const left = OUT_SIZE / 2 + c.x * OUT_SIZE - dw / 2;
    const top = OUT_SIZE / 2 + c.y * OUT_SIZE - dh / 2;
    ctx.drawImage(img, left, top, dw, dh);
    canvas.toBlob(
      (blob) => {
        if (blob) onChange(blob);
      },
      "image/jpeg",
      0.9
    );
  }, [dims, off, fracW, fracH, clamp, onChange]);

  // Re-render the blob shortly after the framing settles (debounced so dragging
  // and sliding don't thrash the encoder).
  useEffect(() => {
    if (!dims) return;
    clearTimeout(commitRef.current);
    commitRef.current = setTimeout(render, COMMIT_DELAY);
    return () => clearTimeout(commitRef.current);
  }, [dims, render]);

  function onPointerDown(e) {
    if (!dims) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, start: cOff };
  }
  function onPointerMove(e) {
    if (!dragRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.x) / rect.width;
    const dy = (e.clientY - dragRef.current.y) / rect.height;
    setOff(
      clamp({ x: dragRef.current.start.x + dx, y: dragRef.current.start.y + dy })
    );
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  const canPan = fracW > 1 || fracH > 1;

  return (
    <div className="cropper">
      <div
        ref={frameRef}
        className={`cropper-frame${canPan ? " grab" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {srcUrl && (
          <img
            src={srcUrl}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              width: `${fracW * 100}%`,
              height: `${fracH * 100}%`,
              left: `${(0.5 + cOff.x - fracW / 2) * 100}%`,
              top: `${(0.5 + cOff.y - fracH / 2) * 100}%`,
            }}
          />
        )}
      </div>

      <div className="cropper-controls">
        <input
          type="range"
          min={1}
          max={maxZoom}
          step="0.01"
          value={zoom}
          aria-label={t.zoomLabel}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        {onRemove && (
          <button type="button" className="link" onClick={onRemove}>
            {t.remove}
          </button>
        )}
      </div>
      <small className="cropper-hint">{t.photoAdjustHint}</small>
    </div>
  );
}
