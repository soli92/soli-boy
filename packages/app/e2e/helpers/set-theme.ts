// TSK-073 — Helper Playwright riusabile per il pilotaggio deterministico del tema UI.
//
// PROBLEMA: `page.emulateMedia({ colorScheme })` non commuta il tema in soli-boy
// perché il tema è gestito da un theme selector esplicito persistito in IndexedDB
// (TSK-044), non dal media query OS `prefers-color-scheme`. Di conseguenza lo
// screenshot light e dark prodotti dal visual oracle senza questo helper sono
// byte-identici (blind-spot).
//
// SOLUZIONE: scrivere la chiave canonica `"ui-theme"` nello store `config`
// dell'IndexedDB `soli-boy` tramite `page.evaluate` (awaitable — la Promise
// si risolve dopo il commit della tx IDB) e poi ricaricare la pagina, in modo
// che `useTheme` legga il valore già persistito all'hydration.
// In alternativa, il tema può essere pilotato via ThemeSelector UI.
//
// FAIL-LOUD: l'helper lancia un errore esplicito se:
//   - il valore scritto in IndexedDB non corrisponde al `data-theme` atteso dopo
//     la navigazione (la chiave/lo store è cambiato e il blind-spot si ripresenta).
//   - il tema passato non è tra i valori validi.
//   - la scrittura IDB fallisce per qualsiasi motivo.
//
// CHIAVE CANONICA (single source of truth — verificata nel codice TSK-044):
//   DB_NAME  : "soli-boy"        (db.ts › DB_NAME)
//   STORE    : "config"          (db.ts › SoliBoyDB › config)
//   KEY      : "ui-theme"        (theme-port.ts › UI_THEME_KEY)
//   RECORD   : { key: string, value: unknown }  (types.ts › ConfigRecord)
//   DOM ATTR : data-theme su <html>             (useTheme.ts › DATA_THEME_ATTR)

import type { Page } from "@playwright/test";
import { UI_THEMES } from "../../src/components/ThemeSelector/useTheme";

// ---- Costanti canoniche (derivate direttamente dal codice TSK-044) ----------------

/** Nome del database IndexedDB (src/storage/db.ts › DB_NAME). */
export const SOLI_BOY_DB_NAME = "soli-boy";

/** Nome dell'object store di configurazione (src/storage/db.ts › SoliBoyDB). */
export const CONFIG_STORE_NAME = "config";

/** Chiave canonica del tema (src/components/ThemeSelector/theme-port.ts › UI_THEME_KEY). */
export const UI_THEME_KEY = "ui-theme";

/** Attributo DOM che veicola il tema su <html> (src/components/ThemeSelector/useTheme.ts › DATA_THEME_ATTR). */
export const DATA_THEME_ATTR = "data-theme";

/** Temi validi — single source of truth da useTheme.ts › UI_THEMES. */
export const VALID_THEMES = UI_THEMES;
export type UiTheme = (typeof VALID_THEMES)[number];

// ---- Strategia 1: IndexedDB + reload (preferita) ---------------------------------

/**
 * Imposta il tema applicativo scrivendo la chiave canonica `"ui-theme"` nello
 * store `config` dell'IndexedDB `soli-boy`, poi ricarica la pagina in modo che
 * `useTheme` legga il valore persistito all'hydration.
 *
 * Sequenza:
 *   1. Naviga su `appUrl` (se la pagina non è già lì) in modo che il DB venga
 *      creato con la struttura corretta dall'app al primo avvio.
 *   2. Scrive `{ key: "ui-theme", value: theme }` via `page.evaluate`
 *      (awaitable: la Promise si risolve solo dopo il commit della tx IDB).
 *   3. Ricarica la pagina (`page.reload`) così React rileva il valore al mount.
 *
 * Fail-loud: dopo il reload verifica che `data-theme` su `<html>` corrisponda
 * al tema atteso. Se non coincide lancia un errore esplicito che descrive
 * la causa (la chiave/lo store è cambiato e il blind-spot si ripresenta).
 *
 * @param page   Playwright Page.
 * @param theme  Valore tema da impostare (`"90s-party"`, `"dark"`, `"cyberpunk"`).
 * @param appUrl URL relativo dell'app da usare (default `"/"`).
 */
export async function setThemeViaDB(
  page: Page,
  theme: UiTheme,
  appUrl = "/",
): Promise<void> {
  assertValidTheme(theme);

  // Prima navigazione: assicura che il DB sia inizializzato dall'app con la
  // struttura corretta (upgrade handler di db.ts crea lo store `config`).
  const currentUrl = page.url();
  if (!currentUrl || currentUrl === "about:blank") {
    await page.goto(appUrl);
  }
  // Attende il completamento del parsing DOM in modo che l'app abbia avuto la
  // possibilità di eseguire openDB/upgrade e creare lo store `config` prima che
  // page.evaluate apra il DB. Senza questa attesa, su contesti di storage freschi
  // (es. Playwright isolatedStorage) la open senza versione può creare un DB vuoto
  // prima che l'upgrade handler dell'app venga invocato.
  await page.waitForLoadState("domcontentloaded");

  // Scrittura IDB tramite `page.evaluate`: la Promise si risolve dopo il commit
  // della transazione, quindi la scrittura è garantita prima del reload.
  const writeResult = await page.evaluate(
    ({
      dbName,
      storeName,
      key,
      value,
    }: {
      dbName: string;
      storeName: string;
      key: string;
      value: string;
    }) => {
      return new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
        // Apriamo senza specificare la versione: usiamo quella già aperta
        // dall'app per non triggerare un upgrade inatteso.
        const req = indexedDB.open(dbName);
        req.onerror = () =>
          resolve({
            ok: false,
            error: `IDB open error: ${req.error?.message ?? "unknown"}`,
          });
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.close();
            resolve({
              ok: false,
              error:
                `store "${storeName}" non trovato in DB "${dbName}" (versione ${db.version}). ` +
                `Cause possibili: (1) DB non ancora inizializzato dall'app (invocare setThemeViaDB ` +
                `solo dopo che l'app ha completato il caricamento); ` +
                `(2) la struttura del DB è cambiata — verificare CONFIG_STORE_NAME in set-theme.ts.`,
            });
            return;
          }
          const tx = db.transaction(storeName, "readwrite");
          const putReq = tx.objectStore(storeName).put({ key, value });
          putReq.onerror = () =>
            resolve({
              ok: false,
              error: `IDB put error: ${putReq.error?.message ?? "unknown"}`,
            });
          tx.oncomplete = () => {
            db.close();
            resolve({ ok: true });
          };
          tx.onerror = () =>
            resolve({
              ok: false,
              error: `IDB tx error: ${tx.error?.message ?? "unknown"}`,
            });
        };
      });
    },
    {
      dbName: SOLI_BOY_DB_NAME,
      storeName: CONFIG_STORE_NAME,
      key: UI_THEME_KEY,
      value: theme,
    },
  );

  if (!writeResult.ok) {
    throw new Error(
      `[set-theme] FAIL-LOUD: scrittura IndexedDB fallita — ${writeResult.error} ` +
        `(TSK-073). Aggiornare UI_THEME_KEY / CONFIG_STORE_NAME in set-theme.ts.`,
    );
  }

  // Reload: l'app legge `"ui-theme"` da IDB al mount via `useTheme` (async effect).
  await page.reload();

  // TSK-102: dopo il reload, React esegue in sequenza più hook che leggono
  // da ConfigPort in parallelo (useTheme, useAutoStartConfig, useHapticsConfig,
  // useVideoSettings, usePrivacyAck). Ogni lettura IDB può aggiungersi al tempo
  // di hydration totale. Attendiamo che il JS applicativo abbia eseguito i
  // microtask post-render prima di interrogare il DOM.
  await page.waitForLoadState("load");

  // Attende che `useTheme` completi il `port.load()` e applichi `data-theme`.
  // Usiamo `waitForFunction` con polling invece di un timeout fisso per essere
  // deterministici: il test avanza non appena il DOM riflette il valore corretto.
  // Timeout aumentato a 10s per coprire la latenza aggiuntiva introdotta dai
  // nuovi hook ConfigPort (TSK-102: auto-start-from-library).
  const applied = await page.waitForFunction(
    ({ attr, expected }: { attr: string; expected: string }) =>
      document.documentElement.getAttribute(attr) === expected,
    { attr: DATA_THEME_ATTR, expected: theme },
    { timeout: 10_000, polling: 100 },
  ).then(() => true).catch(() => false);

  if (!applied) {
    // Fail-loud: leggiamo il valore effettivo per un messaggio di errore utile.
    await assertThemeApplied(page, theme);
  }
}

// ---- Strategia 2: Pilotaggio UI (fallback / test interazione) --------------------

/**
 * Imposta il tema applicativo interagendo con il `<select>` del ThemeSelector
 * **dopo** la navigazione. Utile quando si vuole testare l'interazione utente
 * o quando la strategia IndexedDB non è applicabile.
 *
 * Fail-loud: verifica che il `data-theme` coincida con `theme` dopo la selezione.
 *
 * @param page  Playwright Page (dopo page.goto).
 * @param theme Valore tema da selezionare.
 */
export async function setThemeViaSelector(page: Page, theme: UiTheme): Promise<void> {
  assertValidTheme(theme);

  // IA a 4 tab (increment 2): il ThemeSelector vive nella sezione "Aspetto"
  // della tab Impostazioni, dentro un accordion item chiuso di default.
  // Navighiamo alla tab e apriamo l'accordion prima di localizzare il <select>.
  // Idempotente: se tab/accordion non esistono (UI legacy single-screen)
  // prosegue invariato.
  //
  // TSK-149 (EP-020 / US-097) — Migrata da `<details>/<summary>` nativo a solids
  // `Accordion` (Radix): il trigger è un `<button>` con `data-state=open|closed`.
  // Riformulato il gate su `data-state` invece di `HTMLDetailsElement.open`.
  const settingsTab = page.getByRole("tab", { name: "Impostazioni" });
  if ((await settingsTab.count()) > 0) {
    await settingsTab.click();
    const aspettoTrigger = page.getByRole("button", {
      name: /^Aspetto — tema UI$/i,
    });
    if ((await aspettoTrigger.count()) > 0) {
      const state = await aspettoTrigger.getAttribute("data-state");
      if (state !== "open") await aspettoTrigger.click();
    }
  }

  const select = page.getByLabel("Tema dell'interfaccia");
  const count = await select.count();
  if (count === 0) {
    throw new Error(
      `[set-theme] FAIL-LOUD: ThemeSelector non trovato (aria-label "Tema dell'interfaccia"). ` +
        `La UI del tema è cambiata — aggiornare set-theme.ts o verificare il componente ThemeSelector.`,
    );
  }

  await select.selectOption(theme);

  // Fail-loud post-selezione: verifica che il DOM rifletta il tema atteso.
  await assertThemeApplied(page, theme);
}

// ---- Utility -----------------------------------------------------------------

/**
 * Legge il tema corrente dal `data-theme` di `<html>`.
 * Ritorna `null` se l'attributo non è presente.
 */
export async function getCurrentTheme(page: Page): Promise<string | null> {
  return page.evaluate(
    (attr) => document.documentElement.getAttribute(attr),
    DATA_THEME_ATTR,
  );
}

/**
 * Rimuove la chiave `"ui-theme"` dallo store `config` di IndexedDB tramite
 * `page.evaluate`. Utile nei test per azzerare la preferenza persistita.
 * NB: richiedere una pagina già navigata (non `about:blank`).
 */
export async function clearThemeInDB(page: Page): Promise<void> {
  await page.evaluate(
    ({ dbName, storeName, key }) => {
      return new Promise<void>((resolve) => {
        const req = indexedDB.open(dbName);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.close();
            resolve();
            return;
          }
          const tx = db.transaction(storeName, "readwrite");
          tx.objectStore(storeName).delete(key);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            console.warn("[set-theme] clearThemeInDB: errore IDB (best-effort, il test continua):", tx.error);
            resolve(); // best-effort: non blocchiamo il test su errori di clear
          };
        };
        req.onerror = () => {
          console.warn("[set-theme] clearThemeInDB: errore IDB (best-effort, il test continua):", req.error);
          resolve(); // best-effort
        };
      });
    },
    {
      dbName: SOLI_BOY_DB_NAME,
      storeName: CONFIG_STORE_NAME,
      key: UI_THEME_KEY,
    },
  );
}

// ---- Helpers interni ---------------------------------------------------------

/**
 * Verifica che `document.documentElement[data-theme]` corrisponda al tema atteso.
 * Lancia un errore esplicito (fail-loud) se non coincide, in modo che il blind-spot
 * non si ripresenti silenziosamente.
 */
async function assertThemeApplied(page: Page, expected: UiTheme): Promise<void> {
  const actual = await getCurrentTheme(page);
  if (actual !== expected) {
    throw new Error(
      `[set-theme] FAIL-LOUD: data-theme atteso "${expected}", trovato "${actual ?? "(assente)"}". ` +
        `La chiave/canale di persistenza del tema è cambiata — aggiornare UI_THEME_KEY / ` +
        `CONFIG_STORE_NAME / DATA_THEME_ATTR in set-theme.ts (TSK-073).`,
    );
  }
}

/**
 * Lancia un errore se `theme` non è tra i valori di `VALID_THEMES`.
 * Garantisce che le nuove varianti vengano censite esplicitamente qui
 * invece di propagare un `data-theme` sconosciuto.
 */
function assertValidTheme(theme: string): asserts theme is UiTheme {
  if (!(VALID_THEMES as readonly string[]).includes(theme)) {
    throw new Error(
      `[set-theme] FAIL-LOUD: tema "${theme}" non è tra i valori validi [${VALID_THEMES.join(", ")}]. ` +
        `Se è stato aggiunto un nuovo tema aggiornare VALID_THEMES in set-theme.ts (TSK-073).`,
    );
  }
}
