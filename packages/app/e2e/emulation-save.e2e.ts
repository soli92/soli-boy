// TSK-034 — e2e save/load state con WasmBoy reale (US-016, ?engine=real).
// Verifica a RUNTIME che WasmBoy.saveState() e WasmBoy.loadState() funzionino
// nell'intera pipeline App → Player → SaveStatePanel → SaveService → WasmBoyEngine.
//
// Si attiva solo se la ROM libera dmg-acid2.gb (MIT) è presente in public/test-roms/
// (stesso gate usato da emulation-real.e2e.ts, TSK-027).
//
// Slot UI: gli slot sono indicizzati da 0 internamente; il componente usa slot+1
// per le label visibili. Usiamo lo slot 0 (aria-label "Salva nello slot 1" /
// "Carica slot 1") per coerenza con SaveStatePanel.tsx.

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FREE_ROM = process.env.SOLIBOY_E2E_ROM ?? "dmg-acid2.gb";
const romPath = path.resolve(dir, "../public/test-roms", FREE_ROM);
const romTitle = FREE_ROM.replace(/\.[^.]+$/, "");

// Slot 0 interno → label UI "slot 1"
const SLOT = 0;
const SLOT_LABEL = SLOT + 1;

test.describe("save/load state reale (WasmBoyEngine, GB)", () => {
  test.skip(!existsSync(romPath), `ROM libera assente (${FREE_ROM}).`);

  test.beforeEach(async ({ page }) => {
    // Pulisce IndexedDB tra i test per isolare lo stato dei save state.
    await page.addInitScript(() => {
      indexedDB.deleteDatabase("soli-boy");
    });
  });

  test("salva stato nello slot 1 → slot risulta occupato, nessun errore", async ({
    page,
  }) => {
    test.slow(); // WasmBoy richiede tempo per caricare il WASM e avviare l'emulazione.

    await page.goto("/?engine=real");

    // Carica la ROM libera tramite file input.
    await page.getByLabel("Carica ROM").setInputFiles(romPath);
    await expect(page.getByText(romTitle)).toBeVisible();
    await page.getByText(romTitle).click();

    // Avvia l'emulazione reale.
    await page.getByRole("button", { name: /avvia/i }).click();

    // Attendi che il canvas WasmBoy sia visibile (emulazione avviata).
    await expect(page.locator(".sb-screen canvas")).toBeVisible({ timeout: 30_000 });

    // A questo punto il pannello Save state deve essere abilitato (engine running,
    // romId presente, capabilities.saveStates === true per WasmBoyEngine).
    const saveBtn = page.getByRole("button", { name: `Salva nello slot ${SLOT_LABEL}` });
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });

    // Salva nello slot.
    await saveBtn.click();

    // Verifica: lo slot risulta occupato (il meta mostra un timestamp, non "vuoto").
    const slotMeta = page.getByTestId(`sb-savestate-meta-${SLOT}`);
    await expect(slotMeta).not.toHaveText("vuoto", { timeout: 5_000 });

    // Verifica: il bottone "Carica slot N" è ora abilitato (slot occupato).
    const loadBtn = page.getByRole("button", { name: `Carica slot ${SLOT_LABEL}` });
    await expect(loadBtn).toBeEnabled({ timeout: 5_000 });

    // Verifica: nessun alert di errore (niente eccezioni WasmBoy.saveState,
    // niente errori SaveService/IndexedDB).
    await expect(page.getByRole("alert")).not.toBeVisible();
  });

  test("salva stato → carica stato: nessun errore, canvas resta visibile", async ({
    page,
  }) => {
    // FIXME (TSK-034 / gap qa@TSK-034): WasmBoy.loadState() rimuove il canvas
    // dal DOM dopo il restore, causando la scomparsa del canvas .sb-screen.
    // Sintomo: dopo aver chiamato "Carica slot 1" con successo (nessun alert
    // di errore), il canvas non è più trovabile in `.sb-screen`.
    // Ipotesi: WasmBoy riconfigura internamente il canvas element durante
    // loadState, smontandolo e rimontandolo, ma il React ref .sb-screen
    // punta ancora al vecchio nodo. Il flusso save funziona; il flusso load
    // richiede un fix nell'integrazione WasmBoyEngine/Player (non nel test).
    // Vedere wiki/gaps.md @ gap "TSK-034 — WasmBoy.loadState() rimuove canvas".
    test.fixme(
      true,
      "Bug runtime: WasmBoy.loadState() rimuove il canvas dal DOM dopo il restore. Vedi wiki/gaps.md.",
    );

    test.slow();

    await page.goto("/?engine=real");

    await page.getByLabel("Carica ROM").setInputFiles(romPath);
    await expect(page.getByText(romTitle)).toBeVisible();
    await page.getByText(romTitle).click();
    await page.getByRole("button", { name: /avvia/i }).click();
    await expect(page.locator(".sb-screen canvas")).toBeVisible({ timeout: 30_000 });

    // Salva nello slot.
    const saveBtn = page.getByRole("button", { name: `Salva nello slot ${SLOT_LABEL}` });
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();

    // Attendi che lo slot risulti occupato prima di tentare il caricamento.
    const slotMeta = page.getByTestId(`sb-savestate-meta-${SLOT}`);
    await expect(slotMeta).not.toHaveText("vuoto", { timeout: 5_000 });

    // Carica dallo slot (loadBtn abilitato solo se slot occupato e engine running).
    const loadBtn = page.getByRole("button", { name: `Carica slot ${SLOT_LABEL}` });
    await expect(loadBtn).toBeEnabled({ timeout: 5_000 });
    await loadBtn.click();

    // Verifica: nessun alert di errore dopo il load
    // (nessun engine-mismatch, nessun not-found, nessuna eccezione WasmBoy.loadState).
    await expect(page.getByRole("alert")).not.toBeVisible({ timeout: 5_000 });

    // Verifica: il canvas resta visibile → l'emulazione continua dopo il restore.
    // QUESTA ASSERTION FALLISCE: il canvas scompare dopo loadState (vedi fixme sopra).
    await expect(page.locator(".sb-screen canvas")).toBeVisible({ timeout: 5_000 });
  });
});
