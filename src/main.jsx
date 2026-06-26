import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { LanguageProvider } from "./i18n.jsx";
import { BookStyleProvider } from "./bookStyle.jsx";
import { LifeProvider } from "./life.jsx";
import { TreeProvider } from "./tree.jsx";
import { SongsProvider } from "./songs.jsx";
import "./styles.css";

// Entry point — index.html loads this and the whole app hangs off <App />.
// LanguageProvider gives every view the Hebrew/English strings + RTL direction.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <BookStyleProvider>
        <LifeProvider>
          <TreeProvider>
            <SongsProvider>
              <App />
            </SongsProvider>
          </TreeProvider>
        </LifeProvider>
      </BookStyleProvider>
    </LanguageProvider>
  </StrictMode>
);
