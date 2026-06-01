// TSK-002 — StoragePort (ADR-002, api_specs/storage-port.md).
// Porta di persistenza consumata dal dominio; gli adapter (IndexedDB, filesystem nativo)
// la implementano. Qui l'asse `roms` (US-001/US-004/US-005).
// TSK-031 — aggiunti gli assi `saveStates` (US-016) e `sram` (US-017) come interfacce
// segmentate (ADR-006 §Decisione p.2): il dominio dei salvataggi consuma solo la porta
// che gli serve (interface segregation), evitando coupling spurio per i consumer ROM-only.

import type {
  RomFilter,
  RomInput,
  RomRecord,
  SaveStateInput,
  SaveStateRecord,
  SramRecord,
} from "./types";

export interface StoragePort {
  /** Aggiunge (o sostituisce) una ROM. Ritorna l'id derivato dal contenuto. */
  addRom(input: RomInput): Promise<string>;
  /** Elenca le ROM, opzionalmente filtrate per piattaforma e/o titolo. */
  listRoms(filter?: RomFilter): Promise<RomRecord[]>;
  /** Recupera una ROM per id. */
  getRom(id: string): Promise<RomRecord | undefined>;
  /** Rimuove una ROM (idempotente). */
  removeRom(id: string): Promise<void>;
}

/**
 * Porta save state (US-016, ADR-006 §Decisione p.2).
 * Separata da StoragePort per consentire ai consumer ROM-only (componenti UI
 * di libreria) di non dipendere dal contratto dei salvataggi. L'IndexedDBAdapter
 * implementa entrambe le porte; il SaveService consuma `SaveStatePort` (e legge
 * il `RomRecord` via la `StoragePort` per il guard cross-engine).
 */
export interface SaveStatePort {
  /**
   * Persiste un nuovo save state. Ritorna l'id generato.
   * L'entry memorizza `core/engine` per validare la compatibilità cross-engine
   * in fase di restore/import (ADR-006 §Conseguenze).
   */
  putSaveState(input: SaveStateInput): Promise<string>;
  /** Elenca i save state associati a una ROM (per slot crescente). */
  listSaveStates(romId: string): Promise<SaveStateRecord[]>;
  /** Recupera un save state per id. */
  getSaveState(id: string): Promise<SaveStateRecord | undefined>;
  /** Rimuove un save state (idempotente). */
  deleteSaveState(id: string): Promise<void>;
}

/**
 * Porta SRAM (US-017, ADR-006 §Decisione p.2).
 * Una entry SRAM per ROM (chiave `romId`); è la SRAM della cartuccia, distinta
 * dal save state (istantanea dell'emulatore).
 */
export interface SramPort {
  /** Persiste (o sostituisce) la SRAM cartuccia per la ROM `romId`. */
  putSram(romId: string, data: Blob): Promise<void>;
  /** Recupera la SRAM cartuccia per una ROM, se presente. */
  getSram(romId: string): Promise<SramRecord | undefined>;
}

/**
 * Porta copertina (US-009, TSK-039).
 * Separata da StoragePort per interface segregation: i consumer ROM-only che
 * non devono mutare la copertina (es. FileLoader, dominio rom-library) restano
 * sul contratto minimo. La Library (che mostra/aggiorna la cover) consuma
 * StoragePort & CoverPort. L'IndexedDBAdapter implementa entrambe.
 *
 * Invariante (US-033 privacy on-device, architecture-overview §EP-002):
 * la cover è SEMPRE caricata dall'utente — gli adapter non eseguono fetch di
 * rete per ricavarla automaticamente.
 */
export interface CoverPort {
  /**
   * Associa/aggiorna la copertina della ROM `romId`. Errore se la ROM non
   * esiste (no record orfani). Idempotente per `(romId, cover)`.
   */
  setCover(romId: string, cover: Blob): Promise<void>;
}

/**
 * Porta completa per i salvataggi: combina save state + SRAM + accesso ROM
 * (il SaveService legge `RomRecord` per derivare il `core` canonico ed
 * etichettare l'entry saveState, ADR-006 §Conseguenze).
 * Include anche CoverPort: l'IndexedDBAdapter unico implementa tutto.
 */
export interface SaveStoragePort
  extends StoragePort,
    SaveStatePort,
    SramPort,
    CoverPort {}

/**
 * Porta config generica (TSK-036 F-036-01).
 * Accesso tipato a chiavi/valori arbitrari sullo store `config` (keyPath "key"),
 * usato per persistere preferenze applicative (es. `video-settings`). Il modulo
 * `bios.ts` continua a servire le chiavi `bios:<platform>` via funzioni dedicate
 * (zero overlap: la chiave canonica è diversa).
 */
export interface ConfigPort {
  /** Recupera il valore associato a `key`, o `undefined` se assente. */
  getConfig<T>(key: string): Promise<T | undefined>;
  /** Persiste (o sostituisce) `value` sotto la chiave `key`. */
  setConfig<T>(key: string, value: T): Promise<void>;
}

/**
 * Porta di persistenza del tema UI (TSK-044, US-036).
 *
 * Analoga a `VideoSettingsPort` (cfr. components/Player/useVideoSettings.ts):
 * `load()` ritorna `null` se non c'è preferenza salvata (primo avvio: l'hook
 * `useTheme` resta sul default canonico `"90s-party"` senza setState).
 * `save(theme)` persiste in modo idempotente sotto la chiave canonica
 * `"ui-theme"` (store `config`, vedi `make_theme_port.ts`); gli errori sono
 * propagati per permettere al chiamante di logarli, ma NON degradano lo stato
 * in memoria (il `data-theme` corrente resta valido nel documento).
 *
 * Esposta qui — accanto a `ConfigPort` — per riusarla da componenti diversi
 * (Settings/ThemeSelector) senza importare dettagli dell'adapter.
 */
export interface ThemePort {
  load(): Promise<string | null>;
  save(theme: string): Promise<void>;
}
