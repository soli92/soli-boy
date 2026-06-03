---
id: storage-port
title: Contratto StoragePort (porta di persistenza)
status: draft
created: 2026-06-01
updated: 2026-06-01
---

# Contratto StoragePort

Porta di persistenza consumata dal dominio, con adapter IndexedDB e filesystem nativo
([[ADR-002]]). Contratto di design (firme logiche, non implementazione).

## Operazioni

| Operazione | Input | Output | Copre |
|---|---|---|---|
| `addRom` | rom file, metadati riconosciuti | romId | US-001, US-002, US-004 |
| `listRoms` | filtro opzionale (platform, query) | elenco rom | US-007, US-008 |
| `removeRom` | romId | esito | US-005 |
| `getRom` | romId | rom + blob | US-010 |
| `putSaveState` | romId, slot, snapshot | saveStateId | US-016 |
| `listSaveStates` | romId | elenco save state | US-016 |
| `restoreSaveState` | saveStateId | snapshot | US-016 |
| `putSram` | romId, data | esito | US-017 |
| `getSram` | romId | data | US-017 |
| `getConfig` / `setConfig` | key (/ value) | value (/ esito) | US-013, US-015, US-021, US-022 |

## Operazioni di dominio (non-porta) — planned

Le seguenti operazioni sono pianificate sotto **US-019** (export/import save), **fuori
sprint corrente**. NON sono esposte dalla porta `StoragePort`: vivono a livello dominio
e, quando verranno implementate, comporranno le primitive della porta (es. `getSaveState`,
`putSaveState`) senza estenderne la superficie.

| Operazione | Input | Output | Copre | Stato |
|---|---|---|---|---|
| `exportSave` | saveStateId \| romId | file serializzato | US-019 | planned — US-019, out of sprint |
| `importSave` | file serializzato | esito + riassociazione | US-019 | planned — US-019, out of sprint |

## Invarianti

- Tutte le operazioni sono **locali**: nessun dato verso server esterni (US-033). [^src: management/kanban/EP-008-conformita-e-pubblicazione-store/US-033-privacy-on-device/US-033.md §Business Rules]
- `removeRom` richiede conferma a monte (UI) ed è idempotente. [^src: management/kanban/EP-001-gestione-file-di-gioco/US-005-rimuovere-rom/US-005.md §Acceptance Criteria]
- (planned, US-019) `importSave` validerà il file e riassocerà al gioco corretto, con errore comprensibile se non valido — invariante di dominio, non della porta. [^src: management/kanban/EP-004-salvataggi/US-019-export-import/US-019.md §Acceptance Criteria]

## Adapter

- **IndexedDBAdapter** — web/mobile (WebView), mappa su [[indexeddb-stores]].
- **NativeFsAdapter** — desktop (Electron), filesystem nativo via IPC. [^src: management/kanban/EP-006-distribuzione-desktop/US-023-filesystem-nativo/US-023.md §Acceptance Criteria]
