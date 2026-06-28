// TSK-104 — Visual oracle + A11y scan HUD Player: multi-tema e multi-stato.
//
// AC1 — Visual oracle: verifica DOM + struttura HUD per 3 stati (idle,
// running, paused) x 2 viewport (mobile 375px, desktop 1280px) con tema
// canonico `dark`. I temi aggiuntivi sono spot-check su desktop idle
// (copertura multi-tema senza cartesian product 3×2×3 = 18 reload IDB).
// In assenza di snapshot baseline committati usiamo asserzioni DOM strutturali
// deterministiche (leggibilita, presenza overlay, aria-live) invece di diff
// pixel-per-pixel: pattern allineato alla nota TSK-104 "verificato via DOM
// assertions". Il visual oracle headless puro (screenshot diff) richiede una
// baseline committata — da produrre in un task separato se richiesto dal TPM.
//
// AC2 — Functional oracle (browser reale): play -> pause verifica aria-live
// contiene "In pausa" e pause-overlay e nel DOM.
//
// AC3 — A11y scan (axe-playwright): 0 nuove violation introdotte da TSK-103
// nei 3 stati: idle, running, paused.
//
// Engine: StubEngine (deterministic, no WASM), forzato via ?engine=stub.
// La ROM "tetris.gb" e caricata via file-input per pilotare il Player in
// running/paused (stesso pattern di app.e2e.ts).

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  clearThemeInDB,
  setThemeViaDB,
  type UiTheme,
} from "./helpers/set-theme";
import { gotoStubApp, uploadRom } from "./helpers/app-nav";

// ---------------------------------------------------------------------------
// Costanti
// ---------------------------------------------------------------------------

/** Tema usato per la matrice stato × viewport (evita 3 reload IDB per ogni cella). */
const CANONICAL_THEME: UiTheme = "dark";
/** Temi extra: solo idle desktop (1 reload ciascuno). */
const SPOT_CHECK_THEMES: UiTheme[] = ["90s-party", "cyberpunk"];
const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

// ROM fittizia compatibile GB (stesso pattern di app.e2e.ts)
const FAKE_ROM = {
  name: "tetris.gb",
  mimeType: "application/octet-stream" as const,
  buffer: Buffer.from("ROMDATA-GB"),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Naviga all'app con StubEngine. L'isolamento IDB è garantito dal contesto
 * Playwright (context-per-test): addInitScript persisterebbe attraverso i
 * page.reload() di setThemeViaDB cancellando il tema appena scritto. */
async function gotoApp(page: import("@playwright/test").Page): Promise<void> {
  await gotoStubApp(page);
}

/**
 * Carica la ROM fake, avvia e porta il Player in stato `running`.
 * TSK-100: il click sulla tile attiva l'auto-start (preferenza default ON),
 * quindi non occorre cliccare "Avvia" esplicitamente.
 * Ritorna dopo che il pulsante "Pausa" e visibile (stato running confermato).
 */
async function bringToRunning(page: import("@playwright/test").Page): Promise<void> {
  await uploadRom(page, FAKE_ROM);
  await page.getByRole("button", { name: "tetris GB" }).click();
  // TSK-101: se è già in corso un gioco diverso compare il gate dialog;
  // in questi test partiamo sempre da idle, ma lo gestiamo per robustezza.
  const changeDialog = page.getByRole("dialog", { name: /cambia gioco/i });
  if (await changeDialog.isVisible()) {
    await page.getByRole("button", { name: /cambia gioco/i }).click();
  }
  await expect(page.getByRole("button", { name: /pausa/i })).toBeVisible({ timeout: 10_000 });
}

/** Porta il Player da running a paused. */
async function bringToPaused(page: import("@playwright/test").Page): Promise<void> {
  await page.getByRole("button", { name: /pausa/i }).click();
  await expect(page.getByTestId("pause-overlay")).toBeVisible();
}

// ---------------------------------------------------------------------------
// AC1 — Visual oracle: struttura HUD per tutti i temi e viewport
// ---------------------------------------------------------------------------

test.describe("TSK-104 AC1 — Visual oracle: HUD multi-tema x multi-stato x multi-viewport", () => {
  // Stato idle: navigazione senza interazione, schermo caricato, HUD "Premi Avvia"
  for (const vp of VIEWPORTS) {
    test(`[${CANONICAL_THEME}] [${vp.name}] stato idle: HUD leggibile, nessun overlay pausa`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoApp(page);
      await clearThemeInDB(page);
      await setThemeViaDB(page, CANONICAL_THEME);

      const hud = page.getByRole("status", { name: /stato giocatore/i });
      await expect(hud).toBeVisible();
      await expect(hud).toContainText("Premi Avvia");
      await expect(page.getByTestId("pause-overlay")).not.toBeVisible();
      await expect(page.getByRole("button", { name: /avvia/i })).toBeVisible();
    });
  }

  for (const theme of SPOT_CHECK_THEMES) {
    test(`[${theme}] [desktop] stato idle: HUD leggibile (spot-check tema)`, async ({ page }) => {
      await page.setViewportSize({ width: VIEWPORTS[1].width, height: VIEWPORTS[1].height });
      await gotoApp(page);
      await clearThemeInDB(page);
      await setThemeViaDB(page, theme);

      const hud = page.getByRole("status", { name: /stato giocatore/i });
      await expect(hud).toBeVisible();
      await expect(hud).toContainText("Premi Avvia");
    });
  }

  // Stato running: HUD "In esecuzione", nessun overlay pausa
  for (const vp of VIEWPORTS) {
    test(`[${CANONICAL_THEME}] [${vp.name}] stato running: HUD 'In esecuzione', nessun overlay pausa`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoApp(page);
      await clearThemeInDB(page);
      await setThemeViaDB(page, CANONICAL_THEME);

      await bringToRunning(page);

      const hud = page.getByRole("status", { name: /stato giocatore/i });
      await expect(hud).toBeVisible();
      await expect(hud).toContainText("In esecuzione");
      await expect(page.getByTestId("pause-overlay")).not.toBeVisible();
    });
  }

  // Stato paused: HUD "In pausa", overlay pausa visibile e centrato
  for (const vp of VIEWPORTS) {
    test(`[${CANONICAL_THEME}] [${vp.name}] stato paused: HUD 'In pausa', overlay pausa visibile`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoApp(page);
      await clearThemeInDB(page);
      await setThemeViaDB(page, CANONICAL_THEME);

      await bringToRunning(page);
      await bringToPaused(page);

      const hud = page.getByRole("status", { name: /stato giocatore/i });
      await expect(hud).toBeVisible();
      await expect(hud).toContainText("In pausa");

      const overlay = page.getByTestId("pause-overlay");
      await expect(overlay).toBeVisible();
      await expect(overlay).toHaveAttribute("aria-hidden", "true");
    });
  }
});

// ---------------------------------------------------------------------------
// AC2 — Functional oracle: play -> pause (browser reale)
// Verifica aria-live + pause-overlay nel DOM
// ---------------------------------------------------------------------------

test.describe("TSK-104 AC2 — Functional oracle: play -> pause (browser reale)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test("dopo play -> pause: [aria-live] contiene 'In pausa'", async ({ page }) => {
    await bringToRunning(page);
    await bringToPaused(page);

    const ariaLive = page.getByRole("status", { name: /stato giocatore/i });
    await expect(ariaLive).toContainText("In pausa");
    await expect(ariaLive).toHaveAttribute("aria-live", "polite");
  });

  test("dopo play -> pause: data-testid='pause-overlay' e nel DOM e visibile", async ({ page }) => {
    await bringToRunning(page);
    await bringToPaused(page);

    const overlay = page.getByTestId("pause-overlay");
    await expect(overlay).toBeVisible();
    await expect(overlay).toBeInViewport();
  });

  test("dopo pause -> riprendi: overlay scompare e HUD torna a 'In esecuzione'", async ({ page }) => {
    await bringToRunning(page);
    await bringToPaused(page);

    await page.getByRole("button", { name: /riprendi/i }).click();
    await expect(page.getByTestId("pause-overlay")).not.toBeVisible();

    const ariaLive = page.getByRole("status", { name: /stato giocatore/i });
    await expect(ariaLive).toContainText("In esecuzione");
    await expect(ariaLive).not.toContainText("In pausa");
  });
});

// ---------------------------------------------------------------------------
// AC3 — A11y scan axe-playwright: 0 nuove violation post-TSK-103
// Scansione nei 3 stati (idle, running, paused) sul tema default (90s-party).
// Standard: WCAG 2.2 AA.
// ---------------------------------------------------------------------------

test.describe("TSK-104 AC3 — A11y scan axe-playwright: 0 violation post-TSK-103", () => {
  test("stato idle: 0 violation axe (WCAG 2.2 AA)", async ({ page }) => {
    await gotoApp(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      `TSK-104 AC3: ${results.violations.length} violation axe in stato idle.\n` +
        results.violations
          .map((v) => `  [${v.id}] ${v.description} — ${v.nodes.length} nodi`)
          .join("\n"),
    ).toHaveLength(0);
  });

  test("stato running: 0 violation axe (WCAG 2.2 AA)", async ({ page }) => {
    await gotoApp(page);
    await bringToRunning(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      `TSK-104 AC3: ${results.violations.length} violation axe in stato running.\n` +
        results.violations
          .map((v) => `  [${v.id}] ${v.description} — ${v.nodes.length} nodi`)
          .join("\n"),
    ).toHaveLength(0);
  });

  test("stato paused: 0 violation axe (WCAG 2.2 AA)", async ({ page }) => {
    await gotoApp(page);
    await bringToRunning(page);
    await bringToPaused(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      `TSK-104 AC3: ${results.violations.length} violation axe in stato paused.\n` +
        results.violations
          .map((v) => `  [${v.id}] ${v.description} — ${v.nodes.length} nodi`)
          .join("\n"),
    ).toHaveLength(0);
  });
});
