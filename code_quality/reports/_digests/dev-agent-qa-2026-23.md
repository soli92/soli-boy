# Digest CQRL — dev-agent-qa — Week 2026-23

Periodo: 2026-06-03 / 2026-W23
Generato da: code-reviewer v2.17

## TSK-073 — Visual oracle render harness: pilotaggio tema per copertura dark — iter-1 → conditional

**Verdict finale:** conditional (iter-1, max_iterations=3)
**Finding:** 0 high | 3 medium | 1 low

---

### F-1 [TS-ROBUST-001] — medium

**Titolo:** Race condition latente in setThemeViaDB: IDB aperto senza versione prima che l'app abbia inizializzato il DB.

`packages/app/e2e/helpers/set-theme.ts:79-83,99-101` — La guardia `if (!currentUrl || currentUrl === 'about:blank')` non garantisce che il DB sia stato inizializzato dall'app prima dell'open via page.evaluate. Su un context Playwright fresco, `indexedDB.open(dbName)` senza versione crea un DB vuoto senza upgrade handler — lo store 'config' non esiste, il FAIL-LOUD scatta correttamente ma il messaggio di errore indica 'aggiornare CONFIG_STORE_NAME' anziché segnalare che il DB non è stato ancora inizializzato dall'app.

**Suggerimento:** Aggiungere `await page.waitForLoadState('domcontentloaded')` (o selector applicativo radice) dopo la navigazione, prima di page.evaluate. Oppure documentare esplicitamente nel JSDoc che il caller deve garantire navigazione e load state completo, e aggiornare il messaggio di errore per indicare la causa corretta.

---

### F-2 [QA-TEST-001] — medium

**Titolo:** `waitForTimeout(300)` con magic number quattro volte nel test e2e — pattern flaky-prone.

`packages/app/e2e/theme-dark-regression.e2e.ts:48,55,79,84` — Quattro `page.waitForTimeout(300)` come buffer per le transizioni CSS prima degli screenshot. Il resto della codebase e2e usa asserzioni basate su locator. setThemeViaDB usa già correttamente `waitForFunction` per il data-theme — il test può rimuovere i waitForTimeout e aspettare un elemento UI stabile o direttamente `expect(page.locator('html')).toHaveAttribute('data-theme', theme)`.

**Suggerimento:** Sostituire ogni `waitForTimeout(300)` con `await expect(page.locator('html')).toHaveAttribute('data-theme', temaCorrente)` prima di ogni screenshot. Eliminare i magic number fissi.

---

### F-3 [TS-DESIGN-001] — medium

**Titolo:** `VALID_THEMES` in set-theme.ts è una copia di `UI_THEMES` di useTheme.ts — due punti di aggiornamento divergenti.

`packages/app/e2e/helpers/set-theme.ts:45-46` — I valori `['90s-party', 'dark', 'cyberpunk']` sono copiati letteralmente da useTheme.ts senza derivarli dalla costante esportata `UI_THEMES`. Quando viene aggiunto un quarto tema, il dev deve aggiornare sia useTheme.ts sia set-theme.ts — e se dimentica set-theme.ts, assertValidTheme non lo rileva e il VALID_THEMES rimane stale.

**Suggerimento:** Importare `UI_THEMES` da `../../src/components/ThemeSelector/useTheme` e assegnare `export const VALID_THEMES = UI_THEMES;`. La dipendenza da src/ negli helper e2e è accettabile per i test tooling-only.

---

### F-4 [TS-ROBUST-001] — low

**Titolo:** `clearThemeInDB` swallowa silenziosamente errori IDB senza log — diverge dalla filosofia fail-loud dichiarata nel file.

`packages/app/e2e/helpers/set-theme.ts:236-241` — I rami `req.onerror` e `tx.onerror` chiamano `resolve()` silenziosamente. Il best-effort è corretto per un helper di teardown (non deve bloccare la suite), ma il file dichiara esplicitamente la filosofia fail-loud e useTheme.ts usa console.warn per fallimenti di persistenza. Un errore silenzioso può mascherare problemi di stato (DB non raggiungibile) che causano fallimenti non ovvi nel test successivo.

**Suggerimento:** Aggiungere `console.warn('[set-theme] clearThemeInDB: errore IDB (best-effort, il test continua):', req.error ?? tx.error)` nei rami onerror, senza lanciare eccezioni.

---

## Positivi da consolidare

- Confronto md5 in-memory senza baseline committata: scelta corretta e documentata. Evita il falso-negativo dei test `toMatchSnapshot` con baseline obsoleta — pattern da replicare in futuri test screenshot.
- `waitForFunction` con polling 100ms usato in setThemeViaDB per attendere il data-theme: deterministico, race-free, senza magic number. Usare lo stesso pattern nel file di test (F-2 sopra).
- `assertThemeApplied` fattorizzata come funzione interna condivisa tra le due strategie: zero duplicazione della logica di verifica.
- Costanti esportate (SOLI_BOY_DB_NAME, CONFIG_STORE_NAME, UI_THEME_KEY, DATA_THEME_ATTR) con JSDoc che citano il file sorgente canonico — facilita la tracciabilità e il recovery su drift.
- `setThemeViaSelector` usa `page.getByLabel` con aria-label canonico invece di selettori CSS — idiomatico Playwright, resiliente ai refactoring UI.
- Test di fail-loud con `@ts-expect-error` e commento intenzionale — pattern idiomatico per test negativi tipizzati in TypeScript.
- Runbook `visual-oracle-installation.md` aggiornato con sezione dedicata al pilotaggio tema soli-boy (DoD rispettato, documentazione di contesto eccellente).
