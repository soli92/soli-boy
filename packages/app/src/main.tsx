import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
// TSK-040: design system REALE @soli92/solids (token/temi/utilities/shadcn) autoritativo.
// Ordine: skin app (classi sb-* + scale fallback) → solids reale (vince su token/temi) → layout app.
import "./styles/solids-theme.css";
import "@soli92/solids/css/index.css";
import "@soli92/solids/css/shadcn.css";
import "./styles/app-extra.css";
import "./styles/tailwind.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
