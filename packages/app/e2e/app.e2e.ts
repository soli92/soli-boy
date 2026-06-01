// TSK-011/TSK-019 — e2e browser reale (Chromium) del Core web MVP.
// Pilota l'app reale servita da Vite; engine = StubEngine (no emulazione WASM reale).
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => indexedDB.deleteDatabase("soli-boy"));
  await page.goto("/");
});

test("avviso legale visibile all'avvio", async ({ page }) => {
  await expect(page.getByRole("note", { name: /avviso legale/i })).toContainText(
    /non distribuisce/i,
  );
});

test("carica una ROM GB → compare in libreria → avvia → pausa", async ({ page }) => {
  // caricamento via file input (nascosto): Playwright lo gestisce
  await page.getByLabel("Carica ROM").setInputFiles({
    name: "tetris.gb",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("ROMDATA-GB"),
  });

  // la ROM appare in libreria con titolo e piattaforma (tile, non il chip filtro)
  const tile = page.getByRole("button", { name: "tetris GB" });
  await expect(tile).toBeVisible();

  // selezione → Player → Avvia
  await tile.click();
  await page.getByRole("button", { name: /avvia/i }).click();
  await expect(page.getByLabel("Schermo di gioco")).toHaveText("tetris");

  // controlli (US-011): pausa → ripresa
  await page.getByRole("button", { name: /pausa/i }).click();
  await expect(page.getByText("In pausa")).toBeVisible();
  await page.getByRole("button", { name: /riprendi/i }).click();
  await expect(page.getByLabel("Schermo di gioco")).toHaveText("tetris");
});

test("file non supportato mostra errore e non entra in libreria", async ({ page }) => {
  await page.getByLabel("Carica ROM").setInputFiles({
    name: "game.nes",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("x"),
  });
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText(/nessun gioco/i)).toBeVisible();
});

test("Settings: rimappatura comando (US-013)", async ({ page }) => {
  const sel = page.getByLabel("Pulsante per ArrowUp");
  await expect(sel).toHaveValue("up");
  await sel.selectOption("a");
  await expect(sel).toHaveValue("a");
});
