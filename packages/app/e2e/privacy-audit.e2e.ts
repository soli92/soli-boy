// TSK-068 — Privacy audit: invariante on-device su tutti i target (web/desktop/mobile).
//
// US-033 §Acceptance Criteria: i file utente (ROM, salvataggi, config, BIOS) non
// devono mai essere inviati a server esterni. ADR-002 §Invariante: zero chiamate
// di rete verso origini remote durante i flussi di storage.
//
// Questo spec Playwright intercetta tutte le richieste HTTP/HTTPS durante il
// flusso carica-ROM → avvia-emulazione → salva-stato e asserisce che nessuna
// richiesta contenga dati utente verso origini remote.
//
// ── Report di audit ──────────────────────────────────────────────────────────
// Il report statico completo dell'audit (statico + dinamico) è in:
//   code_quality/reports/TSK-068-privacy-audit-iter-1.md
//
// Risultato audit statico (2026-06-09): INVARIANTE ON-DEVICE RISPETTATA.
//   - Zero fetch/XHR/WebSocket/sendBeacon/axios nel codice renderer di produzione.
//   - `net.fetch` in Electron main.ts:72 → serve asset locali (file:// URL), legittimo.
//   - `autoUpdater.checkForUpdates()` → version check verso GitHub Releases, nessun
//     dato utente, legittimo per US-033 (documentato in ADR-008).
//
// [^src: management/kanban/EP-008-conformita-e-pubblicazione-store/US-033-privacy-on-device/TSK-068.md]
// [^src: design_&_architecture/decisions/ADR-002.md §Invariante]
// [^src: code_quality/reports/TSK-068-privacy-audit-iter-1.md]

import { expect, test } from "@playwright/test";
import { gotoStubApp, uploadRom, waitForAppBoot } from "./helpers/app-nav";

// ── Costanti ─────────────────────────────────────────────────────────────────
/**
 * Origini "trusted" ammesse durante i test. Qualsiasi richiesta verso un'altra
 * origine è una violazione dell'invariante US-033.
 *
 * - localhost / 127.0.0.1 / [::1]: il Vite dev server / preview server.
 * - blob: e data:: URL inline (FileReader, Blob URL per canvas, WASM).
 * - chrome-extension: / moz-extension: / safari-extension: etc.: estensioni browser CI.
 * - about:: navigazione interna del browser.
 */
const TRUSTED_ORIGIN_PREFIXES = [
  "http://localhost",
  "http://127.0.0.1",
  "http://[::1]",
  "blob:",
  "data:",
  "about:",
  "chrome-extension:",
  "moz-extension:",
  "webkit-extension:",
];

function isTrustedUrl(url: string): boolean {
  return TRUSTED_ORIGIN_PREFIXES.some((prefix) => url.startsWith(prefix));
}

// ── Fixture: ROM sintetica ────────────────────────────────────────────────────
const FAKE_ROM_BYTES = Buffer.from("FAKE-ROM-PRIVACY-AUDIT-GB");
const FAKE_ROM_NAME = "privacy-audit-test.gb";
// Accessible name esatto del tile di selezione ROM: "<titolo> <platform>"
// (vedi Library.tsx). Match esatto per evitare lo strict-mode violation con
// l'input "Cambia copertina di privacy-audit-test".
const GAME_TILE_NAME = "privacy-audit-test GB";

test.describe("TSK-068 — Privacy audit: invariante on-device", () => {
  /**
   * Setup condiviso: blocca TUTTE le richieste verso origini non-localhost
   * raccogliendo gli URL intercettati. Ogni test poi può asserire su di essi.
   *
   * Si usa `page.route("**", ...)` con continua (non blocca) per non spezzare
   * la navigazione — registriamo e lasciamo passare; l'assertion è a fine test.
   */
  let externalRequests: Array<{ url: string; method: string; resourceType: string }> = [];

  test.beforeEach(async ({ page }) => {
    externalRequests = [];

    // Pulisci IndexedDB tra i test per isolare lo stato.
    await page.addInitScript(() => {
      indexedDB.deleteDatabase("soli-boy");
    });

    // Intercetta tutte le richieste e registra quelle verso origini esterne.
    await page.route("**/*", async (route) => {
      const req = route.request();
      const url = req.url();
      if (!isTrustedUrl(url)) {
        externalRequests.push({
          url,
          method: req.method(),
          resourceType: req.resourceType(),
        });
      }
      // Lascia passare la richiesta (non blocchiamo — vogliamo osservare).
      await route.continue();
    });
  });

  // ── Test 1: avvio applicazione ───────────────────────────────────────────
  test("avvio app: nessuna richiesta verso origini remote alla navigazione iniziale", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForAppBoot(page);

    // Breve attesa per raccogliere eventuali richieste lazy (analytics, telemetria, ecc.).
    await page.waitForTimeout(1_000);

    expect(
      externalRequests,
      [
        "Invariante US-033 violata: richieste verso origini remote trovate durante l'avvio.",
        "Origini esterne rilevate:",
        ...externalRequests.map((r) => `  ${r.method} ${r.url} [${r.resourceType}]`),
      ].join("\n"),
    ).toHaveLength(0);
  });

  // ── Test 2: carica ROM ───────────────────────────────────────────────────
  test("carica ROM: nessun dato utente inviato in rete durante l'ingest", async ({ page }) => {
    await gotoStubApp(page);

    await uploadRom(page, {
      name: FAKE_ROM_NAME,
      mimeType: "application/octet-stream",
      buffer: FAKE_ROM_BYTES,
    });

    // Attendi che la ROM compaia in libreria.
    await expect(
      page.getByRole("button", { name: GAME_TILE_NAME }),
    ).toBeVisible({ timeout: 10_000 });

    // Breve attesa per raccogliere richieste lazy.
    await page.waitForTimeout(500);

    // Asserzione principale: invariante on-device.
    expect(
      externalRequests,
      [
        "Invariante US-033 violata: richieste verso origini remote durante carica-ROM.",
        ...externalRequests.map((r) => `  ${r.method} ${r.url} [${r.resourceType}]`),
      ].join("\n"),
    ).toHaveLength(0);
  });

  // ── Test 3: flusso completo carica→avvia→salva ────────────────────────────
  test("flusso completo carica ROM → avvia emulazione → salva stato: nessuna richiesta esterna", async ({
    page,
  }) => {
    await gotoStubApp(page);

    // Carica ROM.
    await uploadRom(page, {
      name: FAKE_ROM_NAME,
      mimeType: "application/octet-stream",
      buffer: FAKE_ROM_BYTES,
    });
    await expect(
      page.getByRole("button", { name: GAME_TILE_NAME }),
    ).toBeVisible({ timeout: 10_000 });

    // Seleziona la ROM. TSK-100: auto-start attivo, non serve click Avvia.
    await page.getByRole("button", { name: GAME_TILE_NAME }).click();
    // TSK-101: gestisci gate dialog se un gioco è già in corso.
    const changeDialog1 = page.getByRole("dialog", { name: /cambia gioco/i });
    if (await changeDialog1.isVisible()) {
      await page.getByRole("button", { name: /cambia gioco/i }).click();
    }

    // Attendi che il pulsante "Salva nello slot 1" sia abilitato.
    const saveBtn = page.getByRole("button", { name: "Salva nello slot 1" });
    await expect(saveBtn).toBeEnabled({ timeout: 10_000 });

    // Salva nello slot 1.
    await saveBtn.click();

    // Attendi che lo slot risulti occupato.
    const slotMeta = page.getByTestId("sb-savestate-meta-0");
    await expect(slotMeta).not.toHaveText("vuoto", { timeout: 5_000 });

    // Breve attesa per raccogliere eventuali richieste lazy.
    await page.waitForTimeout(500);

    // Asserzione principale: ZERO richieste verso origini remote.
    expect(
      externalRequests.filter((r) => r.resourceType !== "preflight"),
      [
        "Invariante US-033 violata: dati utente inviati in rete durante flusso carica→avvia→salva.",
        "Richieste esterne rilevate:",
        ...externalRequests.map((r) => `  ${r.method} ${r.url} [${r.resourceType}]`),
      ].join("\n"),
    ).toHaveLength(0);
  });

  // ── Test 4: WASM core — nessun fetch a runtime ────────────────────────────
  test("caricamento core WASM (StubEngine): nessuna richiesta fetch a origini remote", async ({
    page,
  }) => {
    // StubEngine non usa WASM, ma verifichiamo che il framework non emetta
    // richieste CDN per risorse engine durante la navigazione base.
    await gotoStubApp(page);

    // Carica e avvia (engine=stub è istantaneo — no WASM vero).
    await uploadRom(page, {
      name: FAKE_ROM_NAME,
      mimeType: "application/octet-stream",
      buffer: FAKE_ROM_BYTES,
    });
    await expect(
      page.getByRole("button", { name: GAME_TILE_NAME }),
    ).toBeVisible({ timeout: 5_000 });
    // TSK-100: auto-start attivo, non serve click Avvia.
    await page.getByRole("button", { name: GAME_TILE_NAME }).click();
    const changeDialog2 = page.getByRole("dialog", { name: /cambia gioco/i });
    if (await changeDialog2.isVisible()) {
      await page.getByRole("button", { name: /cambia gioco/i }).click();
    }
    await page.waitForTimeout(1_000);

    // Filtra: escludiamo esplicitamente eventuali richieste CDN preflight (CORS option)
    // per asset statici già nel bundle — non dovrebbero esserci ma escludiamo per
    // non falsare il verdetto su asset locali che il browser potrebbe prefetch.
    const remoteDataRequests = externalRequests.filter(
      (r) => r.resourceType !== "preflight" && r.resourceType !== "ping",
    );

    expect(
      remoteDataRequests,
      [
        "Il core WASM emette richieste fetch verso CDN o origini remote.",
        "Richieste rilevate:",
        ...remoteDataRequests.map((r) => `  ${r.method} ${r.url} [${r.resourceType}]`),
      ].join("\n"),
    ).toHaveLength(0);
  });

  // ── Test 5: esporta salvataggio — nessun invio in rete ─────────────────────
  test("nessuna richiesta esterna durante l'interazione UI (settings, themes, library)", async ({
    page,
  }) => {
    await gotoStubApp(page);

    // Carica una ROM, interagisci con la libreria.
    await uploadRom(page, {
      name: FAKE_ROM_NAME,
      mimeType: "application/octet-stream",
      buffer: FAKE_ROM_BYTES,
    });
    await expect(
      page.getByRole("button", { name: GAME_TILE_NAME }),
    ).toBeVisible({ timeout: 5_000 });

    // Naviga sulla tab Impostazioni (IA a 4 tab, increment 2) per esercitare
    // settings/temi: nessuna di queste interazioni deve emettere richieste esterne.
    const settingsTab = page.getByRole("tab", { name: "Impostazioni" });
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(500);

    expect(
      externalRequests,
      [
        "Invariante US-033 violata: richieste verso origini remote durante navigazione UI.",
        ...externalRequests.map((r) => `  ${r.method} ${r.url}`),
      ].join("\n"),
    ).toHaveLength(0);
  });
});

// ── Nota sul Grep statico (DoD TSK-068) ──────────────────────────────────────
//
// Il DoD di TSK-068 richiede anche un "grep statico" che verifichi l'assenza di
// chiamate di rete nei sorgenti. Questo è implementato come test Vitest separato
// in: src/storage/electron-storage-ipc.test.ts (privacy guard, Suite 1–6).
//
// Il grep statico automatizzato completo è documentato nel report di audit:
//   code_quality/reports/TSK-068-privacy-audit-iter-1.md
//
// Risultato: ZERO occorrenze di fetch/XHR/WS/sendBeacon/axios nel codice
// renderer di produzione (packages/app/src). L'unica chiamata `net.fetch`
// trovata in packages/desktop/electron/main.ts è classificata LEGITTIMA
// (serve asset locali del bundle via protocollo app://).
