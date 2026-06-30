import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

// E2e browser reali (Chromium headless). Le spec vivono in e2e/*.e2e.ts
// (escluse da vitest, vedi vite.config.ts). Il webServer avvia Vite dev.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  // WASM sotto carico parallelo: 1 retry + gate data-state=running nei save spec.
  retries: isCI ? 1 : 0,
  // Meno worker in CI → meno contention su init WasmBoy/mGBA (meno flake, meno retry).
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Mobile solo in locale / job dedicato (`npm run e2e:mobile`). In CI il doppio
    // progetto raddoppiava ~110 spec (player-hud-oracle, privacy, WASM…) → 20+ min.
    ...(isCI
      ? []
      : [
          {
            name: "mobile",
            use: {
              ...devices["iPhone 13"],
              browserName: "chromium",
            },
          },
        ]),
  ],
  webServer: {
    command: "npx vite --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
