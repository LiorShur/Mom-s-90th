import { useEffect } from "react";
import { useBookContent } from "./bookStyle.jsx";

// Static defaults declared in index.html (the gold "90" emblem).
const EMBLEM = {
  appleTouch: "/apple-touch-icon.png",
  favicon: "/icon-512.png",
  manifest: "/manifest.webmanifest",
};

function setLink(rel, href) {
  const el = document.head.querySelector(`link[rel="${rel}"]`);
  if (el) el.href = href;
}

// Build a manifest pointing at the chosen icon, served as a blob URL so the
// Android "add to home screen" flow picks up the photo icon. Returns the URL.
function photoManifest(iconUrl) {
  const manifest = {
    name: "ספר שכולו אהבה",
    short_name: "ספר אהבה",
    start_url: "/book",
    scope: "/",
    display: "standalone",
    background_color: "#f7f1e6",
    theme_color: "#7d4529",
    icons: [
      { src: iconUrl, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: iconUrl, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
  return URL.createObjectURL(blob);
}

// Applies the organizer's chosen home-screen icon (emblem vs cover photo) to
// the live document head on every route, including the public /book page.
export default function FaviconManager() {
  const book = useBookContent();
  const icon = book.icon;
  const photoUrl = icon?.type === "photo" ? icon.url : null;

  useEffect(() => {
    if (photoUrl) {
      setLink("apple-touch-icon", photoUrl);
      setLink("icon", photoUrl);
      const blobUrl = photoManifest(photoUrl);
      setLink("manifest", blobUrl);
      return () => URL.revokeObjectURL(blobUrl);
    }
    // Emblem (default): restore the static tags.
    setLink("apple-touch-icon", EMBLEM.appleTouch);
    setLink("icon", EMBLEM.favicon);
    setLink("manifest", EMBLEM.manifest);
  }, [photoUrl]);

  return null;
}
