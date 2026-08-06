import { useEffect, useState } from "react";
import Submit from "./Submit.jsx";
import MessageView from "./MessageView.jsx";
import Gallery from "./Gallery.jsx";
import PublicBook from "./PublicBook.jsx";
import LanguageToggle from "./LanguageToggle.jsx";
import FaviconManager from "./FaviconManager.jsx";
import { GALLERY_SECRET } from "./firebase.js";

// Tiny router — no dependency needed.
// Routes:
//   /m/<id>             -> a single message (what every QR code points to)
//   /book               -> the public, scrollable online keepsake book
//   /?gallery=<secret>  -> organizer's review + print-export gallery
//   /                   -> the contributor submission form
function useRoute() {
  const [route, setRoute] = useState(() => parse());
  useEffect(() => {
    const onPop = () => setRoute(parse());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return route;
}

function parse() {
  const { pathname, searchParams } = new URL(window.location.href);
  const messageMatch = pathname.match(/\/m\/([A-Za-z0-9_-]+)/);
  if (messageMatch) return { view: "message", id: messageMatch[1] };
  if (/\/book\/?$/.test(pathname)) return { view: "publicbook" };
  if (searchParams.get("gallery") === GALLERY_SECRET) return { view: "gallery" };
  return { view: "submit" };
}

export default function App() {
  const route = useRoute();
  return (
    <>
      <FaviconManager />
      <LanguageToggle />
      {route.view === "message" ? (
        <MessageView id={route.id} />
      ) : route.view === "publicbook" ? (
        <PublicBook />
      ) : route.view === "gallery" ? (
        <Gallery />
      ) : (
        <Submit />
      )}
    </>
  );
}
