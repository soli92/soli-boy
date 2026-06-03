import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Soli-boy — configurazione Capacitor (TSK-059, ADR-001).
 * Shell mobile: WebView + plugin nativi (Android/iOS). Il webDir è l'output
 * Vite della SPA (`dist/`), riusato 1:1 come renderer mobile.
 */
const config: CapacitorConfig = {
  appId: "com.soli92.soliboy",
  appName: "Soli-boy",
  webDir: "dist",
};

export default config;
