// TSK-001 — tipi di persistenza (db_schemas/indexeddb-stores.md).
// TSK-127 — aggiunto `RtcStateRecord` per il quinto object store `rtcState`
// (ADR-009 §3, US-066).
import type { RtcState } from "../domain/rtc-service";
import type { Core, Platform } from "../domain/types";

export interface RomRecord {
  /** hash del contenuto del file (keyPath store `roms`). */
  id: string;
  title: string;
  platform: Platform;
  core: Core;
  fileBlob: Blob;
  coverBlob?: Blob;
  addedAt: number;
}

/** Dati per aggiungere una ROM; `id` e `addedAt` sono derivati dall'adapter. */
export type RomInput = Omit<RomRecord, "id" | "addedAt">;

/**
 * Vista "metadata-only" del `RomRecord`, esposta da `StoragePort.listRomsMeta`
 * (TSK-075). Esclude il `fileBlob` — il binario della ROM, dimensione KB-MB,
 * costo IPC eager su NativeFsAdapter (vedi `code_quality/reports/TSK-054-iter-1.json` §F-2).
 *
 * Cosa è incluso vs escluso (decisione esplicita TSK-075):
 *  - inclusi: id, title, platform, core, addedAt, **coverBlob?** (opzionale).
 *  - esclusi: fileBlob.
 *
 * `coverBlob` resta nel meta perché la Library lo renderizza nelle tile (`<img>`);
 * è un payload piccolo (immagine, tipicamente decine di KB) e opzionale (assente
 * per ROM senza cover → zero IPC). Il vero costo F-2 erano gli N round-trip su
 * `fileBlob` (ROM binari) che la UI NON consumava — quelli sono eliminati.
 *
 * Per ottenere il `RomRecord` completo (incluso `fileBlob`) usare `getRom(id)`
 * (path lazy on-demand, es. quando il Player seleziona una ROM).
 */
export type RomMeta = Omit<RomRecord, "fileBlob">;

export interface SaveStateRecord {
  id: string;
  romId: string;
  slot: number;
  snapshotBlob: Blob;
  /**
   * Core/engine che ha prodotto lo snapshot (ADR-006 §Conseguenze).
   * Il formato dei save state è specifico per engine/versione: un payload
   * prodotto da gambatte/WasmBoy NON è caricabile da mGBA. Memorizzato qui
   * per consentire al SaveService di rifiutare un load cross-engine (US-016)
   * e per validare l'import (US-019, TSK-033).
   */
  core: Core;
  createdAt: number;
  /**
   * Snapshot dello stato dell'orologio interno catturato al momento del save
   * (TSK-129, ADR-009 §3, US-067).
   *
   * Campo **opzionale** by-design — il punto cardine della compat all'indietro:
   *  - Entry preesistenti (save state creati prima di EP-019) restano valide:
   *    il campo è semplicemente assente nell'oggetto materializzato da IDB,
   *    e il restore lo tratta come no-op silenzioso (vedi `SaveService.loadState`).
   *  - **Nessun bump di versione IDB** richiesto: IndexedDB è schema-less per
   *    campi non-keyPath/non-index, e questa estensione non tocca né l'uno né
   *    l'altro asse (l'index canonico resta `by_rom`).
   *
   * Cattura best-effort: se al momento del save l'engine non espone un
   * `RtcBridge` (es. nessuna cartuccia RTC, o bridge stub `null` da ADR-009 §4),
   * il campo resta assente nell'entry — comportamento invariato per i giochi
   * senza RTC. Vedi `SaveService.saveState` per la policy di cattura.
   */
  rtcState?: RtcState;
}

/**
 * Input per creare una nuova entry `saveStates` (TSK-031, US-016).
 * `id` e `createdAt` sono derivati dall'adapter.
 */
export type SaveStateInput = Omit<SaveStateRecord, "id" | "createdAt">;

export interface SramRecord {
  romId: string;
  data: Blob;
  updatedAt: number;
}

export interface ConfigRecord {
  key: string;
  value: unknown;
}

/**
 * Stato persistito dell'orologio interno (RTC) della cartuccia (TSK-127,
 * ADR-009 §3, US-066).
 *
 * Una entry per ROM (chiave logica = `romId`, FK verso `roms.id` con
 * cascade-delete su `removeRom`). Distinto da `sram` e `saveStates` per
 * mantenere semantica esplicita ("terza categoria di dato del salvataggio").
 *
 * Campi gestiti dall'adapter (NON esposti al dominio):
 *  - `updatedAt`: timestamp ISO 8601 UTC (`new Date().toISOString()`) della
 *    ultima `putRtcState`. Solo diagnostico / audit; il dominio non lo legge.
 *  - `schemaVersion`: marker di versione del payload `state`. Vale `1` per
 *    EP-019; riservato per future migration (ADR-009 §3 "schema versioning").
 */
export interface RtcStateRecord {
  /** FK logica → roms.id (cascade-delete su removeRom). */
  romId: string;
  /** Modello canonico wall-clock UTC (ADR-009 §2, definito in domain/rtc-service.ts). */
  state: RtcState;
  /** ISO 8601 UTC della ultima persistenza. */
  updatedAt: string;
  /** Versione del payload `state` (1 in EP-019). */
  schemaVersion: number;
}

export interface RomFilter {
  platform?: Platform;
  /** sottostringa case-insensitive sul titolo. */
  query?: string;
}
