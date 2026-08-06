import { useRef, useState } from "react";
import { useLang } from "./i18n.jsx";
import { floatFx, frameStyle, cropStyle } from "./book.jsx";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Drag-to-arrange editor for the right page's floating collage photos.
// Photos can be moved (drag), resized, rotated, shadowed, cropped (zoom/pan)
// and given a white border (tilt) — and they can overlap freely.
export default function CollageEditor({ photoURLs, fx, setFx, style }) {
  const { t } = useLang();
  const canvasRef = useRef(null);
  const [sel, setSel] = useState(null); // selected slot index (1,2,3)

  const items = [1, 2, 3]
    .map((slot) => ({ slot, url: photoURLs[slot] }))
    .filter((x) => x.url);

  const get = (slot) => floatFx(fx[slot], slot - 1);
  function update(slot, patch) {
    setFx(fx.map((f, i) => (i === slot ? { ...get(slot), ...patch } : f)));
  }

  function startDrag(e, slot) {
    e.preventDefault();
    setSel(slot);
    const rect = canvasRef.current.getBoundingClientRect();
    const f0 = get(slot);
    const sx = e.clientX;
    const sy = e.clientY;
    const move = (ev) => {
      const dx = ((ev.clientX - sx) / rect.width) * 100;
      const dy = ((ev.clientY - sy) / rect.height) * 100;
      update(slot, { x: clamp(f0.x + dx, -15, 95), y: clamp(f0.y + dy, -15, 95) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startResize(e, slot) {
    e.preventDefault();
    e.stopPropagation();
    setSel(slot);
    const rect = canvasRef.current.getBoundingClientRect();
    const f0 = get(slot);
    const sx = e.clientX;
    const sy = e.clientY;
    const move = (ev) => {
      const d = (((ev.clientX - sx) + (ev.clientY - sy)) / 2 / rect.width) * 100;
      update(slot, { w: clamp(f0.w + d, 12, 92) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function bringFront(slot) {
    const maxZ = Math.max(0, ...[1, 2, 3].map((s) => get(s).z));
    update(slot, { z: maxZ + 1 });
  }
  function sendBack(slot) {
    const minZ = Math.min(0, ...[1, 2, 3].map((s) => get(s).z));
    update(slot, { z: minZ - 1 });
  }

  if (items.length === 0) return null;
  const f = sel != null ? get(sel) : null;

  return (
    <div className="collage-editor">
      <p className="slots-hint">{t.collageHint}</p>
      <div className={`collage-canvas book style-${style}`} ref={canvasRef}>
        {items.map(({ slot, url }) => (
          <div
            key={slot}
            className={`pr-float ${get(slot).tilt ? "tilted" : ""} ${get(slot).fit ? "fit" : ""} ${sel === slot ? "sel" : ""}`}
            style={frameStyle(get(slot))}
            onPointerDown={(e) => startDrag(e, slot)}
          >
            <img src={url} alt="" style={get(slot).fit ? undefined : cropStyle(get(slot))} draggable="false" />
            {sel === slot && (
              <span
                className="cc-handle"
                onPointerDown={(e) => startResize(e, slot)}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
        <div className="cc-qr" aria-hidden="true">🔊<br />QR</div>
      </div>

      {sel != null && (
        <div className="cc-controls">
          <label>{t.fxSize}
            <input type="range" min="20" max="80" value={f.w}
              onChange={(e) => update(sel, { w: +e.target.value })} />
          </label>
          <label>{t.fxRotate}
            <input type="range" min="-30" max="30" value={f.rot}
              onChange={(e) => update(sel, { rot: +e.target.value })} />
          </label>
          <label>{t.fxShadow}
            <input type="range" min="0" max="60" value={f.shadow}
              onChange={(e) => update(sel, { shadow: +e.target.value })} />
          </label>
          <label>{t.fxZoom}
            <input type="range" min="0.4" max="3" step="0.05" value={f.zoom}
              disabled={f.fit}
              onChange={(e) => update(sel, { zoom: +e.target.value })} />
          </label>
          <label>{t.fxPanX}
            <input type="range" min="0" max="100" value={f.ox}
              onChange={(e) => update(sel, { ox: +e.target.value })} />
          </label>
          <label>{t.fxPanY}
            <input type="range" min="0" max="100" value={f.oy}
              onChange={(e) => update(sel, { oy: +e.target.value })} />
          </label>
          <label className="fx-toggle">
            <input type="checkbox" checked={f.tilt}
              onChange={(e) => update(sel, { tilt: e.target.checked })} />
            {t.fxTilt}
          </label>
          <label className="fx-toggle">
            <input type="checkbox" checked={f.fit}
              onChange={(e) => update(sel, { fit: e.target.checked })} />
            {t.fxFit}
          </label>
          <div className="cc-order">
            <button type="button" className="ghost" onClick={() => bringFront(sel)}>
              {t.bringFront}
            </button>
            <button type="button" className="ghost" onClick={() => sendBack(sel)}>
              {t.sendBack}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
