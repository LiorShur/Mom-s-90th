import { shadowCss } from "./book.jsx";
import { FONTS } from "./bookStyle.jsx";

// Style for a free-placed life item (photo or text) — position/size/rotation
// in %, plus per-type styling.
export function itemStyle(it) {
  // A "background" photo fills the whole spread (cover) and sits behind the rest.
  if (it.type === "photo" && it.bg) {
    return { position: "absolute", left: 0, top: 0, width: "100%", height: "100%", zIndex: it.z ?? -1 };
  }
  const base = {
    position: "absolute",
    left: `${it.x}%`,
    top: `${it.y}%`,
    width: `${it.w}%`,
    transform: `rotate(${it.rot || 0}deg)`,
    zIndex: it.z || 0,
  };
  if (it.type === "text") {
    return {
      ...base,
      fontFamily: FONTS[it.font] || FONTS.serif,
      fontSize: `${it.size}cm`,
      color: it.color || "#2b2622",
      fontWeight: it.bold ? 700 : 400,
    };
  }
  return { ...base, boxShadow: shadowCss(it.shadow) };
}

// One life spread (58×29 cm layflat) with its photos and text laid out freely.
export function LifeSpread({ items }) {
  return (
    <section className="life-spread">
      {(items || []).map((it) =>
        it.type === "text" ? (
          <div className="life-text" key={it.id} style={itemStyle(it)} dir="auto">
            {it.text}
          </div>
        ) : (
          <div className={`life-float ${it.bg ? "bg" : ""}`} key={it.id} style={itemStyle(it)}>
            <img src={it.url} alt="" />
          </div>
        )
      )}
    </section>
  );
}
