import { createContext, useContext, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// i18n.jsx — tiny bilingual layer (Hebrew default + English), no dependency.
// Hebrew is the default language and the app opens right-to-left; a visible
// toggle flips to English (left-to-right). The choice is remembered.
// ---------------------------------------------------------------------------

const STRINGS = {
  he: {
    _dir: "rtl",
    _name: "עברית",
    appTitle: "ספר הקולות",
    forGrandma: "לכבוד יום ההולדת ה-90 של סבתא",

    // Submit — masthead
    submitLede:
      "אנחנו מכינים מזכרת מכולנו — ילדים, נכדים ונינים. השאירו כמה מילים, ואם אפשר גם כמה שניות מהקול שלכם. לשמוע אתכם יהיה בשבילה העולם כולו.",

    // Submit — form
    nameLabel: "השם שלך",
    namePlaceholder: "למשל: שרה",
    youAreHer: "מה הקשר שלך אליה?",
    relationshipLabel: "במדויק (לא חובה)",
    relationshipPlaceholder: "למשל: הנכדה הבכורה",
    promptLabel: "בחרו שאלה לענות עליה",
    noteLabel: "המילים שלך לעמוד",
    notePlaceholder: "כתבו את זה כמו שהייתם אומרים לה…",
    charsCount: (n) => `${n} תווים`,
    pullQuoteLabel: "משפט אחד גדול לעמוד (לא חובה)",
    pullQuotePlaceholder: "למשל: את המקום הבטוח שלי",
    photoLabel: "תמונות (עד 4) — הראשונה היא התמונה הגדולה איתה; עד 3 נוספות לעמוד הקולאז'",
    photosSelected: (n) => (n === 1 ? "תמונה אחת נבחרה" : `${n} תמונות נבחרו`),
    voiceLabel: "הקול שלך (החלק שהיא הכי תאהב)",
    recordBtn: "● הקלטת קול",
    stopBtn: "■ עצירה",
    or: "או",
    uploadBtn: "העלאת אודיו / וידאו",
    micError: "לא הצלחנו לגשת למיקרופון. אפשר להעלות קובץ במקום.",
    clipReady: (kind) => `✓ קטע ${kind} מוכן`,
    remove: "הסרה",
    submitBtn: "הוספה לספר",
    savingBtn: "שומר…",
    genericError: "משהו השתבש.",

    // Submit — thank-you
    thanksKicker: "התקבל באהבה",
    thanksTitle: (first) => `תודה, ${first}.`,
    thanksLede:
      "המילים שלך והקול שלך הם עכשיו חלק מהספר. היא תוקיר אותם מאוד.",
    addAnother: "הוספה בשם מישהו אחר",

    // MessageView (the QR page)
    opening: "פותח…",
    missing: "לא הצלחנו למצוא את העמוד הזה בספר.",
    pressPlay: (first) => `▶ לחצו על נגן כדי לשמוע את ${first}`,

    // Gallery (organizer)
    organizerKicker: "תצוגת מארגן",
    checkingAuth: "בודק הרשאות…",
    reviewSignInTitle: "כניסת מארגן",
    reviewSignInLede:
      "כדי לצפות בהגשות ולאשר אותן, היכנסו עם חשבון ה-Google של המארגן.",
    signInBtn: "כניסה עם Google",
    signOutBtn: "התנתקות",
    notOrganizer: (email) =>
      `החשבון ${email} אינו חשבון המארגן. התנתקו ונסו שוב עם החשבון הנכון.`,
    submissionsTitle: "ההגשות",
    galleryLede: (n, m) =>
      `${n} התקבלו · ${m} אושרו. אשרו את אלה שתרצו בספר, ואז הדפיסו את גיליון ה-QR כדי לשבץ את הקודים בעיצוב הספר.`,
    printProofBtn: "הדפסת דפי הספר (תמונה + טקסט + QR)",
    printBtn: "גיליון QR בלבד",
    viewBookBtn: "תצוגת ספר אונליין",
    backToList: "חזרה לרשימה",
    shareBtn: "העתקת קישור הספר",
    linkCopied: "הקישור הועתק! ✓",
    bookWelcome: "גללו בין הדפים — והקישו על נגן כדי לשמוע כל קול",
    bookCredits: "נעשה באהבה על ידי כל המשפחה",
    scanToHear: "סרקו עם מצלמת הטלפון כדי לשמוע אותנו",
    styleLabel: "סגנון",
    styles: { luxury: "יוקרתי", modern: "מודרני", vintage: "וינטג'" },
    bookCoverTitle: "חוגגים 90 שנות אהבה",
    bookCoverSubtitle: "ספר של זיכרונות, מסרים ורגעים מכל מי שאוהב אותך",
    bookScanAudio: "סרקו כדי לשמוע את המסר שלי",
    bookScanVideo: "סרקו לצפייה בסרטון שלי",
    bookHeartCaption: "פיסה קטנה מהלב שלי",
    bookClosing: "תודה שאת הלב של המשפחה שלנו",
    noVoice: "אין קול",
    downloadQR: "הורדת QR",
    approveBtn: "אישור לספר",
    approvedBtn: "✓ אושר — ביטול",
    loading: "טוען הגשות…",
    qrSheetTitle: "קודי QR — ספר הקולות",

    kinds: { audio: "אודיו", video: "וידאו" },

    prompts: [
      "זיכרון שרק לי יש ממך",
      "משהו שלימדת אותי בלי לכוון",
      "מטבע לשון שלך שאני עדיין משתמש/ת בו",
      "הדבר הראשון שעולה לי בראש כשאני חושב/ת עליך",
      "מה הייתי רוצה שהילדים שלי ידעו עליך",
      "פעם שגרמת לי לצחוק",
      "אכתוב משלי",
    ],
    generations: [
      { value: "child", label: "הבן / הבת שלה" },
      { value: "grandchild", label: "נכד / נכדה" },
      { value: "greatgrand", label: "נין / נינה" },
      { value: "other", label: "בן משפחה / חבר" },
    ],
    genHeads: {
      child: "הילדים שלה",
      grandchild: "הנכדים",
      greatgrand: "הנינים",
      other: "משפחה וחברים",
    },
  },

  en: {
    _dir: "ltr",
    _name: "English",
    appTitle: "A Book of Voices",
    forGrandma: "For Grandma's 90th",

    submitLede:
      "We're making a keepsake from all of us — children, grandchildren and great-grandchildren. Leave a short note and, if you can, a few seconds of your actual voice. Hearing you will mean the world to her.",

    nameLabel: "Your name",
    namePlaceholder: "e.g. Sarah",
    youAreHer: "You are her…",
    relationshipLabel: "Exactly (optional)",
    relationshipPlaceholder: "e.g. eldest granddaughter",
    promptLabel: "Pick a prompt to answer",
    noteLabel: "Your note for the page",
    notePlaceholder: "Write it the way you'd say it to her…",
    charsCount: (n) => `${n} characters`,
    pullQuoteLabel: "One big line for the page (optional)",
    pullQuotePlaceholder: "e.g. You are my safe place",
    photoLabel: "Photos (up to 4) — the first is your big photo with her; up to 3 more for the collage page",
    photosSelected: (n) => `${n} photo${n > 1 ? "s" : ""} selected`,
    voiceLabel: "Your voice (the part she'll love most)",
    recordBtn: "● Record audio",
    stopBtn: "■ Stop",
    or: "or",
    uploadBtn: "Upload audio / video",
    micError: "Couldn't access the microphone. You can upload a clip instead.",
    clipReady: (kind) => `✓ ${kind} clip ready`,
    remove: "remove",
    submitBtn: "Add to the book",
    savingBtn: "Saving…",
    genericError: "Something went wrong.",

    thanksKicker: "Received with love",
    thanksTitle: (first) => `Thank you, ${first}.`,
    thanksLede:
      "Your words and your voice are now part of the book. She's going to treasure them.",
    addAnother: "Add another from someone else",

    opening: "Opening…",
    missing: "This page of the book couldn't be found.",
    pressPlay: (first) => `▶ Press play to hear ${first}`,

    organizerKicker: "Organizer view",
    checkingAuth: "Checking access…",
    reviewSignInTitle: "Organizer sign-in",
    reviewSignInLede:
      "To review and approve submissions, sign in with the organizer's Google account.",
    signInBtn: "Sign in with Google",
    signOutBtn: "Sign out",
    notOrganizer: (email) =>
      `${email} isn't the organizer account. Sign out and try again with the right one.`,
    submissionsTitle: "The submissions",
    galleryLede: (n, m) =>
      `${n} received · ${m} approved. Approve the ones you want in the book, then print the QR sheet to drop codes into your photobook layout.`,
    printProofBtn: "Print book pages (photo + note + QR)",
    printBtn: "QR sheet only",
    viewBookBtn: "View as online book",
    backToList: "Back to list",
    shareBtn: "Copy book link",
    linkCopied: "Link copied! ✓",
    bookWelcome: "Scroll through the pages — and tap play to hear each voice",
    bookCredits: "Made with love by the whole family",
    scanToHear: "Scan with your phone camera to hear us",
    styleLabel: "Style",
    styles: { luxury: "Luxury", modern: "Modern", vintage: "Vintage" },
    bookCoverTitle: "Celebrating 90 Years of Love",
    bookCoverSubtitle:
      "A book of memories, messages & moments from the people who love you most",
    bookScanAudio: "Scan to hear my message",
    bookScanVideo: "Scan to watch my video",
    bookHeartCaption: "A little piece of my heart",
    bookClosing: "Thank you for being the heart of our family",
    noVoice: "no voice",
    downloadQR: "Download QR",
    approveBtn: "Approve for book",
    approvedBtn: "✓ Approved — undo",
    loading: "Loading submissions…",
    qrSheetTitle: "QR codes — A Book of Voices",

    kinds: { audio: "audio", video: "video" },

    prompts: [
      "A memory only I have of you",
      "Something you taught me without meaning to",
      "A saying of yours I still use",
      "The first thing I picture when I think of you",
      "What I want my own children to know about you",
      "A time you made me laugh",
      "I'll write my own",
    ],
    generations: [
      { value: "child", label: "Your child" },
      { value: "grandchild", label: "Grandchild" },
      { value: "greatgrand", label: "Great-grandchild" },
      { value: "other", label: "Family / friend" },
    ],
    genHeads: {
      child: "Her children",
      grandchild: "Grandchildren",
      greatgrand: "Great-grandchildren",
      other: "Family & friends",
    },
  },
};

const DEFAULT_LANG = "he";
const LangContext = createContext(null);

function readStoredLang() {
  try {
    const saved = localStorage.getItem("lang");
    if (saved === "he" || saved === "en") return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);
  const t = STRINGS[lang];

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", lang);
    root.setAttribute("dir", t._dir);
    document.title = t.appTitle;
    try {
      localStorage.setItem("lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang, t]);

  const setLang = (next) => setLangState(next);

  return (
    <LangContext.Provider value={{ lang, setLang, t, dir: t._dir }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within <LanguageProvider>");
  return ctx;
}

// Map a stored clip kind ("audio"/"video") to the current language label.
export function kindLabel(t, kind) {
  return t.kinds[kind] || kind;
}
