import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { LanguageProvider } from "./i18n.jsx";
import "./styles.css";

// Entry point — index.html loads this and the whole app hangs off <App />.
// LanguageProvider gives every view the Hebrew/English strings + RTL direction.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);
