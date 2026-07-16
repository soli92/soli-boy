---
type: roadmap
status: draft
created: 2026-06-01
updated: 2026-07-16T09:55:00+00:00
---

# Roadmap — soli-boy

Roadmap derivata dalle specifiche funzionali ([[2026-06-01-specifiche-funzionali]]) e
dall'integrazione mobile ([[2026-06-01-integrazione-mobile]]). Le epiche sono fasate
secondo le roadmap dichiarate nei documenti.

## Release 1 — MVP web

Nucleo condiviso funzionante nel browser.

| EP | Titolo | Priorità | Confidence | Dipende da |
|----|--------|----------|-----------|-----------|
| EP-001 | Gestione dei file di gioco | high | 85% | — |
| EP-002 | Libreria di gioco | high | 80% | EP-001 |
| EP-003 | Esecuzione e controlli | high | 80% | EP-001 |
| EP-004 | Salvataggi | high | 80% | EP-003 |
| EP-005 | Resa video | medium | 75% | EP-003 |

## Release 2 — Desktop

| EP | Titolo | Priorità | Confidence | Dipende da |
|----|--------|----------|-----------|-----------|
| EP-006 | Distribuzione desktop | medium | 75% | EP-003 |

## Release 3 — Mobile

| EP | Titolo | Priorità | Confidence | Dipende da |
|----|--------|----------|-----------|-----------|
| EP-007 | Esperienza mobile | high | 60% | EP-003 |
| EP-008 | Conformità e pubblicazione store | medium | 55% | EP-006, EP-007 |

## Note

- **Parallelizzabilità**: EP-002, EP-003 e EP-005 condividono solo la dipendenza da
  EP-001/EP-003 e hanno scope di scrittura distinti — candidabili a wave parallele
  (PATTERN §18) una volta stabilizzati gli AC.
- **Rischi aperti**: EP-007/EP-008 hanno confidence bassa per i limiti WebAssembly/JIT
  su iOS e le policy mutevoli degli store (vedi [[emulazione-su-mobile]]).
- **Decisione di scope**: mobile inteso come Android + iOS (la richiesta originaria
  citava "Android e macOS"; macOS resta nella distribuzione desktop EP-006). Da
  validare con lo stakeholder.

## Hotfix sprint — Completezza controlli (priorità massima)

Refinement dei requisiti già stabiliti (RF-12/RF-13/RFM-01) sui pulsanti shoulder L/R, richiesto esplicitamente dall'owner con massima priorità.

| EP | Titolo | Priorità | Confidence | Dipende da |
|----|--------|----------|-----------|-----------|
| EP-018 | Controlli shoulder L e R in tutte le modalità e versioni | high | done | EP-003 |

- **EP-018** espone L e R su tastiera/gamepad (US-062), overlay touch per le piattaforme che li prevedono (US-063) e rimappatura/profili (US-064). Refinement chirurgico sul dominio input esistente, scope contenuto e a basso rischio; gap di documentazione sui singoli pulsanti hardware per piattaforma tracciato come non-bloccante in [[gaps]] (`controlli-l-r-shoulder-per-piattaforma`).

## Release cross-cutting — Identità & Delivery

Epiche trasversali (non vincolate a una specifica release di prodotto: agiscono sui
moduli già consegnati e abilitano i futuri).

| EP | Titolo | Priorità | Confidence | Dipende da | Sprint |
|----|--------|----------|-----------|-----------|--------|
| EP-010 | Tema 90's e identità di brand | medium | 75% | — | 6 |
| EP-011 | CI/CD | high | 55% | — | 6 |

- **EP-010** completa l'identità visiva: tema `90s-party` di SoliDS reale (gap
  `design-system-real-package` CHIUSO via TSK-040) + cablaggio dei brand asset
  (favicon, app icon, manifest, logo header) già presenti in `raw/soliboy-brand/`.
  TSK generati in Sprint 6: TSK-042..048 (7 task: 5 fe, 2 qa).
- **EP-011** introduce pipeline CI (typecheck/unit/e2e/build), branch protection
  su `main` (R.14 VCS gate) e CD del frontend su Vercel preservando gli header
  COOP/COEP richiesti dall'emulazione WASM ([[emulazione-via-core-wasm]]).
  Gap di prodotto risolti con decisioni ratificate dall'owner:
  `ci-cd-pipeline-definition` → TSK-049 (GitHub Actions, Node 20, ubuntu-latest,
  Chromium only, working-dir packages/app);
  `branch-protection-policy` → TSK-050 (CI verde obbligatorio, no reviews, no
  force-push, gate umano R.14);
  `vercel-deploy-trigger-policy` → TSK-051 (produzione su tag v*, preview su PR).
  TSK generati in Sprint 6: TSK-049..052 (4 task: 3 fe/agent + 1 fe/human).

## Backlog emulazione (post ADR-005)
- Sprint 4/5 (completati): WasmBoy GB/GBC (real), GBA (mGBA), deprecazione
  EmulatorJS, save state, filtri video. TSK-041 done (bugfix canvas WasmBoy).
- EP-009 (futura): **Supporto arcade** (FBNeo/MAME) via libretro/RetroArch web — rinviato (gap arcade-emulation-engine).

## Release cross-cutting — Graphic Refactoring (completata)

| EP | Titolo | Priorità | Confidence | Dipende da | Sprint |
|----|--------|----------|-----------|-----------|--------|
| EP-020 | Graphic Refactoring & Solids Component Migration | high | done | EP-010, EP-012, EP-013 | 17–18 |

- **EP-020** chiusa 2026-07-02: migrazione UI da classi `sb-*`/`sd-*` a componenti React `@soli92/solids` (shadcn/Radix/Tailwind). 9 US (US-092..100), 22 TSK (TSK-136..157) tutti `done`. Prototipo dual-theme in `output/prototypes/ep020/`. Design brief: `wiki/design/ep020-design-brief.md`.

## Release cross-cutting — Visual fidelity prototipo (completata)

| EP | Titolo | Priorità | Confidence | Dipende da | Sprint |
|----|--------|----------|-----------|-----------|--------|
| EP-021 | Allineamento visivo produzione ↔ prototipo EP-020 | high | done | EP-020 | 19 |

- **EP-021** chiusa 2026-07-02: parità strutturale shell/Play/Info/Player desktop col prototipo; e2e `ep021-visual-fidelity.e2e.ts`; 3 US, 4 TSK (TSK-158..161) `done`.

## Release cross-cutting — Mobile responsive fidelity (completata)

| EP | Titolo | Priorità | Confidence | Dipende da | Sprint |
|----|--------|----------|-----------|-----------|--------|
| EP-022 | Mobile-first Responsive & Visual Fidelity Overhaul | high | done | EP-020, EP-021 | 20 |

- **EP-022** chiusa 2026-07-16: audit 4 viewport, fix portrait P0, logo Solids dual-theme, regression `ep022-multi-viewport.e2e.ts`. 7 US (US-104..110), 12 TSK (TSK-165..176) tutti `done`.

## Release 2 — Desktop (in corso — signing)

| EP | Titolo | Priorità | Confidence | Dipende da | Sprint |
|----|--------|----------|-----------|-----------|--------|
| EP-006 | Distribuzione desktop | medium | in-progress | EP-003 | 19 (US-104), 21 (US-112) |

- **EP-006** US-104 done (unsigned release pipeline). US-112 Sprint 21: code signing Win/macOS (ADR-007, gate umano certificati).

## Sprint 21 — Device validation + Code signing (corrente)

| EP | US | Titolo | TSK | Consumer |
|----|-----|--------|-----|----------|
| EP-007 | US-111 | Validazione device Android | TSK-177 (agent), TSK-178 (human) | mixed |
| EP-007 | US-113 | Validazione responsive iOS device | TSK-182 (human) | human |
| EP-008 | US-035 | Benchmark iOS WASM | TSK-072 (human) | human |
| EP-006 | US-112 | Code signing Win/macOS | TSK-179 (agent), TSK-180/181 (human) | mixed |

- **EP-007** agent work completo; residuo validazione device fisico (Sprint 21).
- **EP-008** residuo TSK-072 (iOS WASM benchmark) — Sprint 21, dipende checklist TSK-177.
