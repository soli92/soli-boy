import { defineConfig, devices } from "@playwright/test";

// E2e browser reali (Chromium headless). Le spec vivono in e2e/*.e2e.ts
// (escluse da vitest, vedi vite.config.ts). Il webServer avvia Vite dev.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // In CI: "line" per i log + "html" (in packages/app/playwright-report/) così
  // l'artifact su failure di TSK-052 contiene il report navigabile. Locale: list.
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // TSK-067 — progetto mobile: emula iPhone 13 con Chromium (hasTouch: true,
    // pointer: coarse). `defaultBrowserType` del device è webkit (non installato
    // in CI), quindi eseguiamo su Chromium sovrascrivendo il browser.
    // Eseguibile con: npm run e2e -- --project=mobile
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        // Forza Chromium per compatibilità ambienti senza WebKit installato.
        // hasTouch, viewport (390x664), deviceScaleFactor (3), isMobile restano
        // dal device descriptor: pointer:coarse è garantito da hasTouch:true.
        browserName: "chromium",
      },
    },
  ],
  webServer: {
    command: "npx vite --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
