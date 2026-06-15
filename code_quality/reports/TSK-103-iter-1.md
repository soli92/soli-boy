# Code Review — TSK-103 iter-1

**TSK:** TSK-103 — HUD Player user-facing: romTitle + stati italiani + overlay pausa
**Data:** 2026-06-15
**Reviewer:** code-reviewer v2.21 (claude-sonnet-4-6)
**Iter:** 1 / 3 (max_iterations: 3)

---

## Stack rilevato

| Voce | Valore |
|---|---|
| Linguaggio | TypeScript |
| Framework | React 18 |
| Stack mode | guided (confidence: 0.97) |
| File toccati | Player.tsx, Player.test.tsx |

---

## Verdict: `conditional`

3 finding (1 high, 1 medium, 1 low). Il finding F-103-01 (high) è bloccante: bare text node orfano dentro `.sb-screen` non rimosso dalla migrazione TSK-103.

---

## Findings

### F-103-01 — Testo di stato orfano rimasto dentro .sb-screen [HIGH]

**Regola:** `[^rule: code_quality/rules/canonical/REACT-IDIOM-001.md §Rationale]`
**Passata:** design
**File:** `[^src5: packages/app/src/components/Player/Player.tsx:455]`

La riga 455 contiene:

```tsx
{running ? (title ?? HUD_STATE_LABELS.running) : paused ? HUD_STATE_LABELS.paused : HUD_STATE_LABELS.idle}
```

Questo bare text node era presente nel codice pre-TSK-103 come display grezzo degli stati (`{running ? (title ?? "In esecuzione") : paused ? "In pausa" : "Premi Avvia"}`). TSK-103 ha correttamente introdotto il `.sb-hud` (righe 519-525) con `aria-live="polite"` e `aria-atomic="true"` come display ufficiale, ma ha aggiornato le stringhe della riga 455 alle costanti `HUD_STATE_LABELS` senza rimuovere il nodo.

**Effetti:**
- In stato `running` il titolo ROM (es. "Pokemon Red") appare come testo non wrappato sopra il canvas, senza semantica DOM, senza ARIA, senza stile.
- Il testo di stato appare in due punti del DOM: dentro `.sb-screen` e dentro `.sb-hud`.
- I test sono stati adattati alla duplicazione (`findAllByText` invece di `findByText`) con commento esplicito "TSK-103: title compare sia nel canvas-host placeholder sia nell'HUD" — il problema era noto ma non risolto.

**Fix:** Rimuovere Player.tsx:455 interamente. Aggiornare i test: `findAllByText` → `findByText` per le stringhe di stato; rimuovere il commento di giustificazione della duplicazione.

---

### F-103-02 — Non-null assertion `hud!` senza commento di giustificazione [MEDIUM]

**Regola:** `[^rule: code_quality/rules/canonical/TS-IDIOM-002.md §Rationale]`
**Passata:** idiomaticity
**File:** `[^src5: packages/app/src/components/Player/Player.test.tsx:86]`

`document.querySelector('.sb-hud')` restituisce `Element | null`. L'operatore `!` è usato 6 volte (righe 86, 87, 93, 98, 119, 120) senza commento che ne giustifichi la sicurezza, in violazione di TS-IDIOM-002. L'assertion `expect(hud).not.toBeNull()` che precede garantisce runtime safety ma non restringe il tipo TypeScript.

**Fix:** Aggiungere commento inline `// guaranteed non-null: expect(hud).not.toBeNull() above` oppure usare un cast tipizzato con guard esplicita. Alternativa preferita: risolvere con F-103-03 (query semantica che restituisce `HTMLElement` direttamente).

---

### F-103-03 — Test HUD usa document.querySelector invece di query Testing Library [LOW]

**Regola:** `[^rule: code_quality/rules/canonical/QA-TEST-001.md §Rationale]`
**Passata:** robustness
**File:** `[^src5: packages/app/src/components/Player/Player.test.tsx:82]`

`document.querySelector('.sb-hud')` bypassa l'accessibility tree e crea dipendenza dalla struttura CSS. La @testing-library/react best practice è usare query semantiche (`getByRole`, `getByLabelText`).

**Fix:** Aggiungere `aria-label="Stato giocatore"` al `.sb-hud` in Player.tsx. Nei test sostituire `document.querySelector('.sb-hud')` con `screen.getByRole('status', { name: /stato giocatore/i })`. Questo risolve anche F-103-02 (la query restituisce `HTMLElement`, nessun `!` necessario).

---

## Note positive

- `HUD_STATE_LABELS: Record<"idle"|"loaded"|"running"|"paused", string>` come costante tipizzata: idiomatico, previene drift tra componente, test e oracle.
- `HUD_TITLE_IDLE` come costante nominata: corretto.
- `aria-live="polite"` + `aria-atomic="true"` sul `.sb-hud`: corretta semantica per React 18 live regions.
- CSS overlay `.sb-pause-overlay` scoped su `data-video-scope` (id univoco per componente): evita leak globale.
- `var(--sd-color-text-primary, #f0e9ff)` con fallback: soddisfa CSS-DESIGN-001.
- `restoreSram` isolato in try/catch separato con `console.warn`: best-effort robusto, coerente con `persistSram`.
- `afterEach(() => vi.restoreAllMocks())` aggiunto correttamente alla suite test.

---

## Loop status

| | |
|---|---|
| Iter corrente | 1 / 3 |
| No-progress risk | no |
| Regression detected | no |

---

## Prossimo step

Verdict `conditional` — il dev-agent (fe-dev) deve:
1. **[F-103-01, HIGH, prioritario]** Rimuovere Player.tsx:455. Aggiornare i test da `findAllByText` a `findByText` per gli stati. Rimuovere i commenti di giustificazione della duplicazione nel test file.
2. **[F-103-02, MEDIUM]** Commentare le non-null assertion `hud!` nei test (o risolvere tramite punto 3).
3. **[F-103-03, LOW]** Aggiungere `aria-label="Stato giocatore"` al `.sb-hud`; aggiornare i test per usare `screen.getByRole` invece di `document.querySelector`. Questo risolve F-103-02 contestualmente.

Max diff lines suggerito: 80 (router severity-tiered). F-103-01 da solo vale ~10 righe di diff (rimozione + test aggiornamento). F-103-02+F-103-03 insieme ~15 righe.
