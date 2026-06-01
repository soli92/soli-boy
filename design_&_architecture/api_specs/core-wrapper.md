---
id: core-wrapper
title: Contratto CoreWrapper (integrazione emulazione)
status: draft
created: 2026-06-01
updated: 2026-06-01
---

# Contratto CoreWrapper

Modulo di integrazione con EmulatorJS che espone al dominio un'interfaccia stabile di
emulazione ([[ADR-003]]). Contratto di design (firme logiche, non implementazione).

## Operazioni

| Operazione | Input | Output | Copre |
|---|---|---|---|
| `resolveCore` | file (estensione + contenuto) | { platform, core } | US-002 |
| `load` | rom, core, bios? | sessione pronta | US-003, US-010 |
| `start` / `pause` / `resume` / `stop` | — | esito | US-011 |
| `bindInput` | sorgente (tastiera/gamepad/touch) + profilo | — | US-012, US-013, US-026 |
| `setAudio` | volume, mute | — | US-015 |
| `setSpeed` | fast-forward on/off; rewind se supportato | esito (+ capability) | US-014 |
| `snapshot` / `restore` | (snapshot) | snapshot / esito | US-016 |
| `getVideoTarget` | scala, aspect, filtro | — | US-020, US-021, US-022 |

## Mapping piattaforma → core

| Piattaforma | Core |
|---|---|
| Game Boy / Game Boy Color | Gambatte |
| Game Boy Advance | mGBA |
| Arcade | FBNeo / MAME |

Fonte vincolo: `raw/tech_stack.md`. [^src: management/kanban/EP-001-gestione-file-di-gioco/US-002-riconoscimento-piattaforma/US-002.md §Business Rules]

## Invarianti e rischi

- Esegue **solo** file forniti dall'utente; nessun contenuto protetto incluso (US-006). [^src: management/kanban/EP-001-gestione-file-di-gioco/US-006-avviso-no-copyright/US-006.md §Business Rules]
- `setSpeed(rewind)` espone una capability: se il core non supporta il rewind, il comando è disabilitato (US-014). [^src: management/kanban/EP-003-esecuzione-e-controlli/US-014-fast-forward-rewind/US-014.md §Acceptance Criteria]
- Su iOS l'esecuzione avviene nel WebView di sistema con limiti JIT da validare (US-035). [^src: management/kanban/EP-008-conformita-e-pubblicazione-store/US-035-validazione-ios-wasm/US-035.md §Business Rules]
