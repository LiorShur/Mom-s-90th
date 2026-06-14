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
    appTitle: "ספר שכולו אהבה",
    forGrandma: "לכבוד יום ההולדת ה-90 של אמא / סבתא מרים",

    // Submit — masthead
    submitLede:
      "אנחנו מכינים מזכרת מכולנו — ילדים, נכדים ונינים. השאירו כמה מילים, ואם אפשר גם כמה שניות מהקול שלכם. לשמוע אתכם יהיה בשבילה העולם כולו.",

    // Submit — form
    nameLabel: "השם שלך",
    namePlaceholder: "למשל: שמוליק",
    youAreHer: "מה הקשר שלך אליה?",
    generationLabel: "דור (לשימוש פנימי בלבד)",
    relationshipLabel: "במדויק (לא חובה)",
    relationshipPlaceholder: "למשל: הנכדה הבכורה",
    promptLabel: "מספר רעיונות לנושאי כתיבה או הקלטה",
    promptPlaceholder: "פתחו לרעיונות…",
    noteLabel: "המילים שלך לעמוד",
    notePlaceholder: "כתבו את זה כמו שהייתם אומרים לה…",
    charsCount: (n) => `${n} תווים`,
    pullQuoteLabel: "משפט אחד גדול / כותרת",
    pullQuotePlaceholder: "למשל: את המקום הבטוח שלי",
    photoLabel: "תמונות (4) — הראשונה היא התמונה הגדולה איתה; עד 3 נוספות לעמוד הקולאז'",
    photoSlotsLabel: "תמונות — לכל מיקום בעמוד שלכם",
    photoSlotsHint: "ככה ייראה העמוד שלכם: התמונה הראשית מופיעה גדולה ליד המילים שלכם, ועד 3 תמונות נוספות יוצרות קולאז'. לחצו על כל מסגרת כדי להוסיף תמונה.",
    slotPortrait: "תמונה ראשית (העמוד הגדול)",
    slotCollage: (n) => `קולאז' ${n}`,
    textTooLong: "קצת ארוך — כדאי עד כ-600 תווים כדי שייכנס יפה לעמוד",
    uploading: (p) => `מעלה… ${p}%`,
    uploadingEta: (s) => `נותרו ~${s} שניות`,
    clipPreviewHint: "האזינו — ואם לא מרוצים, הקליטו שוב",
    recordAgain: "● הקלטה מחדש",
    editBtn: "עריכה",
    saveBtn: "שמירה",
    cancelBtn: "ביטול",
    fxTilt: "מסגרת לבנה",
    fxRotate: "סיבוב",
    fxZoom: "זום",
    fxPanX: "אופקי",
    fxPanY: "אנכי",
    fxSize: "גודל",
    fxShadow: "צל",
    fxFit: "להציג את כל התמונה",
    mainPhotoTitle: "התמונה הראשית",
    collageTitle: "תמונות הקולאז' (גררו לסידור)",
    collageHint: "גררו את התמונות כדי לסדר אותן — הן יכולות לחפוף. לחצו על תמונה כדי לכוונן, וגררו את הפינה כדי לשנות גודל.",
    bringFront: "להביא קדימה",
    sendBack: "לשלוח לאחור",
    mainPreviewTitle: "תצוגה מקדימה של העמוד",
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
    arrangeBtn: "סידור סדר העמודים",
    arrangeHint: "השתמשו בחיצים כדי לקבוע את סדר העמודים בספר. רק עמודים מאושרים ייכללו בספר.",
    backToList: "חזרה לרשימה",
    exportImagesBtn: "הורדת תמונות",
    exportPages: "עמודים בודדים (30×30)",
    exportSpread: "כפולות רצופות (58×29)",
    exportSpreadFramed: "כפולות עם מסגרת (58×29)",
    exportingN: (i, n) => `מייצא… ${i}/${n}`,
    exportError: "הייצוא נכשל. ודאו שהגדרתם CORS ל-Storage (ראו README).",
    shareBtn: "העתקת קישור הספר",
    linkCopied: "הקישור הועתק! ✓",
    bookWelcome: "גללו בין הדפים — והקישו על נגן כדי לשמוע כל קול",
    bookCredits: "נעשה באהבה על ידי כל המשפחה",
    scanToHear: "סרקו עם מצלמת הטלפון כדי לשמוע אותנו",
    styleLabel: "סגנון",
    styles: { luxury: "יוקרתי", modern: "מודרני", vintage: "וינטג'" },
    textStyleBtn: "עיצוב טקסט",
    fontLabel: "גופן",
    boldLabel: "מודגש",
    sizeLabel: "גודל",
    textRoles: { name: "שם", quote: "המשפט הגדול", body: "הטקסט הארוך", sign: "חתימה" },
    fontNames: { handwriting: "כתב יד", script: "סקריפט", serif: "סריף", softserif: "סריף רך", sans: "סאנס" },
    bookCoverTitle: "חוגגים 90 שנות אהבה",
    bookCoverSubtitle: "ספר של זיכרונות, מסרים ורגעים מכל מי שאוהב אותך",
    bookScanAudio: "סרקו כדי לשמוע את המסר שלי",
    bookScanVideo: "סרקו לצפייה בסרטון שלי",
    bookHeartCaption: "פיסה קטנה מהלב שלי",
    bookClosing: "תודה שאת הלב של המשפחה שלנו",
    treeTitle: "האילן המשפחתי שלנו",
    treeHonoree: "מרים",
    lifeTitle: "מרים לאורך השנים",
    lifeBtn: "תמונות חיים",
    lifeHint: "בנו עמודי כפולה חופשיים (58×29): העלו תמונות והוסיפו טקסט, גררו לסידור (מימין לשמאל), שנו גודל מהפינה, סובבו והוסיפו צל. אפשר כמה תמונות וכמה עמודים שתרצו.",
    lifeAddPhotos: "הוספת תמונות",
    lifeAddText: "הוספת טקסט",
    lifeAddPage: "הוספת עמוד",
    lifeRemovePage: "מחיקת עמוד",
    lifePage: "עמוד",
    lifeTextLabel: "טקסט",
    fxColor: "צבע",
    fxBg: "רקע (מילוי כל הכפולה)",
    savedOk: "נשמר ✓",
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
    appTitle: "A Book of Love",
    forGrandma: "For Mom / Grandma Miriam's 90th",

    submitLede:
      "We're making a keepsake from all of us — children, grandchildren and great-grandchildren. Leave a short note and, if you can, a few seconds of your actual voice. Hearing you will mean the world to her.",

    nameLabel: "Your name",
    namePlaceholder: "e.g. Shmulik",
    youAreHer: "You are her…",
    generationLabel: "Generation (internal only)",
    relationshipLabel: "Exactly (optional)",
    relationshipPlaceholder: "e.g. eldest granddaughter",
    promptLabel: "A few ideas for what to write or record about",
    promptPlaceholder: "Open for ideas…",
    noteLabel: "Your note for the page",
    notePlaceholder: "Write it the way you'd say it to her…",
    charsCount: (n) => `${n} characters`,
    pullQuoteLabel: "One big line / headline (optional)",
    pullQuotePlaceholder: "e.g. You are my safe place",
    photoLabel: "Photos (4) — the first is your big photo with her; up to 3 more for the collage page",
    photoSlotsLabel: "Photos — one per spot on your page",
    photoSlotsHint: "Here's how your page will look: your main photo appears large beside your words, and up to 3 more form a collage. Tap any frame to add a photo.",
    slotPortrait: "Main photo (big page)",
    slotCollage: (n) => `Collage ${n}`,
    textTooLong: "A bit long — aim for ~600 characters so it fits the page nicely",
    uploading: (p) => `Uploading… ${p}%`,
    uploadingEta: (s) => `~${s}s left`,
    clipPreviewHint: "Have a listen — not happy? Record again",
    recordAgain: "● Record again",
    editBtn: "Edit",
    saveBtn: "Save",
    cancelBtn: "Cancel",
    fxTilt: "White border",
    fxRotate: "Rotate",
    fxZoom: "Zoom",
    fxPanX: "Pan X",
    fxPanY: "Pan Y",
    fxSize: "Size",
    fxShadow: "Shadow",
    fxFit: "Fit whole photo",
    mainPhotoTitle: "Main photo",
    collageTitle: "Collage photos (drag to arrange)",
    collageHint: "Drag the photos to arrange them — they can overlap. Click a photo to adjust it, and drag its corner to resize.",
    bringFront: "Bring to front",
    sendBack: "Send to back",
    mainPreviewTitle: "Page preview",
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
    arrangeBtn: "Arrange page order",
    arrangeHint: "Use the arrows to set the order pages appear in the book. Only approved pages are included.",
    backToList: "Back to list",
    exportImagesBtn: "Download images",
    exportPages: "Single pages (30×30)",
    exportSpread: "Spreads — seamless (58×29)",
    exportSpreadFramed: "Spreads — framed (58×29)",
    exportingN: (i, n) => `Exporting… ${i}/${n}`,
    exportError: "Export failed — make sure Storage CORS is set (see README).",
    shareBtn: "Copy book link",
    linkCopied: "Link copied! ✓",
    bookWelcome: "Scroll through the pages — and tap play to hear each voice",
    bookCredits: "Made with love by the whole family",
    scanToHear: "Scan with your phone camera to hear us",
    styleLabel: "Style",
    styles: { luxury: "Luxury", modern: "Modern", vintage: "Vintage" },
    textStyleBtn: "Text styling",
    fontLabel: "Font",
    boldLabel: "Bold",
    sizeLabel: "Size",
    textRoles: { name: "Name", quote: "Big quote", body: "Long message", sign: "Signature" },
    fontNames: { handwriting: "Handwriting", script: "Script", serif: "Serif", softserif: "Soft serif", sans: "Sans" },
    bookCoverTitle: "Celebrating 90 Years of Love",
    bookCoverSubtitle:
      "A book of memories, messages & moments from the people who love you most",
    bookScanAudio: "Scan to hear my message",
    bookScanVideo: "Scan to watch my video",
    bookHeartCaption: "A little piece of my heart",
    bookClosing: "Thank you for being the heart of our family",
    treeTitle: "Our Family Tree",
    treeHonoree: "Miriam",
    lifeTitle: "Miriam Through the Years",
    lifeBtn: "Life photos",
    lifeHint: "Build free-form spreads (58×29): upload photos and add text, drag to arrange (right-to-left), resize from the corner, rotate and add shadow. As many photos and pages as you like.",
    lifeAddPhotos: "Add photos",
    lifeAddText: "Add text",
    lifeAddPage: "Add page",
    lifeRemovePage: "Remove page",
    lifePage: "Page",
    lifeTextLabel: "Text",
    fxColor: "Color",
    fxBg: "Background (fill spread)",
    savedOk: "Saved ✓",
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
