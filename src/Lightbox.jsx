import { useEffect, useRef } from "react";

// Full-screen photo viewer with prev/next, keyboard arrows, Esc, swipe.
export default function Lightbox({ srcs, index, onIndex, onClose }) {
  const touch = useRef(null);
  const n = srcs.length;
  const go = (d) => onIndex((index + d + n) % n);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    // lock background scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, n]);

  function onTouchStart(e) {
    touch.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) > 50 && n > 1) go(dx < 0 ? 1 : -1);
  }

  return (
    <div
      className="lightbox"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button className="lb-close" onClick={onClose} aria-label="Close">✕</button>
      {n > 1 && (
        <button
          className="lb-nav lb-prev"
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          aria-label="Previous"
        >‹</button>
      )}
      <img
        className="lb-img"
        src={srcs[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
      />
      {n > 1 && (
        <button
          className="lb-nav lb-next"
          onClick={(e) => { e.stopPropagation(); go(1); }}
          aria-label="Next"
        >›</button>
      )}
      {n > 1 && <span className="lb-count">{index + 1} / {n}</span>}
    </div>
  );
}
