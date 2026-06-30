// TSK-132 — EP-019: suite e2e RTC (set, persist, save-state, sync-to-device).
//
// Copertura flusso end-to-end del layer RTC di EP-019 usando StubEngine +
// StubRtcBridge (deterministico, nessuna ROM reale né WASM richiesta).
//
// Convenzioni:
// - URL param `?engine=stub&rtcPlatform=<platform>` per attivare RtcSection
//   in Settings (wiring ADR-009 §4, App.tsx TSK-132).
// - `gotoRtcStubApp(page, "gbc")` → app con StubRtcBridge + piattaforma GBC.
// - `gotoRtcStubApp(page, "gba")` → app con stub ma piattaforma GBA (no RTC).
// - IndexedDB pulito prima di ogni test (`page.addInitScript`).
//
// I 2 test skip (bridge concreto Sprint 16) sono marcati con il messaggio
// canonico: "bridge concreto Sprint 16 — ADR-009 §4 follow-up".

import { expect, test } from "@playwright/test";
import {
  gotoApp,
  gotoStubApp,
  openSettingsTab,
  selectLibraryTileAndAutoStart,
  uploadRom,
} from "./helpers/app-nav";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Naviga all'app in modalità stub con piattaforma RTC iniettata via URL param.
 * `?engine=stub&rtcPlatform=<platform>` attiva la RtcSection in Settings per
 * la piattaforma richiesta (ADR-009 §4 wiring introdotto in TSK-132).
 */
async function gotoRtcStubApp(
  page: import("@playwright/test").Page,
  platform: string,
): Promise<void> {
  await gotoApp(page, `/?engine=stub&rtcPlatform=${platform}`);
}

/** Pulisce IndexedDB e naviga all'app RTC stub. */
async function setupRtcPage(
  page: import("@playwright/test").Page,
  platform: string,
): Promise<void> {
  // F-005: deleteDatabase awaitable tramite addInitScript (si esegue prima che
  // l'app apra qualsiasi connessione IDB) + Promise sincrona (nessuna connessione
  // aperta → onsuccess fired immediatamente). L'addInitScript è scope-to-page
  // (non persiste sulla prossima navigazione in un nuovo page object, pattern
  // Playwright context-per-test). La Promise garantisce il completamento prima
  // del caricamento degli script dell'app.
  await page.addInitScript(
    () =>
      new Promise<void>((res) => {
        const r = indexedDB.deleteDatabase("soli-boy");
        r.onsuccess = r.onerror = () => res();
      }),
  );
  await gotoRtcStubApp(page, platform);
}

/** Apre Settings e torna al details accordion della RtcSection (aprendola se chiusa). */
async function openRtcSection(
  page: import("@playwright/test").Page,
): Promise<import("@playwright/test").Locator> {
  await openSettingsTab(page);
  const section = page.getByTestId("sb-rtc-section");
  // L'elemento è un <details>: lo apriamo se chiuso.
  const isOpen = await section.evaluate((el) => (el as HTMLDetailsElement).open);
  if (!isOpen) {
    await section.locator("summary").click();
  }
  return section;
}

/** Imposta un campo RTC e attende la propagazione. */
async function setRtcField(
  page: import("@playwright/test").Page,
  field: "year" | "month" | "day" | "hour" | "minute" | "second",
  value: string,
): Promise<void> {
  const input = page.getByTestId(`sb-rtc-${field}`);
  await input.fill(value);
}

// ---------------------------------------------------------------------------
// Descrizione test
// ---------------------------------------------------------------------------

test.describe("EP-019 RTC — visibilità condizionale (TSK-132)", () => {
  test("1. RtcSection assente in Settings su piattaforma GBA (no RTC)", async ({
    page,
  }) => {
    await setupRtcPage(page, "gba");
    await openSettingsTab(page);
    // La sezione RTC non deve essere presente nel DOM: hasRtc("gba") = false.
    await expect(page.getByTestId("sb-rtc-section")).not.toBeAttached();
  });

  test("2. RtcSection visibile in Settings su piattaforma GBC (con RTC)", async ({
    page,
  }) => {
    await setupRtcPage(page, "gbc");
    await openSettingsTab(page);
    // La sezione è nel DOM (anche se <details> chiuso). hasRtc("gbc") = true.
    await expect(page.getByTestId("sb-rtc-section")).toBeAttached();
    // Heading della sezione accessibile.
    await expect(
      page.getByRole("heading", { name: /orologio interno/i }),
    ).toBeAttached();
  });
});

test.describe("EP-019 RTC — form e validazione (TSK-132)", () => {
  test("3. I 6 campi anno/mese/giorno/ora/minuto/secondo sono presenti e modificabili", async ({
    page,
  }) => {
    await setupRtcPage(page, "gbc");
    await openRtcSection(page);

    const fields = ["year", "month", "day", "hour", "minute", "second"] as const;
    for (const field of fields) {
      const input = page.getByTestId(`sb-rtc-${field}`);
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute("type", "number");
      // Verifichiamo la modificabilità: fill + attesa valore.
      const testValues: Record<string, string> = {
        year: "2027",
        month: "6",
        day: "15",
        hour: "10",
        minute: "30",
        second: "45",
      };
      await input.fill(testValues[field]);
      await expect(input).toHaveValue(testValues[field]);
    }
  });

  test("4. Validazione UI — mese=13 → pulsante Imposta disabilitato + aria-invalid", async ({
    page,
  }) => {
    await setupRtcPage(page, "gbc");
    await openRtcSection(page);

    await setRtcField(page, "month", "13");

    // Pulsante "Imposta" disabilitato.
    const submitBtn = page.getByTestId("sb-rtc-submit");
    await expect(submitBtn).toBeDisabled();
    // Campo mese marcato aria-invalid="true".
    const monthInput = page.getByTestId("sb-rtc-month");
    await expect(monthInput).toHaveAttribute("aria-invalid", "true");
    // Messaggio errore visibile.
    await expect(page.getByTestId("sb-rtc-month-error")).toBeVisible();
  });

  test("5. Imposta — data/ora valida → click Imposta → conferma visibile", async ({
    page,
  }) => {
    // bridge.setRtcState assertion is covered at unit level in RtcSection.test.tsx
    await setupRtcPage(page, "gbc");
    await openRtcSection(page);

    // Imposta un valore valido completo.
    await setRtcField(page, "year", "2026");
    await setRtcField(page, "month", "6");
    await setRtcField(page, "day", "30");
    await setRtcField(page, "hour", "12");
    await setRtcField(page, "minute", "0");
    await setRtcField(page, "second", "0");

    // Il pulsante deve essere abilitato.
    const submitBtn = page.getByTestId("sb-rtc-submit");
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Messaggio di conferma visibile (role="status").
    await expect(page.getByTestId("sb-rtc-confirmed")).toBeVisible();
    await expect(page.getByTestId("sb-rtc-confirmed")).toContainText(
      /orologio interno impostato/i,
    );
  });
});

test.describe("EP-019 RTC — sync-to-device (TSK-132)", () => {
  // F-003: orologio fisso per rendere i test di sync deterministici a boundary temporale.
  // Playwright >= 1.45 richiesto (progetto: ^1.60.0 — conforme).
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2027-03-15T12:00:00Z"));
  });

  test("6. Usa ora del dispositivo → campi popolati con valori numerici plausibili (non zero)", async ({
    page,
  }) => {
    await setupRtcPage(page, "gbc");
    await openRtcSection(page);

    // Click su "Usa ora del dispositivo".
    const syncBtn = page.getByTestId("sb-rtc-sync-device");
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();

    // I campi devono mostrare l'anno corrente (≥ 2024) — valore plausibile non zero.
    const yearInput = page.getByTestId("sb-rtc-year");
    const yearValue = await yearInput.inputValue();
    const year = parseInt(yearValue, 10);
    expect(year).toBeGreaterThanOrEqual(2024);

    // Il mese deve essere 1-12 (non zero).
    const monthValue = await page.getByTestId("sb-rtc-month").inputValue();
    const month = parseInt(monthValue, 10);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);

    // Il giorno deve essere 1-31 (non zero).
    const dayValue = await page.getByTestId("sb-rtc-day").inputValue();
    const day = parseInt(dayValue, 10);
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(31);
  });

  test("9. RTC reset idempotente — click Usa ora del dispositivo due volte → campi consistenti", async ({
    page,
  }) => {
    await setupRtcPage(page, "gbc");
    await openRtcSection(page);

    const syncBtn = page.getByTestId("sb-rtc-sync-device");
    await syncBtn.click();
    const yearAfterFirst = await page.getByTestId("sb-rtc-year").inputValue();
    const monthAfterFirst = await page.getByTestId("sb-rtc-month").inputValue();

    // Seconda click (idempotente — i valori devono essere coerenti: stesso secondo
    // o al più un secondo dopo in caso di race; entrambe devono dare anno ≥ 2024).
    await syncBtn.click();
    const yearAfterSecond = await page.getByTestId("sb-rtc-year").inputValue();
    const monthAfterSecond = await page.getByTestId("sb-rtc-month").inputValue();

    // Anno e mese devono essere numericamente uguali (la differenza in secondi
    // non cambia anno o mese nel test — run in pochi ms).
    expect(yearAfterSecond).toBe(yearAfterFirst);
    expect(monthAfterSecond).toBe(monthAfterFirst);

    // I campi devono restare validi (pulsante Imposta abilitato).
    await expect(page.getByTestId("sb-rtc-submit")).toBeEnabled();
  });

  test("11. No network — nessuna chiamata di rete durante sync dispositivo", async ({
    page,
  }) => {
    // Intercettiamo qualsiasi richiesta di rete: nessuna deve partire durante il sync.
    const networkRequests: string[] = [];
    await page.route("**/*", (route, request) => {
      // Escludiamo le risorse statiche dell'app (js/css/html serviti da Vite).
      // F-004: filtro basato su resourceType() invece di pattern URL fragile.
      const staticTypes = ["document", "script", "stylesheet", "image", "font", "other"];
      if (!staticTypes.includes(request.resourceType())) {
        networkRequests.push(request.url());
      }
      void route.continue();
    });

    await setupRtcPage(page, "gbc");
    await openRtcSection(page);

    // Azzeriamo la lista dopo il boot (il boot può fare richieste a localhost).
    networkRequests.length = 0;

    const syncBtn = page.getByTestId("sb-rtc-sync-device");
    await syncBtn.click();

    // Nessuna richiesta esterna deve essere partita.
    expect(
      networkRequests,
      `Richieste di rete inattese durante sync RTC: ${networkRequests.join(", ")}`,
    ).toHaveLength(0);
  });
});

test.describe("EP-019 RTC — persistenza e save-state (TSK-132)", () => {
  test("7. Persistenza RTC on-stop — avvio sessione + impostazione RTC + stop → nessun errore UI", async ({
    page,
  }) => {
    await setupRtcPage(page, "gbc");

    // Carica una ROM GB stub e avvia la sessione.
    await uploadRom(page, {
      name: "ep019-rtc-test.gb",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("ROMDATA-EP019-GB"),
    });
    await selectLibraryTileAndAutoStart(page, "ep019-rtc-test GB");
    await expect(page.getByLabel("Schermo di gioco")).toBeVisible({ timeout: 10_000 });

    // Apre Settings e imposta i valori RTC.
    await openRtcSection(page);
    await setRtcField(page, "year", "2026");
    await setRtcField(page, "month", "6");
    await setRtcField(page, "day", "30");
    await setRtcField(page, "hour", "10");
    await setRtcField(page, "minute", "0");
    await setRtcField(page, "second", "0");
    await page.getByTestId("sb-rtc-submit").click();
    await expect(page.getByTestId("sb-rtc-confirmed")).toBeVisible();

    // Torna a Play e arresta la sessione.
    await page.getByRole("tab", { name: "Play" }).click();
    await page.getByRole("button", { name: /arresta/i }).click();

    // Nessun errore UI dopo lo stop (niente alert, niente eccezioni visible).
    await expect(
      page.locator('.sb-app .sb-note[role="alert"]'),
    ).not.toBeVisible();
    await expect(page.getByTestId("sb-storage-init-error")).not.toBeVisible();
  });

  test("8. Save-state con RTC — smoke test save + load non rompe l'UI", async ({
    page,
  }) => {
    await setupRtcPage(page, "gbc");

    // Carica e avvia una ROM GB stub.
    await uploadRom(page, {
      name: "ep019-save-test.gb",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("ROMDATA-EP019-SAVE"),
    });
    await selectLibraryTileAndAutoStart(page, "ep019-save-test GB");
    await expect(page.getByLabel("Schermo di gioco")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".sb-screen")).toHaveAttribute("data-state", "running", {
      timeout: 10_000,
    });

    // Slot 0 → label "slot 1".
    const saveBtn = page.getByRole("button", { name: "Salva nello slot 1" });
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();

    // Slot occupato (meta non più "vuoto").
    const slotMeta = page.getByTestId("sb-savestate-meta-0");
    await expect(slotMeta).not.toHaveText("vuoto", { timeout: 5_000 });

    // Load dal save state → nessun errore, screen ancora running.
    const loadBtn = page.getByRole("button", { name: "Carica slot 1" });
    await expect(loadBtn).toBeEnabled({ timeout: 5_000 });
    await loadBtn.click();

    // Nessun alert di errore.
    await expect(
      page.locator('.sb-app .sb-note[role="alert"]'),
    ).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("sb-storage-init-error")).not.toBeVisible();
    // Screen ancora visibile e in stato running.
    await expect(page.locator(".sb-screen")).toHaveAttribute("data-state", "running", {
      timeout: 5_000,
    });
  });
});

test.describe("EP-019 RTC — accessibilità base (TSK-132)", () => {
  test("10. Accessibilità base — heading RtcSection presente; nessun aria-hidden su elementi interattivi", async ({
    page,
  }) => {
    await setupRtcPage(page, "gbc");
    await openRtcSection(page);

    // Heading della sezione RTC visibile e accessibile.
    await expect(
      page.getByRole("heading", { name: /orologio interno/i }),
    ).toBeVisible();

    // I pulsanti RTC non devono avere aria-hidden="true".
    const submitBtn = page.getByTestId("sb-rtc-submit");
    const syncBtn = page.getByTestId("sb-rtc-sync-device");
    await expect(submitBtn).not.toHaveAttribute("aria-hidden", "true");
    await expect(syncBtn).not.toHaveAttribute("aria-hidden", "true");

    // Entrambi i pulsanti sono button semantici (niente tabindex=-1 da attributo
    // o aria-hidden che li escluderebbe dalla navigazione).
    await expect(submitBtn).toHaveAttribute("type", "button");
    await expect(syncBtn).toHaveAttribute("type", "button");

    // I campi input non hanno aria-hidden="true" quando validi.
    for (const field of ["year", "month", "day", "hour", "minute", "second"] as const) {
      await expect(page.getByTestId(`sb-rtc-${field}`)).not.toHaveAttribute(
        "aria-hidden",
        "true",
      );
    }
  });
});

// ---------------------------------------------------------------------------
// SKIP — bridge concreto Sprint 16 (ADR-009 §4 follow-up)
// ---------------------------------------------------------------------------

// F-007: pattern canonico test.describe.skip invece di test.skip(true, ...) dentro un describe.
test.describe.skip("EP-019 RTC — bridge concreto Sprint 16 [SKIP] — bridge concreto Sprint 16 — ADR-009 §4 follow-up", () => {
  test("[SKIP] Bridge reale Gambatte/MBC3 legge/scrive RTC (ROM Pokémon GBC con MBC3)", async ({
    page: _page,
  }) => {
    // Questo test richiede:
    // - WasmBoyRtcBridge implementato (Sprint 16).
    // - ROM Pokémon Gold/Silver/Crystal con cartuccia MBC3+RTC.
    // Atteso: getRtcState() non null dopo avvio, setRtcState() riflesso.
    void _page;
  });

  test("[SKIP] Bridge reale mGBA legge/scrive RTC (ROM GBA con S-3511A)", async ({
    page: _page,
  }) => {
    // Questo test richiede:
    // - MgbaRtcBridge implementato (Sprint 16).
    // - ROM GBA con chip S-3511A (es. Golden Sun, Pokémon Ruby/Sapphire).
    // Atteso: sezione RTC visibile; ROM GBA senza RTC → sezione non visibile.
    void _page;
  });
});
