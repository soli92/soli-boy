<!-- generated, do not edit -->
# Sprint board — soli-boy

View aggregata generata dal `tpm`. Scope: Core web MVP (EP-001 + EP-003).
Rigenerata ad ogni run; non modificare a mano.

## Sprint 1 — "Carica ed esegui" (critical path)

| TSK | Titolo | layer | consumer | prio | est | status | review | US |
|-----|--------|-------|----------|------|-----|--------|--------|----|
| TSK-001 | IndexedDB adapter + store `roms` | db | agent | P0 | M | done | passed | US-004 |
| TSK-002 | StoragePort + dominio persistenza ROM | be | agent | P0 | M | done | passed | US-001/004 |
| TSK-003 | FileLoader: picker + drag & drop | fe | agent | P0 | M | done | passed | US-001 |
| TSK-004 | PlatformRecognition | be | agent | P0 | M | done | passed | US-002 |
| TSK-005 | Gestione BIOS | be | agent | P1 | S | done | passed | US-003 |
| TSK-006 | Avviso legale no-copyright | fe | agent | P1 | XS | done | passed | US-006 |
| TSK-007 | CoreWrapper: resolveCore + load/start | be | agent | P0 | L | done | passed | US-010 |
| TSK-008 | Player: viewport + mount EmulatorJS | fe | agent | P0 | M | done | passed | US-010 |
| TSK-009 | CoreWrapper: audio (volume/mute) | be | agent | P1 | S | done | passed | US-015 |
| TSK-010 | Test unit: PlatformRecognition | qa | agent | P1 | S | todo | — | US-002 |
| TSK-011 | Test e2e: carica→avvia→audio | qa | agent | P1 | M | todo | — | US-010/015 |

## Sprint 2 (lookahead) — "Libreria e controlli"

| TSK | Titolo | layer | consumer | prio | est | status | depends_on | US |
|-----|--------|-------|----------|------|-----|--------|-----------|----|
| TSK-012 | Library: griglia ROM persistite | fe | agent | P1 | M | todo | TSK-002 | US-004 |
| TSK-013 | LibraryService: list + remove | be | agent | P2 | S | todo | TSK-002 | US-005 |
| TSK-014 | Player controls: pausa/ripresa/arresto | fe | agent | P0 | S | todo | TSK-008,015 | US-011 |
| TSK-015 | CoreWrapper: pause/resume/stop | be | agent | P0 | S | todo | TSK-007 | US-011 |
| TSK-016 | InputMapping: tastiera + Gamepad API | be | agent | P0 | M | todo | TSK-007 | US-012 |
| TSK-017 | Settings: rimappatura comandi + profili | fe | agent | P1 | M | todo | TSK-016 | US-013 |
| TSK-018 | CoreWrapper: fast-forward + rewind | be | agent | P2 | S | todo | TSK-007 | US-014 |
| TSK-019 | Test e2e: pausa/ripresa + input | qa | agent | P1 | M | todo | TSK-014,016 | US-012 |
| TSK-020 | Dropzone FileLoader a11y (REACT-A11Y-001) | fe | agent | P2 | XS | todo | TSK-003 | US-001 |

## Note scheduler (PATTERN §18)

- Done: 9/20 TSK (Sprint 1 critical path + parte EP-003), tutti `review: passed`.
- TSK-020 aggiunto post-review (remediation regola canonical REACT-A11Y-001).
- Pronti per dispatch (deps risolte): TSK-010, 011, 012, 013, 015, 016, 018, 020.
  Conflitti code_path strict: core{015,016,018}=1/wave; domain{013,016}=1/wave.
- Tutti `consumer: agent`; nessun TSK `blocked_by` (0 Q hard aperte).
