// TSK-024 — e2e emulazione REALE con EmulatorJsEngine (?engine=emulatorjs).
// Si attiva SOLO se è presente una ROM LIBERA in public/test-roms/<FREE_ROM>
// (es. Tobu Tobu Girl, homebrew). Nessuna ROM protetta nel repo (vincolo legale).
// Finché la ROM libera è assente, il test è skippato → suite verde, repo pulito.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const dir = path.dirname(fileURLToPath(import.meta.url));
// Nome atteso della ROM libera (whitelistala in .gitignore quando la aggiungi).
const FREE_ROM = process.env.SOLIBOY_E2E_ROM ?? "tobu-tobu-girl.gb";
const romPath = path.resolve(dir, "../public/test-roms", FREE_ROM);
const romTitle = FREE_ROM.replace(/\.[^.]+$/, "");

test.describe("emulazione reale (EmulatorJsEngine)", () => {
  test.skip(
    !existsSync(romPath),
    `ROM libera assente (${FREE_ROM}). Aggiungi una ROM homebrew/free in public/test-roms/ ` +
      `(e whitelistala in .gitignore) per abilitare questo e2e. Vedi public/test-roms/README.md.`,
  );

  test("carica una ROM libera → EmulatorJS reale monta ed esegue", async ({ page }) => {
    test.slow(); // i core WASM sono scaricati dal CDN: lascia margine
    await page.goto("/?engine=emulatorjs");

    await page.getByLabel("Carica ROM").setInputFiles(romPath);
    await expect(page.getByText(romTitle)).toBeVisible();
    await page.getByText(romTitle).click();
    await page.getByRole("button", { name: /avvia/i }).click();

    // EmulatorJS monta un <canvas> nel viewport quando l'emulazione parte.
    await expect(page.locator(".sb-screen canvas")).toBeVisible({ timeout: 60_000 });
  });
});
