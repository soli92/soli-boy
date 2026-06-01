---
id: indexeddb-stores
title: Schema IndexedDB — object stores
status: draft
created: 2026-06-01
updated: 2026-06-01
---

# Schema IndexedDB — object stores

Schema di persistenza locale (browser/WebView) implementazione della porta in [[ADR-002]].
Quattro object store, tutti on-device (privacy, US-033).

## Object stores

### `roms`
- **keyPath**: `id` (hash del contenuto del file)
- **Campi**: `id`, `title`, `platform`, `core`, `fileBlob`, `coverBlob?`, `addedAt`
- **Index**: `by_platform` (platform), `by_title` (title)
- Copre US-002 (platform/core), US-004 (persistenza), US-007/US-008 (griglia, ricerca/filtro), US-009 (cover). [^src: management/kanban/EP-002-libreria-di-gioco/US-008-ricerca-e-filtro/US-008.md §Business Rules]

### `saveStates`
- **keyPath**: `id`
- **Campi**: `id`, `romId` (FK logica → roms.id), `slot`, `snapshotBlob`, `createdAt`
- **Index**: `by_rom` (romId)
- Copre US-016 (save state multipli), US-018 (associazione al gioco). [^src: management/kanban/EP-004-salvataggi/US-016-save-state-multipli/US-016.md §Business Rules]

### `sram`
- **keyPath**: `romId`
- **Campi**: `romId`, `data`, `updatedAt`
- Copre US-017 (persistenza SRAM in-game). [^src: management/kanban/EP-004-salvataggi/US-017-persistenza-sram/US-017.md §Business Rules]

### `config`
- **keyPath**: `key`
- **Campi**: `key`, `value` (profili comandi, scala/aspect/filtro, volume/mute)
- Copre US-013 (profili comandi), US-015/US-021/US-022 (preferenze). [^src: management/kanban/EP-003-esecuzione-e-controlli/US-013-rimappatura-comandi/US-013.md §Acceptance Criteria]

## Note

- L'adapter `NativeFsAdapter` (Electron) mappa le stesse collezioni su file nel filesystem nativo, preservando le stesse chiavi logiche (US-023).
- Export/import (US-019) serializza una entry `saveStates`/`sram` in un file portabile, versionato per compatibilità futura.
- Nessuna FK fisica (IndexedDB non relazionale): l'integrità `romId → roms.id` è garantita dal dominio (`LibraryService`/`GameSession`).
