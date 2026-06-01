---
type: roadmap
status: draft
created: 2026-06-01
updated: 2026-06-01
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
