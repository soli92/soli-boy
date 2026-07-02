# EP-021 — Visual oracle: prototipo vs produzione

**Data:** 2026-07-02  
**Branch:** `cursor/ep021-visual-fidelity-02f2`  
**Spec e2e:** `packages/app/e2e/ep021-visual-fidelity.e2e.ts`

## Scopo

Regression guard post-EP-021: verifica che l'app di produzione mantenga la parità strutturale con il prototipo interattivo `output/prototypes/ep020/` su shell, Play idle e Info.

## Strategia

| Asse | Metodo | Note |
|------|--------|------|
| Struttura DOM | Marker condivisi (`proto-root`, `theme-switcher`, drop-zone, legal card) | Non pixel-diff |
| Screenshot | Coppia prod/proto tema `cyberpunk` @ 1280×800 | Allegati Playwright; md5 devono differire (copy/dati reali) |
| Server | Playwright `webServer[]`: app `:4173` + prototype preview `:4174` | Build prototipo a ogni run CI |

## Marker verificati

### Shell
- `.proto-root`
- `.theme-switcher`
- Header (`sb-app-header` / `header`)

### Play idle
- Produzione: `.sb-screen`, `[data-testid="play-idle-drop-zone"]`
- Prototipo: `.sb-screen`, `.drop-zone`

### Info
- Produzione: `sb-privacy-section`, `sb-store-compliance-section`, `sb-legal-card`
- Prototipo: testi "Privacy Notice", "Store Compliance", "Note Legali"

## Esito atteso

Tutti i test in `ep021-visual-fidelity.e2e.ts` passano in CI. Screenshot non byte-identici ma entrambi non vuoti.

## Limiti noti

- Nessun pixel-diff rigido: HUD, copy italiana e dati reali differiscono dal mock prototipo.
- Prototipo usa tab label EN con emoji; produzione usa label IT — confronto per marker semantici, non testo esatto.
