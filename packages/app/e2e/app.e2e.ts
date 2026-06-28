// TSK-011/TSK-019 — e2e browser reale (Chromium) del Core web MVP.
// Pilota l'app reale servita da Vite; engine = StubEngine (no emulazione WASM
// reale) forzato via ?engine=stub: questi flussi verificano la UI/lifecycle in
// modo deterministico con ROM fittizie, non l'emulazione vera (vedi
// emulation-real.e2e.ts per il motore reale WasmBoy con ?engine=real).
import { expect, test } from "@playwright/test";
import {
  expectLegalNotice,
  expectStoreComplianceNotice,
  gotoStubApp,
  openControlsRemapAccordion,
  openInfoPrivacyTab,
  openSettingsTab,
  uploadRom,
} from "./helpers/app-nav";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => indexedDB.deleteDatabase("soli-boy"));
  await gotoStubApp(page);
});

test("contenuti legali in tab Info & Privacy (TSK-006 / TSK-070 / IA 4 tab)", async ({
  page,
}) => {
  await openInfoPrivacyTab(page);
  await expectLegalNotice(page);
  await expectStoreComplianceNotice(page);
  await expect(page.getByTestId("sb-privacy-section")).toBeVisible();
});

test("carica una ROM GB → compare in libreria → avvia → pausa", async ({ page }) => {
  await uploadRom(page, {
    name: "tetris.gb",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("ROMDATA-GB"),
  });

  // la ROM appare in libreria con titolo e piattaforma (tile, non il chip filtro)
  const tile = page.getByRole("button", { name: "tetris GB" });
  await expect(tile).toBeVisible();

  // TSK-100: click su tile → auto-start (preferenza default ON) — il Player
  // avvia automaticamente, "Avvia" non è più necessario. Se il gate dialog
  // "Cambia gioco?" (TSK-101) è aperto (ROM diversa già in esecuzione),
  // lo confermiamo prima di procedere.
  await tile.click();
  const changeDialog = page.getByRole("dialog", { name: /cambia gioco/i });
  if (await changeDialog.isVisible()) {
    await page.getByRole("button", { name: /cambia gioco/i }).click();
  }

  // TSK-103: il titolo ROM è nell'HUD (.sb-hud, role="status"), non nello
  // schermo (.sb-screen). Verifichiamo stato running via data-state sul viewport.
  const screen = page.locator(".sb-screen");
  await expect(screen).toHaveAttribute("data-state", "running", { timeout: 10_000 });
  const hud = page.locator(".sb-hud");
  await expect(hud).toContainText("tetris");

  // controlli (US-011): pausa → ripresa
  await page.getByRole("button", { name: /pausa/i }).click();
  // TSK-103: "In pausa" è nell'HUD (.sb-hud, role="status"), non nello schermo.
  await expect(hud).toContainText("In pausa");
  await page.getByRole("button", { name: /riprendi/i }).click();
  await expect(screen).toHaveAttribute("data-state", "running", { timeout: 5_000 });
  await expect(hud).toContainText("tetris");
});

test("file non supportato mostra errore e non entra in libreria", async ({ page }) => {
  await uploadRom(page, {
    name: "game.nes",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("x"),
  });
  await expect(page.getByRole("alert")).toBeVisible();
  // TSK-103: getByText(/nessun gioco/i) ora matcha sia la Library ("Nessun gioco.
  // Carica una ROM per iniziare.") sia l'HUD ("Nessun gioco selezionato"). Usiamo
  // il selettore contestuale scoped alla sezione "Libreria giochi" per disambiguare.
  await expect(
    page.locator('[aria-label="Libreria giochi"]').getByText(/nessun gioco/i)
  ).toBeVisible();
});

test("Settings: rimappatura comando (US-013)", async ({ page }) => {
  await openSettingsTab(page);
  await openControlsRemapAccordion(page);
  const sel = page.getByLabel("Pulsante per ArrowUp");
  await expect(sel).toHaveValue("up");
  await sel.selectOption("a");
  await expect(sel).toHaveValue("a");
});
