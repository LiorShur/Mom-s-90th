import { useLang } from "./i18n.jsx";

// A small, always-visible pill that flips the whole app between Hebrew and
// English. Sits in the top corner (start side) of every view.
export default function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label="Language / שפה">
      <button
        type="button"
        className={lang === "he" ? "on" : ""}
        onClick={() => setLang("he")}
        aria-pressed={lang === "he"}
      >
        עברית
      </button>
      <button
        type="button"
        className={lang === "en" ? "on" : ""}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
      >
        English
      </button>
    </div>
  );
}
