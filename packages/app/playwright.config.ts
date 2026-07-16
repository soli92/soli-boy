import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const configDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(configDir, "../..");
const protoDir = path.join(repoRoot, "output/prototypes/ep020");
const viteBin = path.join(configDir, "node_modules/.bin/vite");

const prototypePreviewCmd = [
  `ln -sf "${path.join(configDir, "node_modules")}" "${path.join(protoDir, "node_modules")}" 2>/dev/null || true`,
  `"${viteBin}" build --config "${path.join(protoDir, "vite.config.ts")}"`,
  `"${viteBin}" preview --config "${path.join(protoDir, "vite.config.ts")}" --port 4174 --strictPort`,
].join(" && ");

// E2e browser reali (Chromium headless). Le spec vivono in e2e/*.e2e.ts
// (escluse da vitest, vedi vite.config.ts). Il webServer avvia Vite dev +
// preview del prototipo EP-020 (porta 4174) per ep021-visual-fidelity.e2e.ts.
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
          {
            name: "android",
            use: {
              ...devices["Pixel 7"],
              browserName: "chromium",
            },
          },
        ]),
  ],
  webServer: [
    {
      name: "app",
      command: "npx vite --port 4173 --strictPort",
      url: "http://localhost:4173",
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    {
      name: "ep020-prototype",
      command: `bash -lc '${prototypePreviewCmd}'`,
      url: "http://localhost:4174",
      reuseExistingServer: !isCI,
      timeout: 180_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
