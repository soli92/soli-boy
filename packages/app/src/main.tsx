import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
// Tema design system (approssimazione mockup SoliDS) + stili app.
// Da sostituire con `@soli92/solids` quando disponibile (gap design-system-real-package).
import "./styles/solids-theme.css";
import "./styles/app-extra.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
