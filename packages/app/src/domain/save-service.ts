// TSK-031 — SaveService (ADR-006 §Decisione p.3, US-016/US-017).
// Orchestra il flusso engine↔storage per i salvataggi:
//   - save state: engine.snapshot() → storage.putSaveState
//   - load state: storage.getSaveState → engine.restore (con guard cross-engine)
//   - SRAM autosave su stop/pausa: engine.getSram() → storage.putSram
//   - SRAM reload su load:        storage.getSram → engine.loadSram
//
// Resta agnostico sull'engine concreto (lavora sull'interfaccia EmulatorEngine,
// ADR-003) e sull'adapter di persistenza (StoragePort, ADR-002).
// Export/import (US-019) sono di competenza di TSK-033 e non sono qui.

import type { EmulatorEngine } from "../core/core-wrapper";
import type { SaveStoragePort } from "../storage/port";
import type { SaveStateRecord } from "../storage/types";
import type { Core } from "./types";

/**
 * Estrae l'ArrayBuffer "stretto" da un Uint8Array prodotto dall'engine.
 * Necessario perché `BlobPart` accetta `ArrayBufferView<ArrayBuffer>` ma il
 * tipo di ritorno di `engine.snapshot()`/`getSram()` è
 * `Uint8Array<ArrayBufferLike>` (potenzialmente SharedArrayBuffer). Si copia
 * la view in un ArrayBuffer dedicato per garantire compatibilità con `Blob`
 * e isolare la storage layer da mutazioni del buffer sorgente.
 */
function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(view.byteLength);
  new Uint8Array(out).set(view);
  return out;
}

/** Esito di un load state. */
export type LoadStateResult =
  | { ok: true }
  | { ok: false; reason: "not-found" | "engine-mismatch"; detail?: string };

/** Esito di un restore SRAM. */
export type RestoreSramResult =
  | { ok: true; restored: boolean }
  | { ok: false; reason: "rom-not-found"; detail?: string };

/** Esito di un autosave SRAM. */
export type AutosaveSramResult =
  | { ok: true; persisted: boolean }
  | { ok: false; reason: "rom-not-found" | "engine-unsupported"; detail?: string };

/**
 * Servizio di dominio per save state e SRAM (TSK-031, ADR-006).
 *
 * Note di design:
 * - Il `core` associato a un save state è letto dal `RomRecord` (storage.getRom):
 *   ogni ROM ha un core canonico (TSK-001/TSK-004, US-001). Questo evita di
 *   doverlo passare ad ogni call e mantiene la consistenza tra US-018 (saves
 *   associati al gioco) e ADR-006 (guard cross-engine).
 * - Il SaveService NON impone vincoli sul numero di slot (l'UI/US-016 ne
 *   gestirà la presentazione); slot ripetuti coesistono come entry distinte.
 * - `getSram()` dell'engine può ritornare null per due motivi (vedi finding
 *   F-030-1-R2 su TSK-030): "nessuna ROM caricata" o "nessuna battery RAM".
 *   Il SaveService NON distingue i due casi (entrambi → no-op autosave),
 *   poiché in entrambi i casi non c'è nulla di valido da persistere; il
 *   risultato `persisted:false` segnala l'assenza di dato senza falsi claim.
 */
export class SaveService {
  constructor(private readonly storage: SaveStoragePort) {}

  // === Save state (US-016) =====================================================

  /**
   * Crea un save state per la ROM `romId` sullo `slot` indicato.
   * Cattura lo snapshot dall'engine, lo persiste etichettandolo col core
   * canonico della ROM (per il guard cross-engine in fase di load).
   * Reject se la ROM non esiste o se l'engine non supporta i save state.
   */
  async saveState(engine: EmulatorEngine, romId: string, slot: number): Promise<string> {
    const rom = await this.storage.getRom(romId);
    if (!rom) {
      throw new Error(`SaveService.saveState: ROM non trovata (romId=${romId}).`);
    }
    // `engine.snapshot()` farà reject onesto se l'engine non supporta i save state
    // (capabilities.saveStates=false ⇒ rifiuto al chiamante).
    const snapshot = await engine.snapshot();
    // Snapshot → Blob: passiamo il buffer come ArrayBuffer concreto per evitare
    // l'incompatibilità Uint8Array<ArrayBufferLike> ↔ BlobPart (lib TS 5.x
    // distingue SharedArrayBuffer da ArrayBuffer in BlobPart).
    const id = await this.storage.putSaveState({
      romId,
      slot,
      core: rom.core,
      snapshotBlob: new Blob([toArrayBuffer(snapshot)]),
    });
    return id;
  }

  /**
   * Carica un save state nell'engine. Applica il guard cross-engine: se il
   * core canonico della ROM corrente non coincide con quello memorizzato
   * sull'entry, rifiuta onestamente (un payload WasmBoy NON è caricabile
   * da mGBA e viceversa — ADR-006 §Conseguenze).
   *
   * Il `currentCore` è quello dell'engine che sta girando ora: tipicamente
   * coincide con `rom.core` della ROM attiva, ma il dominio non ha modo di
   * leggerlo dall'EmulatorEngine (l'interfaccia ADR-003 non lo espone), quindi
   * è il chiamante a fornirlo (es. dalla rom in sessione).
   */
  async loadState(
    engine: EmulatorEngine,
    saveStateId: string,
    currentCore: Core,
  ): Promise<LoadStateResult> {
    const rec = await this.storage.getSaveState(saveStateId);
    if (!rec) {
      return { ok: false, reason: "not-found" };
    }
    if (rec.core !== currentCore) {
      return {
        ok: false,
        reason: "engine-mismatch",
        detail: `Save state prodotto da core "${rec.core}", engine corrente "${currentCore}".`,
      };
    }
    const buf = await rec.snapshotBlob.arrayBuffer();
    await engine.restore(new Uint8Array(buf));
    return { ok: true };
  }

  /** Elenca i save state della ROM (delega alla porta). */
  listSaveStates(romId: string): Promise<SaveStateRecord[]> {
    return this.storage.listSaveStates(romId);
  }

  /** Rimuove un save state (idempotente, delega alla porta). */
  deleteSaveState(id: string): Promise<void> {
    return this.storage.deleteSaveState(id);
  }

  // === SRAM (US-017) ===========================================================

  /**
   * Persiste la SRAM corrente dell'engine per la ROM `romId`.
   * Da invocare su stop/pausa (ADR-006 §Decisione p.3). No-op silenziosa se
   * l'engine ritorna null (nessuna SRAM o nessuna ROM caricata, vedi nota
   * di classe). Reject se la ROM non è registrata.
   */
  async autosaveSram(engine: EmulatorEngine, romId: string): Promise<AutosaveSramResult> {
    const rom = await this.storage.getRom(romId);
    if (!rom) {
      return {
        ok: false,
        reason: "rom-not-found",
        detail: `ROM non trovata (romId=${romId}).`,
      };
    }
    // `engine.getSram()` può lanciare se l'engine non espone la SRAM in runtime
    // (ADR-003): in quel caso degradiamo a esito esplicito "engine-unsupported"
    // così il chiamante non confonde "no SRAM" con "engine non supportato".
    let data: Uint8Array | null;
    try {
      data = await engine.getSram();
    } catch (e) {
      return {
        ok: false,
        reason: "engine-unsupported",
        detail: (e as Error).message,
      };
    }
    if (data === null) {
      // Casi non distinguibili a livello engine (F-030-1-R2): nessuna ROM
      // caricata OPPURE cartuccia senza battery RAM. In entrambi non c'è
      // nulla di valido da persistere → no-op, persisted=false.
      return { ok: true, persisted: false };
    }
    await this.storage.putSram(romId, new Blob([toArrayBuffer(data)]));
    return { ok: true, persisted: true };
  }

  /**
   * Reinietta la SRAM persistita nell'engine, se esiste, per la ROM `romId`.
   * Da invocare al `load` (ADR-006). Se non c'è SRAM persistita → no-op
   * con `restored:false`. Reject se la ROM non è registrata.
   */
  async restoreSram(engine: EmulatorEngine, romId: string): Promise<RestoreSramResult> {
    const rom = await this.storage.getRom(romId);
    if (!rom) {
      return {
        ok: false,
        reason: "rom-not-found",
        detail: `ROM non trovata (romId=${romId}).`,
      };
    }
    const rec = await this.storage.getSram(romId);
    if (!rec) {
      return { ok: true, restored: false };
    }
    const buf = await rec.data.arrayBuffer();
    await engine.loadSram(new Uint8Array(buf));
    return { ok: true, restored: true };
  }
}
