/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// TSK-023 — cross-origin isolation per i core EmulatorJS threaded (SharedArrayBuffer).
// COEP: require-corp è la scelta spec-corretta; le sottorisorse cross-origin (CDN font/icone,
// EmulatorJS) devono inviare CORS + CORP o essere caricate `crossorigin`, altrimenti usare
// `credentialless`. Per la PRODUZIONE gli stessi header vanno configurati sul server/CDN
// (scelta ops/umana — vedi wiki/runbooks/emulatorjs-hosting.md).
const crossOriginIsolation = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  plugins: [react()],
  server: { headers: crossOriginIsolation },
  preview: { headers: crossOriginIsolation },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
