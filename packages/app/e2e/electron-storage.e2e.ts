// TSK-058 — e2e Playwright: carica ROM + salva su filesystem nativo (Electron).
// Annotato: @slow @electron
//
// ── Fase 2 (umana, post-packaging) ──────────────────────────────────────────
// Questo spec è il punto di aggancio per il test E2E Playwright+Electron
// headless (TSK-058 §Technical Specs "Fase 2"). Viene mantenuto nella directory
// e2e/ per continuità con la struttura del progetto.
//
// BLOCKING CONDITION: lo spec è skipped automaticamente finché l'ambiente
// Electron non è disponibile. Le condizioni di sblocco sono:
//   1. TSK-056 (Electron packaging) done → build desktop disponibile.
//   2. Playwright configurato con il progetto "electron" (playwright.config.ts).
//   3. Display server disponibile (DISPLAY env o macOS con Electron bundle).
//
// FINDING AMBIENTALE (documentato onestamente per TSK-058):
//   - In questo ambiente (CI-like, Node 24, macOS) Electron non è lanciabile
//     headless tramite Playwright senza la build packaged (TSK-056).
//   - Il playwright.config.ts corrente non include un project "electron".
//   - Il test di Fase 1 (IPC mock, Vitest) vive in:
//     packages/app/src/storage/electron-storage-ipc.test.ts (26 test, tutti verdi).
//
// Istruzioni per la Fase 2 (umana):
//   1. Aggiornare playwright.config.ts con il project `electron` puntando
//      al binary Electron packaged (es. via `@playwright/test` + `electron`
//      launcher o `spectron` alternativo).
//   2. Rimuovere `test.skip(true, ...)` e implementare i test Playwright E2E.
//   3. I test devono coprire: FileLoader → addRom → NativeFsAdapter IPC →
//      salvataggio su filesystem → reload → listRoms → ROM presente.
//
// [^src: management/kanban/EP-006-distribuzione-desktop/US-023-filesystem-nativo/TSK-058.md §Technical Specs "Fase 2"]

import { test, expect } from "@playwright/test";

const ELECTRON_READY = process.env.SOLIBOY_ELECTRON_E2E === "1";

test.describe("TSK-058 @slow @electron — e2e Electron: carica ROM + salva su filesystem nativo", () => {
  test.skip(!ELECTRON_READY, [
    "Electron E2E (Fase 2) non disponibile in questo ambiente.",
    "Blocco: TSK-056 (packaging) non done. Set SOLIBOY_ELECTRON_E2E=1 quando pronto.",
    "I test IPC mock (Fase 1) vivono in src/storage/electron-storage-ipc.test.ts.",
  ].join(" "));

  test("carica ROM → NativeFsAdapter selezionato (window.soliboyDesktop presente)", async ({
    page,
  }) => {
    // Fase 2: verifica che in runtime Electron window.soliboyDesktop sia esposto.
    await page.goto("/");
    const isBridgePresent = await page.evaluate(
      () =>
        typeof (window as unknown as { soliboyDesktop?: object }).soliboyDesktop === "object" &&
        (window as unknown as { soliboyDesktop?: object }).soliboyDesktop !== null,
    );
    expect(isBridgePresent).toBe(true);
  });

  test("carica ROM → listRoms la recupera (round-trip filesystem nativo)", async ({ page }) => {
    // Fase 2: file picker → addRom → NativeFsAdapter IPC → listRoms → ROM presente.
    await page.goto("/");
    await page.getByLabel("Carica ROM").setInputFiles({
      name: "dmg-acid2.gb",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("FAKE-ROM-BYTES-FOR-E2E"),
    });
    // La ROM deve comparire in libreria.
    await expect(page.getByRole("button", { name: /dmg-acid2/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("salva stato → rilegge: save state su filesystem nativo via IPC", async ({ page }) => {
    // Fase 2: carica ROM → avvia → salva nello slot 1 → rilancia → slot occupato.
    await page.goto("/?engine=stub");
    await page.getByLabel("Carica ROM").setInputFiles({
      name: "dmg-acid2.gb",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("FAKE-ROM-BYTES-FOR-E2E"),
    });
    await expect(page.getByRole("button", { name: /dmg-acid2/i })).toBeVisible();
    await page.getByRole("button", { name: /dmg-acid2/i }).click();
    await page.getByRole("button", { name: /avvia/i }).click();

    const saveBtn = page.getByRole("button", { name: "Salva nello slot 1" });
    await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
    await saveBtn.click();

    const slotMeta = page.getByTestId("sb-savestate-meta-0");
    await expect(slotMeta).not.toHaveText("vuoto", { timeout: 5_000 });
  });

  test("invariante privacy: nessuna richiesta verso origin != localhost durante il flusso", async ({
    page,
  }) => {
    // Fase 2: intercetta tutte le richieste di rete. Nessuna deve andare verso
    // un'origine esterna (invariante US-033 / ADR-002).
    const externalRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (
        !url.startsWith("http://localhost") &&
        !url.startsWith("app://") &&
        !url.startsWith("file://") &&
        !url.startsWith("data:")
      ) {
        externalRequests.push(url);
      }
    });

    await page.goto("/?engine=stub");
    await page.getByLabel("Carica ROM").setInputFiles({
      name: "dmg-acid2.gb",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("FAKE-ROM"),
    });
    await page.waitForTimeout(2_000); // attendi caricamento

    expect(
      externalRequests,
      `Richieste esterne trovate (violazione US-033): ${externalRequests.join(", ")}`,
    ).toHaveLength(0);
  });
});
