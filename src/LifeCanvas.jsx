import { useRef, useState } from "react";
import { useLang } from "./i18n.jsx";
import { useBookVars, FONTS } from "./bookStyle.jsx";
import { FitBox, SPREAD_PX, PAGE_PX } from "./book.jsx";
import { itemStyle } from "./LifeAlbum.jsx";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Free-form editor for ONE life spread (58×29). Drag to move, drag the corner
// to resize, plus per-item controls (rotate, shadow/size, font/colour for text,
// front/back, remove). Photos and text are both free-placed.
export default function LifeCanvas({ items, setItems, style }) {
  const { t } = useLang();
  const vars = useBookVars();
  const canvasRef = useRef(null);
  const [sel, setSel] = useState(null);

  const item = items.find((i) => i.id === sel) || null;
  const update = (id, patch) =>
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id) => {
    setItems(items.filter((i) => i.id !== id));
    setSel(null);
  };
  const fg = () => items.filter((i) => !i.bg).map((i) => i.z || 0); // non-bg z's
  const bringFront = (id) => update(id, { z: Math.max(0, ...fg()) + 1 });
  const sendBack = (id) => update(id, { z: Math.min(0, ...fg()) - 1 });
  const setBg = (id, on) => update(id, { bg: on, z: on ? -1000 : 0 });

  function startDrag(e, id) {
    e.preventDefault();
    setSel(id);
    const rect = canvasRef.current.getBoundingClientRect();
    const it = items.find((i) => i.id === id);
    const sx = e.clientX, sy = e.clientY, x0 = it.x, y0 = it.y;
    const move = (ev) => {
      const dx = ((ev.clientX - sx) / rect.width) * 100;
      const dy = ((ev.clientY - sy) / rect.height) * 100;
      update(id, { x: clamp(x0 + dx, -15, 98), y: clamp(y0 + dy, -15, 96) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startResize(e, id) {
    e.preventDefault();
    e.stopPropagation();
    setSel(id);
    const rect = canvasRef.current.getBoundingClientRect();
    const it = items.find((i) => i.id === id);
    const sx = e.clientX, w0 = it.w;
    const move = (ev) => {
      const dw = ((ev.clientX - sx) / rect.width) * 100;
      update(id, { w: clamp(w0 - dw, 4, 90) }); // RTL: drag the inner (left) corner
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className="life-canvas">
      <FitBox w={SPREAD_PX} h={PAGE_PX} maxWidth={760}>
        <div className={`book style-${style} life-spread editing`} style={vars} ref={canvasRef}>
          {items.map((it) => {
            const on = sel === it.id;
            const handle = on && (
              <span className="cc-handle" onPointerDown={(e) => startResize(e, it.id)} />
            );
            return it.type === "text" ? (
              <div
                key={it.id}
                className={`life-text ${on ? "sel" : ""}`}
                style={itemStyle(it)}
                dir="auto"
                onPointerDown={(e) => startDrag(e, it.id)}
              >
                {it.text || " "}
                {handle}
              </div>
            ) : (
              <div
                key={it.id}
                className={`life-float ${it.bg ? "bg" : ""} ${on ? "sel" : ""}`}
                style={itemStyle(it)}
                onPointerDown={(e) => startDrag(e, it.id)}
              >
                <img src={it.url} alt="" draggable="false" />
                {!it.bg && handle}
              </div>
            );
          })}
        </div>
      </FitBox>

      {item && (
        <div className="cc-controls">
          {item.type === "text" && (
            <>
              <label className="cc-wide">{t.lifeTextLabel}
                <input value={item.text} dir="auto"
                  onChange={(e) => update(item.id, { text: e.target.value })} />
              </label>
              <label>{t.fontLabel}
                <select value={item.font}
                  onChange={(e) => update(item.id, { font: e.target.value })}>
                  {Object.keys(FONTS).map((f) => (
                    <option key={f} value={f}>{t.fontNames[f]}</option>
                  ))}
                </select>
              </label>
              <label>{t.fxColor}
                <input type="color" value={item.color || "#2b2622"}
                  onChange={(e) => update(item.id, { color: e.target.value })} />
              </label>
              <label className="fx-toggle">
                <input type="checkbox" checked={!!item.bold}
                  onChange={(e) => update(item.id, { bold: e.target.checked })} />
                {t.boldLabel}
              </label>
            </>
          )}
          {item.type === "photo" && (
            <label className="fx-toggle">
              <input type="checkbox" checked={!!item.bg}
                onChange={(e) => setBg(item.id, e.target.checked)} />
              {t.fxBg}
            </label>
          )}
          {!(item.type === "photo" && item.bg) && (
            <>
              <label>{t.fxSize}
                <input type="range"
                  min={item.type === "text" ? 0.6 : 6}
                  max={item.type === "text" ? 6 : 130}
                  step={item.type === "text" ? 0.1 : 1}
                  value={item.type === "text" ? item.size : item.w}
                  onChange={(e) =>
                    update(item.id, item.type === "text"
                      ? { size: +e.target.value }
                      : { w: +e.target.value })
                  } />
              </label>
              <label>{t.fxRotate}
                <input type="range" min="-30" max="30" value={item.rot || 0}
                  onChange={(e) => update(item.id, { rot: +e.target.value })} />
              </label>
              {item.type === "photo" && (
                <label>{t.fxShadow}
                  <input type="range" min="0" max="60" value={item.shadow || 0}
                    onChange={(e) => update(item.id, { shadow: +e.target.value })} />
                </label>
              )}
            </>
          )}
          <div className="cc-order">
            <button type="button" className="ghost" onClick={() => bringFront(item.id)}>{t.bringFront}</button>
            <button type="button" className="ghost" onClick={() => sendBack(item.id)}>{t.sendBack}</button>
            <button type="button" className="ghost" onClick={() => remove(item.id)}>✕ {t.remove}</button>
          </div>
        </div>
      )}
    </div>
  );
}
