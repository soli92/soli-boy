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
  ],
  webServer: {
    command: "npx vite --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
