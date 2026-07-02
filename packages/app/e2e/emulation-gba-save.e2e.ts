// TSK-030 / US-016 — e2e save/load state REALE con MgbaEngine (GBA, ?engine=real).
// Verifica a RUNTIME l'intera pipeline App → Player → SaveStatePanel → SaveService
// → MgbaEngine (snapshot/restore) su ROM GBA libera. Questo flusso non era stato
// verificato a runtime (vedi nota in src/core/mgba-engine.ts): copre la regressione
// del path del file save state mGBA (`<stem>.ss<slot>`, estensione rimossa).
//
// Si attiva solo se presente una ROM GBA LIBERA in public/test-roms/.
// Slot 0 interno → label UI "slot 1" (come emulation-save.e2e.ts).
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { gotoApp, selectLibraryTileAndAutoStart, uploadRom } from "./helpers/app-nav";

const dir = path.dirname(fileURLToPath(import.meta.url));
const GBA_ROM = process.env.SOLIBOY_E2E_GBA_ROM ?? "gba-tests-thumb.gba";
const romPath = path.resolve(dir, "../public/test-roms", GBA_ROM);
const romTitle = GBA_ROM.replace(/\.[^.]+$/, "");

const SLOT = 0;
const SLOT_LABEL = SLOT + 1;

/** Accessible name tile Libreria: "titolo GBA" (vedi Library.tsx GameTile). */
const libraryTileName = `${romTitle} GBA`;

async function startGbaReal(page: import("@playwright/test").Page) {
  await gotoApp(page, "/?engine=real");
  await uploadRom(page, romPath);
  await selectLibraryTileAndAutoStart(page, libraryTileName, {
    runningTimeout: 30_000,
  });
  await expect(page.locator(".sb-screen canvas")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("sb-storage-init-error")).not.toBeVisible();
  await expect(page.locator('.sb-app [role="alert"]')).not.toBeVisible();
}

test.describe("save/load state reale (MgbaEngine, GBA)", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!existsSync(romPath), `ROM GBA libera assente (${GBA_ROM}).`);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => indexedDB.deleteDatabase("soli-boy"));
  });

  test("salva stato nello slot 1 → slot occupato, nessun errore", async ({ page }) => {
    test.slow();
    await startGbaReal(page);

    const saveBtn = page.getByRole("button", { name: `Salva nello slot ${SLOT_LABEL}` });
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();

    // Slot occupato (meta non più "vuoto") e nessun alert (snapshot mGBA riuscito).
    const slotMeta = page.getByTestId(`sb-savestate-meta-${SLOT}`);
    await expect(slotMeta).not.toHaveText("vuoto", { timeout: 5_000 });
    // TSK-096: StorageInitErrorFallback aggiunge <main role="alert"> al DOM quando
    // selectAdapter() lancia. Restringiamo il controllo all'errore del Player
    // (sb-storage-init-error non deve essere visibile) + nessun alert di Player.
    await expect(page.getByTestId("sb-storage-init-error")).not.toBeVisible();
    await expect(page.locator('.sb-app [role="alert"]')).not.toBeVisible();
  });

  test("salva stato → carica stato: nessun errore, canvas resta visibile", async ({ page }) => {
    test.slow();
    await startGbaReal(page);

    const saveBtn = page.getByRole("button", { name: `Salva nello slot ${SLOT_LABEL}` });
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();

    const slotMeta = page.getByTestId(`sb-savestate-meta-${SLOT}`);
    await expect(slotMeta).not.toHaveText("vuoto", { timeout: 5_000 });

    const loadBtn = page.getByRole("button", { name: `Carica slot ${SLOT_LABEL}` });
    await expect(loadBtn).toBeEnabled({ timeout: 5_000 });
    await loadBtn.click();

    // restore mGBA riuscito: nessun alert, canvas ancora vivo.
    // TSK-096: StorageInitErrorFallback aggiunge <main role="alert"> al DOM quando
    // selectAdapter() lancia. Stessa strategia del test precedente: escludiamo
    // il fallback storage e verifichiamo solo gli alert di gioco/Player.
    await expect(page.getByTestId("sb-storage-init-error")).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.sb-app [role="alert"]')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator(".sb-screen canvas")).toBeVisible({ timeout: 5_000 });
  });
});
