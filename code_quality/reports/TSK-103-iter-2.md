# Code Review — TSK-103 iter-2

**TSK:** TSK-103 — HUD Player user-facing: romTitle + stati italiani + overlay pausa
**Data:** 2026-06-15
**Reviewer:** code-reviewer v2.21 (claude-sonnet-4-6)
**Iter:** 2 / 3 (max_iterations: 3)

---

## Stack rilevato

| Voce | Valore |
|---|---|
| Linguaggio | TypeScript |
| Framework | React 18 |
| Stack mode | guided (confidence: 0.97) |
| File toccati | Player.tsx, Player.test.tsx |

---

## Verdict: `pass`

0 finding. Tutti e tre i finding di iter-1 sono stati risolti correttamente. Nessun nuovo finding introdotto.

---

## Verifica fix iter-1

### F-103-01 (HIGH) — Risolto

**Regola:** `[^rule: code_quality/rules/canonical/REACT-IDIOM-001.md §Rationale]`

Il bare text node orfano dentro `.sb-screen` è rimosso. Il diff mostra la rimozione di:

```tsx
// RIMOSSO da .sb-screen:
{running ? (title ?? HUD_STATE_LABELS.running) : paused ? HUD_STATE_LABELS.paused : HUD_STATE_LABELS.idle}
```

Il testo di stato appare ora esclusivamente nel `.sb-hud` (Player.tsx:526-527). I test sono stati aggiornati: `findByText` singola occorrenza in tutto il file. Nessun commento di giustificazione della duplicazione rimasto.

---

### F-103-02 (MEDIUM) — Risolto (per via transitiva da F-103-03)

**Regola:** `[^rule: code_quality/rules/canonical/TS-IDIOM-002.md §Rationale]`

Risolto per via transitiva: la variabile `hud` non esiste più nel file di test. Le query `screen.getByRole('status', { name: /stato giocatore/i })` restituiscono `HTMLElement` direttamente, eliminando la necessità di non-null assertion. Grep su `hud!`: zero occorrenze in Player.test.tsx.

---

### F-103-03 (LOW) — Risolto

**Regola:** `[^rule: code_quality/rules/canonical/QA-TEST-001.md §Rationale]`

Player.tsx:521-522 contiene `role="status"` e `aria-label="Stato giocatore"` sul `.sb-hud`. Player.test.tsx righe 78 e 113 usano `screen.getByRole("status", { name: /stato giocatore/i })` — nessun `document.querySelector` rimasto per l'HUD.

---

## Note positive confermate

- `HUD_STATE_LABELS: Record<"idle"|"loaded"|"running"|"paused", string>` come costante tipizzata: idiomatico, previene drift fra componente, test e oracle.
- `HUD_TITLE_IDLE` come costante nominata: manutenibile.
- Semantica ARIA completa sul `.sb-hud`: `role="status"` + `aria-live="polite"` + `aria-atomic="true"` + `aria-label="Stato giocatore"`. Coprente per React 18 live regions.
- Test TSK-103 coprono tutti gli stati: idle, running, paused, riprendi (overlay dismounted), senza title (fallback HUD_TITLE_IDLE). Copertura comportamentale completa per UX-018 e UX-019.
- `findByText` a singola occorrenza: asserzione più precisa rispetto a `findAllByText`.
- CSS overlay `.sb-pause-overlay` scoped su `data-video-scope` (id univoco per componente): evita leak globale.
- `aria-hidden="true"` sull'overlay pausa e `data-testid="pause-overlay"`: accessibile e testabile senza dipendenze dalla struttura CSS.
- `var(--sd-color-text-primary, #f0e9ff)` con fallback: soddisfa CSS-DESIGN-001.
- `restoreSram` isolato in try/catch separato con `console.warn`: best-effort robusto, coerente con `persistSram`.
- `afterEach(() => vi.restoreAllMocks())` presente correttamente.

---

## Regression check

Nessun nuovo finding in file non toccati dalla fix. Il diff è confinato a Player.tsx e Player.test.tsx.

---

## Loop status

| | |
|---|---|
| Iter corrente | 2 / 3 |
| No-progress risk | no |
| Regression detected | no |

---

## Prossimo step

Verdict `pass` — nessuna azione richiesta al dev-agent. Il TSK è promosso a `review_status: passed`.
