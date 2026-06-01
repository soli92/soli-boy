# Digest CQRL — dev-agent-qa — Week 2026-22

Periodo: 2026-06-01 / 2026-W22
Generato da: code-reviewer@2.15.0

## TSK-034 — e2e save/load state reale (WasmBoy, GB) — iter-1 → passed

**Verdict finale:** passed (iter-1)
**Finding:** 1 low/advisory

### F-034-01 [QA-TEST-001] — advisory, low
**Titolo:** AC2 US-016 coperta da un solo slot nell'e2e — copertura multi-slot assente.

`packages/app/e2e/emulation-save.e2e.ts:23` — i test usano solo `SLOT = 0` (slot UI 1). US-016 AC2 ("più save state distinti") non ha verifica e2e dell'indipendenza tra slot. Gap di copertura, non una regressione.

**Suggerimento:** aggiungere un terzo test "salva slot 0 + slot 1 → meta indipendenti" oppure aggiungere un commento che dichiari esplicitamente che la copertura multi-slot è delegata ai test componente (SaveStatePanel).

---

## TSK-048 — E2e smoke test brand (favicon, manifest, logo header) — iter-1 → passed

**Verdict finale:** passed (iter-1)
**Finding:** 1 low/advisory

### F-048-01 [TS-IDIOM-002] — advisory, low
**Titolo:** Non-null assertion `manifestHref!` senza commento giustificativo.

`packages/app/e2e/brand.e2e.ts:18` — `getAttribute()` ritorna `string | null`. Il guard `expect(manifestHref).toBeTruthy()` rende l'assertion logicamente sicura, ma la regola TS-IDIOM-002 richiede un commento esplicito che ne documenti la sicurezza.

**Suggerimento:** aggiungere un commento inline dopo il guard: `// manifestHref e' truthy dopo il guard expect sopra` oppure una type-guard esplicita (`if (!manifestHref) throw new Error('manifest href not found')`).

---

## TSK-047 — Unit test ThemeSelector + useTheme (US-036) — iter-1 → passed

**Verdict finale:** passed (iter-1)
**Finding:** 1 low/advisory

### F-047-01 [QA-TEST-001] — advisory, low
**Titolo:** afterEach per data-theme assente nel describe useTheme di ThemeSelector.test.tsx.

`packages/app/src/components/ThemeSelector/ThemeSelector.test.tsx:89-143` — il describe `useTheme (TSK-044 / US-036)` esegue 4 test che scrivono su `document.documentElement` via l'hook reale, ma non include un afterEach che ripulisca l'attributo `data-theme`. A differenza di useTheme.test.ts (che ha correttamente `afterEach(() => document.documentElement.removeAttribute(DATA_THEME_ATTR))`), questo describe lascia l'attributo "sporco" tra test consecutivi nello stesso file. Il rischio e' latente: nessun test attuale fallisce, ma aggiungere un futuro test che assuma lo stato iniziale del DOM potrebbe produrre un falso verde o un falso rosso.

**Suggerimento:** aggiungere `afterEach(() => { document.documentElement.removeAttribute('data-theme'); })` nel blocco `describe('useTheme ...')` o a livello di file, allineandosi al pattern di useTheme.test.ts.

---

## TSK-052 — Cache Playwright + artefatti e2e + hardening CI (US-043) — iter-1 → passed

**Verdict finale:** passed (iter-1)
**Finding:** 1 low/advisory

### F-052-01 [GHA-ROBUST-001] — advisory, low
**Titolo:** Assunzione system deps runner non documentata inline nel YAML.

`.github/workflows/ci.yml:53-55` — lo step `Install Playwright browsers (Chromium only)` con `if: steps.playwright-cache.outputs.cache-hit != 'true'` salta `--with-deps` su cache-hit. L'assunzione che `ubuntu-latest` includa le system deps Chromium pre-installate e' corretta oggi ma non e' documentata nel YAML (solo in TSK-052.md §Nota). Un futuro manutentore potrebbe non capire perche' la condizione esiste e rimuoverla, oppure non capire perche' un failure su cache-hit e' da attribuire a system deps mancanti.

**Suggerimento:** aggiungere un commento YAML inline sullo step: `# Assunzione: ubuntu-latest include system deps Chromium (libglib, libnss...). Se job fallisce con "Missing system deps" su cache-hit, rimuovere la condizione if.`

---

## Positivi rilevati (da consolidare come pattern)

- Guardia `test.skip(!existsSync(romPath), ...)` a livello `describe` — pattern coerente con emulation-real.e2e.ts e emulation-gba.e2e.ts. Continuare a usarlo per tutti gli e2e su ROM opzionali.
- Selettori: `getByLabel`, `getByRole` con `name` esplicito, `getByTestId` — tutti robusti. Buon pattern da mantenere.
- `beforeEach` con `addInitScript` per reset IndexedDB — isolamento test corretto.
- `test.slow()` dichiarato in entrambi i test che coinvolgono WASM init — appropriato.
- Timeout differenziati (30_000ms per canvas WasmBoy, 5_000ms per stati UI) — proporzionati.
- Nessun asset protetto (solo dmg-acid2.gb MIT).
- (TSK-047) Separazione netta componente/hook: ThemeSelector.test.tsx copre la UI, useTheme.test.ts copre il hook in isolamento senza JSX — pattern da replicare per futuri hook+componente.
- (TSK-047) parseTheme unit pura con loop su UI_THEMES: il test testa il contratto della costante esportata, non un valore hardcoded — resiliente all'aggiunta di nuovi temi.
- (TSK-047) afterEach DOM cleanup in useTheme.test.ts: `document.documentElement.removeAttribute(DATA_THEME_ATTR)` — pattern corretto da usare per tutti i test che scrivono attributi globali sul DOM.
- (TSK-047) Asserzione save-reject a quattro assi: stato + DOM + warn.called + warn.calledWith stringa esatta + Error object — copertura completa del comportamento best-effort senza over-mocking.
