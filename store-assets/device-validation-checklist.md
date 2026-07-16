# Device validation checklist — Soli-Boy (TSK-177)

> Checklist unificata per validazione su **device fisico** Android e iOS dopo EP-022.
> **Focus Android (Sprint 21):** runbook operativo → [`wiki/runbooks/android-device-validation-runbook.md`](../wiki/runbooks/android-device-validation-runbook.md)
> Usata da: TSK-178 (Android), TSK-182 (iOS responsive), TSK-072 (iOS WASM benchmark).
>
> Compilare i report da template:
> - Android → [`android-validation-report.md`](android-validation-report.md)
> - iOS → [`ios-validation-report.md`](ios-validation-report.md)

## Prerequisiti build

| # | Requisito | Android | iOS |
|---|-----------|---------|-----|
| P1 | Capacitor sync eseguito (`npx cap sync`) | ☐ | ☐ |
| P2 | Profilo sviluppatore / signing configurato | ☐ | ☐ |
| P3 | App installata su **device fisico** (non solo emulatore IDE) | ☐ | ☐ |
| P4 | ROM libera `dmg-acid2.gb` disponibile in app (`public/test-roms/`) | ☐ | ☐ |
| P5 | ROM libera `gba-tests-thumb.gba` disponibile (solo benchmark WASM iOS, TSK-072) | — | ☐ |
| P6 | Engine reale attivo (`?engine=real` se web debug; build Capacitor usa WasmBoy/mGBA bundled) | ☐ | ☐ |
| P7 | Entrambi i temi testati almeno su portrait: **cyberpunk** + **90s-party** | ☐ | ☐ |

## Matrice responsive — 4 tab × orientamento

Per ogni cella: **Pass** = visibile, non sovrapposto, cliccabile. **Fail** = descrivere in report.

### Android

| Area | Portrait | Landscape | Criterio pass |
|------|----------|-----------|---------------|
| Tab **Play** | ☐ | ☐ | Visibile e cliccabile; logo **non** copre il tab (anti-regressione US-105) |
| Tab **Libreria** | ☐ | ☐ | Visibile e cliccabile |
| Tab **Impostazioni** | ☐ | ☐ | Visibile e cliccabile |
| Tab **Info** | ☐ | ☐ | Visibile e cliccabile |
| ThemeSwitcher in **Settings** (portrait ≤640px) | ☐ | — | Presente in Impostazioni, assente dall'header portrait |
| Safe area / notch | ☐ | ☐ | Nessun controllo critico sotto status bar o gesture bar |
| TouchOverlay (con ROM avviata) | ☐ | ☐ | D-pad e pulsanti usabili, non fuori schermo |

### iOS (TSK-182 — responsive)

| Area | Portrait | Landscape | Criterio pass |
|------|----------|-----------|---------------|
| Tab **Play** | ☐ | ☐ | Visibile e cliccabile (anti-regressione US-105) |
| Tab **Libreria** | ☐ | ☐ | Visibile e cliccabile |
| Tab **Impostazioni** | ☐ | ☐ | Visibile e cliccabile |
| Tab **Info** | ☐ | ☐ | Visibile e cliccabile |
| ThemeSwitcher in **Settings** (portrait) | ☐ | — | Presente in Impostazioni |
| Safe area (notch / home indicator) | ☐ | ☐ | Layout rispetta `env(safe-area-inset-*)` |
| TouchOverlay (con ROM avviata) | ☐ | ☐ | Controlli touch raggiungibili |

## Matrice emulazione — Game Boy (ROM `dmg-acid2.gb`)

| Step | Android | iOS | Criterio pass |
|------|---------|-----|---------------|
| E1 Carica ROM da Libreria o file picker | ☐ | ☐ | ROM importata senza errore |
| E2 Seleziona tile in Libreria → auto-switch Play | ☐ | ☐ | Tab Play attivo |
| E3 Avvia emulazione | ☐ | ☐ | Canvas renderizza (non nero) entro 30s |
| E4 Pausa / Riprendi | ☐ | ☐ | Stato HUD coerente |
| E5 Input touch D-pad | ☐ | ☐ | Risposta percepita < 100ms |
| E6 Background / foreground (US-031) | ☐ | ☐ | Ripresa corretta; CPU ~0 in background dopo pausa |

## Matrice benchmark WASM — solo iOS (TSK-072)

| Metrica | Target | Misurato | Pass |
|---------|--------|----------|------|
| FPS gameplay GB | 60 fps stabile | | ☐ |
| FPS gameplay GBA (`gba-tests-thumb.gba`) | 60 ± 5 fps | | ☐ |
| Latenza input touch | < 100 ms percepita | | ☐ |
| CPU/batteria in background dopo pausa | ~0 | | ☐ |
| Policy App Store §4.7 (emulatori) | conforme / da documentare | | ☐ |

## Giudizio finale

| Piattaforma | Esito complessivo | Blocker? | Report |
|-------------|-------------------|----------|--------|
| Android | ☐ Pass · ☐ Fail · ☐ Parziale | | `android-validation-report.md` |
| iOS responsive | ☐ Pass · ☐ Fail · ☐ Parziale | | `ios-validation-report.md` §Responsive |
| iOS WASM | ☐ Accettabile · ☐ Non accettabile | | `ios-validation-report.md` §WASM |

## Riferimenti

- EP-022 US-105 (fix portrait P0): `management/kanban/EP-022-mobile-responsive-fidelity/US-105-mobile-portrait-navbar-fix/US-105.md`
- Suite e2e CI: `packages/app/e2e/ep022-multi-viewport.e2e.ts` (browser emulato — non sostituisce device reale)
- Store checklist: [`checklist.md`](checklist.md)
