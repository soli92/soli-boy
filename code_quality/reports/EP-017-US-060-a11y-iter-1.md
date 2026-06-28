# EP-017 / US-060 — Manual a11y check iter 1 (TSK-116)

- **Componente**: Player — HUD aria-live + testo adiacente canvas
- **Target**: `packages/app/src/components/Player/Player.tsx`
- **Standard**: WCAG 2.2 AA (4.1.3 Status Messages)
- **Tool**: axe-playwright proxy + DOM assertions (`Player.hud.test.tsx`)

## Summary

- Critical: 0 · Major: 0 · Minor: 0 (componente-scoped) · Manual: 2

## Implementazione verificata

| Requisito | Evidenza |
|---|---|
| HUD `.sb-hud` — span stato con `aria-live="polite"` `aria-atomic="true"` | `Player.hud.test.tsx` AC3 |
| Canvas adiacente `[data-testid="sb-canvas-status"]` — "Gioco corrente: [title] — [stato]" | `Player.hud.test.tsx` TSK-116 describe |
| `aria-describedby` su canvas-host → status text | test DOM |
| Nessun `aria-hidden` sul testo visibile | ispezione codice |

## Manual checks (N≥1) — AT simulation

**Procedura (VoiceOver / NVDA equivalente in jsdom proxy):**

1. Avvia Player con titolo "Tetris" → stato idle.
2. Click **Avvia** → entro 2s l'annuncio live include **"In esecuzione"** (HUD span + canvas status).
3. Click **Pausa** → entro 2s annuncio **"In pausa"**; overlay pausa `aria-hidden="true"` (non duplicato).

**Esito simulato:** PASS — cambio stato annunciato via `aria-live="polite"` su HUD (stato breve) e
canvas status (contesto "Gioco corrente: …"). Informazioni complementari: HUD enfatizza transizione
stato; canvas fornisce contesto titolo+stato adiacente al viewport.

## Verdict consigliato

`a11y_status: pass` (axe + manual proxy). Raccomandato smoke test AT reale pre-release store.
