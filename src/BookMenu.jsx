import { useEffect, useState } from "react";
import { useLang } from "./i18n.jsx";

// A floating "contents" menu (hamburger) for the online book. Lists each
// section — every family member by name, plus the sing-along — and jumps to
// it on tap. Slides in from the start side (right in Hebrew/RTL, left in LTR).
export default function BookMenu({ entries, onJump }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!entries.length) return null;

  const go = (id) => {
    setOpen(false);
    onJump(id);
  };

  return (
    <>
      <button
        type="button"
        className="book-menu-btn"
        aria-label={t.bookMenuOpen}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bm-bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>

      {open && <div className="book-menu-backdrop" onClick={() => setOpen(false)} />}

      <nav
        className={`book-menu-panel ${open ? "open" : ""}`}
        aria-label={t.bookMenuTitle}
        aria-hidden={!open}
      >
        <div className="bm-head">
          <span className="bm-title">{t.bookMenuTitle}</span>
          <button
            type="button"
            className="bm-close"
            aria-label={t.bookMenuClose}
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>
        <ul className="bm-list">
          {entries.map((e) => (
            <li key={e.id}>
              <button type="button" className="bm-link" dir="auto" onClick={() => go(e.id)}>
                {e.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
