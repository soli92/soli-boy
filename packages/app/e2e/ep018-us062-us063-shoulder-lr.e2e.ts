// TSK-124 — QA e2e: L/R tastiera (US-062) + TouchOverlay shoulder GBA/GB (US-063).
//
// Suite copre tre scenari:
//
//   1. (chromium + @slow) — Tastiera L/R su GBA reale (?engine=real):
//      preme q (L) e w (R) dopo avvio ROM GBA homebrew; verifica zero errori JS
//      nella pipeline input → engine.
//
//   2. (mobile — pointer:coarse) — TouchOverlay mgba (GBA stub):
//      carica ROM .gba stub con ?engine=stub; verifica che i pulsanti L e R
//      siano presenti nel DOM e che data-has-shoulder="true".
//
//   3. (mobile — pointer:coarse) — TouchOverlay gambatte (GB stub):
//      carica ROM .gb stub con ?engine=stub; verifica che L e R siano assenti
//      e che data-has-shoulder="false" (no shoulder hardware GB).
//
// Test 1 salta se la ROM GBA homebrew è assente in public/test-roms/.
// Test 2 e 3 saltano automaticamente su progetto chromium (pointer:fine).
//
// NOTA ARCHITETTURALE: il FileLoader è montato SOLO nel pannello Libreria
// (`activeTab === "library"`). Ogni test naviga alla tab Libreria prima
// di caricare la ROM. Il PrivacyNotice viene accettato se presentato.
//
// Riferimenti: US-062 §AC, US-063 §AC, AGENTS.md §Emulator engine gotcha.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const dir = path.dirname(fileURLToPath(import.meta.url));
const GBA_ROM = process.env.SOLIBOY_E2E_GBA_ROM ?? "gba-tests-thumb.gba";
const gbaRomPath = path.resolve(dir, "../public/test-roms", GBA_ROM);
const gbaRomTitle = GBA_ROM.replace(/\.[^.]+$/, "");

// ---------------------------------------------------------------------------
// Helper: verifica contesto touch (pointer:coarse).
// ---------------------------------------------------------------------------
async function isTouchContext(page: import("@playwright/test").Page): Promise<boolean> {
  return page.evaluate(() => window.matchMedia("(pointer: coarse)").matches);
}

// ---------------------------------------------------------------------------
// Helper: accetta il PrivacyNotice se visibile, poi naviga alla tab Libreria.
// Il FileLoader (aria-label="Carica ROM") vive solo nel pannello Libreria.
// ---------------------------------------------------------------------------
async function navigateToLibrary(page: import("@playwright/test").Page) {
  // Accetta il PrivacyNotice se presentato (compare quando IndexedDB è fresco).
  const privacyBtn = page.getByRole("button", { name: /ho capito/i });
  if (await privacyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await privacyBtn.click();
  }
  // Naviga alla tab Libreria dove vive il FileLoader.
  await page.getByRole("tab", { name: "Libreria" }).click();
}

// ---------------------------------------------------------------------------
// Helper: carica una ROM stub in-memory e avvia il gioco.
// Pulisce IndexedDB prima del caricamento per evitare state stale tra test.
// ---------------------------------------------------------------------------
async function loadAndStartStubRom(
  page: import("@playwright/test").Page,
  fileName: string,
  tileLabel: string,
) {
  await page.addInitScript(() => indexedDB.deleteDatabase("soli-boy"));
  await page.goto("/?engine=stub");

  await navigateToLibrary(page);

  await page.getByLabel("Carica ROM").setInputFiles({
    name: fileName,
    mimeType: "application/octet-stream",
    buffer: Buffer.from("STUB-ROM-DATA"),
  });

  const tile = page.getByRole("button", { name: tileLabel });
  await expect(tile).toBeVisible({ timeout: 5_000 });

  await tile.click();

  // Gestisci dialog "cambia gioco" se un altro gioco è già in corso.
  const changeDialog = page.getByRole("dialog", { name: /cambia gioco/i });
  if (await changeDialog.isVisible()) {
    await page.getByRole("button", { name: /cambia gioco/i }).click();
  }

  await expect(page.getByLabel("Schermo di gioco")).toBeVisible({ timeout: 10_000 });
}

// ===========================================================================
// Test 1 — Tastiera L/R su GBA (?engine=real): nessun errore JS
// ===========================================================================
test.describe("US-062 — Tastiera L/R su GBA (?engine=real)", () => {
  test.skip(!existsSync(gbaRomPath), `ROM GBA homebrew assente (${GBA_ROM}).`);

  test(
    "q (L) e w (R) su GBA reale → nessun errore JS nella pipeline input",
    async ({ page }) => {
      test.slow(); // @slow — attende rendering canvas GBA (WASM boot).

      // Registra ascoltatore errori JS prima del goto per catturare tutto.
      const jsErrors: string[] = [];
      page.on("pageerror", (err) => jsErrors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") jsErrors.push(msg.text());
      });

      await page.goto("/?engine=real");
      await navigateToLibrary(page);

      await page.getByLabel("Carica ROM").setInputFiles(gbaRomPath);

      await expect(page.getByText(gbaRomTitle)).toBeVisible({ timeout: 10_000 });
      await page.getByText(gbaRomTitle).click();

      // Il canvas GBA diventa visibile quando mGBA ha inizializzato.
      await expect(page.locator(".sb-screen canvas")).toBeVisible({ timeout: 30_000 });

      // Azzera errori accumulati durante il boot (es. console warning non bloccanti)
      // e considera solo quelli dopo la prima pressione del tasto.
      jsErrors.length = 0;

      // Simula L (q) e R (w) — i tasti sono mappati in input-mapping.ts (TSK-120).
      await page.keyboard.press("q");
      await page.keyboard.press("w");

      // Attesa breve per flush del microtask queue React/engine.
      await page.waitForTimeout(200);

      expect(
        jsErrors,
        `Pressione q/w (L/R) ha prodotto errori JS: ${jsErrors.join("; ")}`,
      ).toHaveLength(0);

      // Il canvas deve rimanere visibile (nessun crash dell'engine).
      await expect(page.locator(".sb-screen canvas")).toBeVisible();
    },
  );
});

// ===========================================================================
// Test 2 — TouchOverlay mgba (GBA stub): pulsanti L e R presenti
// ===========================================================================
test.describe("US-063 — TouchOverlay GBA (mgba): pulsanti L/R presenti", () => {
  test(
    "TouchOverlay mgba — sb-touch-btn-l e sb-touch-btn-r visibili, data-has-shoulder=true",
    async ({ page }) => {
      const touchCtx = await isTouchContext(page);
      test.skip(
        !touchCtx,
        "Contesto non-touch (pointer:fine): TouchOverlay non visibile. " +
          "Eseguire con il progetto `mobile` (iPhone 13).",
      );

      await loadAndStartStubRom(page, "test.gba", "test GBA");

      // L'overlay deve essere montato (inputMapping wiring completato in TSK-123).
      const overlay = page.locator('[data-testid="sb-touch-overlay"]');
      await expect(overlay, "TouchOverlay non trovato nel DOM").toBeVisible({
        timeout: 5_000,
      });

      // US-063 §AC: i pulsanti L e R devono essere presenti per core mgba (GBA).
      await expect(
        page.locator('[data-testid="sb-touch-btn-l"]'),
        "Pulsante L assente per core mgba",
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="sb-touch-btn-r"]'),
        "Pulsante R assente per core mgba",
      ).toBeVisible();

      // Container shoulder marcato come data-has-shoulder=true.
      await expect(
        page.locator('[data-testid="sb-touch-buttons"]'),
      ).toHaveAttribute("data-has-shoulder", "true");
    },
  );
});

// ===========================================================================
// Test 3 — TouchOverlay gambatte (GB stub): pulsanti L e R assenti
// ===========================================================================
test.describe("US-063 — TouchOverlay GB (gambatte): pulsanti L/R assenti", () => {
  test(
    "TouchOverlay gambatte — sb-touch-btn-l e sb-touch-btn-r assenti, data-has-shoulder=false",
    async ({ page }) => {
      const touchCtx = await isTouchContext(page);
      test.skip(
        !touchCtx,
        "Contesto non-touch (pointer:fine): TouchOverlay non visibile. " +
          "Eseguire con il progetto `mobile` (iPhone 13).",
      );

      await loadAndStartStubRom(page, "test.gb", "test GB");

      // L'overlay deve essere montato.
      const overlay = page.locator('[data-testid="sb-touch-overlay"]');
      await expect(overlay, "TouchOverlay non trovato nel DOM").toBeVisible({
        timeout: 5_000,
      });

      // US-063 §AC: L e R NON devono essere presenti per core gambatte (GB).
      // GB non ha shoulder hardware → overlay esclude L/R (coreHasShoulderButtons).
      await expect(
        page.locator('[data-testid="sb-touch-btn-l"]'),
        "Pulsante L trovato per core gambatte: regressione US-063",
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="sb-touch-btn-r"]'),
        "Pulsante R trovato per core gambatte: regressione US-063",
      ).not.toBeVisible();

      // Container shoulder marcato come data-has-shoulder=false.
      await expect(
        page.locator('[data-testid="sb-touch-buttons"]'),
      ).toHaveAttribute("data-has-shoulder", "false");
    },
  );
});
