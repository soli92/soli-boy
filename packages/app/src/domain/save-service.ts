// TSK-031 — SaveService (ADR-006 §Decisione p.3, US-016/US-017).
// Orchestra il flusso engine↔storage per i salvataggi:
//   - save state: engine.snapshot() → storage.putSaveState
//   - load state: storage.getSaveState → engine.restore (con guard cross-engine)
//   - SRAM autosave su stop/pausa: engine.getSram() → storage.putSram
//   - SRAM reload su load:        storage.getSram → engine.loadSram
//
// TSK-033 — Export/import salvataggi (ADR-006 §Decisione p.3, US-019):
//   - exportSaveState(id) → Blob portabile, versionato (JSON con base64 del blob).
//   - importSave(file)    → parse + validazione struttura/versione, verifica che
//                            la ROM esista (riassociazione), e persistenza via
//                            storage.putSaveState/putSram. Esito esplicito su
//                            file invalido o non corrispondente (no claim falsi).
//
// Resta agnostico sull'engine concreto (lavora sull'interfaccia EmulatorEngine,
// ADR-003) e sull'adapter di persistenza (StoragePort, ADR-002).

import type { EmulatorEngine } from "../core/core-wrapper";
import type { SaveStoragePort } from "../storage/port";
import type { SaveStateRecord } from "../storage/types";
import { RtcService, type RtcBridge, type RtcState } from "./rtc-service";
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

// === Export/import (US-019, TSK-033) ===========================================

/**
 * Magic string del formato file portabile (US-019, ADR-006 §Decisione p.3).
 * Permette di riconoscere a vista i file Soli-boy e di rifiutare in modo onesto
 * i file di altri prodotti senza falsi positivi.
 */
export const SAVE_FILE_FORMAT = "soliboy-save" as const;

/**
 * Versione corrente del formato. L'import accetta solo questa versione: in
 * caso di mismatch, restituisce un esito esplicito (no claim falsi). Future
 * estensioni possono allargare l'accettazione mantenendo la backward-compat.
 */
export const SAVE_FILE_VERSION = 1 as const;

/**
 * Tipi di entry serializzabili dal formato portabile.
 * - "saveState": istantanea dell'engine (ADR-006), entry dello store
 *                `saveStates` con `slot`/`core`/`romId`.
 * - "sram":      battery RAM della cartuccia (ADR-006), entry dello store
 *                `sram` con chiave `romId` (no slot, no core: è on-cart).
 */
export type SaveFileKind = "saveState" | "sram";

/**
 * Struttura on-disk del file portabile (JSON serializzato in UTF-8).
 * Campi comuni a tutte le `kind`:
 *  - `format`/`version`: gating per riconoscere il formato (vedi
 *    `SAVE_FILE_FORMAT`/`SAVE_FILE_VERSION`).
 *  - `romId`:            id della ROM a cui l'entry appartiene (riassociazione
 *    su import — US-019 Business Rule).
 *  - `data`:             payload binario codificato in base64 (i Blob non sono
 *    direttamente JSON-serializzabili; base64 è ASCII-safe e portabile).
 *  - `createdAt`:        timestamp originario, ricostruito su import dove
 *    possibile (gli adapter `putSaveState`/`putSram` derivano comunque il proprio).
 *
 * Campi specifici per `kind`:
 *  - "saveState": `slot` (numero, US-016) e `core` (ADR-006 — guard cross-engine).
 *  - "sram":      nessun campo aggiuntivo (chiave naturale = `romId`).
 */
export type SaveFileEnvelope =
  | {
      format: typeof SAVE_FILE_FORMAT;
      version: typeof SAVE_FILE_VERSION;
      kind: "saveState";
      romId: string;
      core: Core;
      slot: number;
      createdAt: number;
      data: string; // base64
      // TSK-129/EP-019 (review iter-2, F-2/F-5/F-8): l'envelope portabile
      // include lo stato RTC se presente sull'entry sorgente, per consentire
      // un round-trip completo export → import senza perdita silenziosa
      // dell'orologio interno. Campo opzionale: assente per save senza RTC
      // (giochi non-RTC o save legacy), in piena backward-compat (parseEnvelope
      // non lo richiede; l'import lo propaga solo se presente).
      rtcState?: RtcState;
    }
  | {
      format: typeof SAVE_FILE_FORMAT;
      version: typeof SAVE_FILE_VERSION;
      kind: "sram";
      romId: string;
      createdAt: number;
      data: string; // base64
    };

/**
 * Esito di un import (US-019 AC). L'API non lancia su input invalidi: ogni
 * fallimento è un `ok:false` con `reason` esplicita, perché l'UI deve poter
 * mostrare un avviso comprensibile (US-019 AC3).
 *
 * Reason mappabili a messaggi user-facing:
 *  - "invalid-file":        non leggibile come testo, JSON malformato, struttura
 *                            attesa assente. Messaggio: "File non valido".
 *  - "format-mismatch":     `format` ≠ "soliboy-save". Messaggio: "Il file non
 *                            è un salvataggio Soli-boy".
 *  - "unsupported-version": `version` ≠ versione supportata. Messaggio: "Versione
 *                            del file non supportata (atteso v<N>, trovato v<M>)".
 *  - "rom-not-found":       ROM associata assente nello storage (US-019 Business
 *                            Rule: riassociazione obbligatoria). Messaggio:
 *                            "La ROM associata non è presente in libreria".
 */
export type ImportSaveResult =
  | { ok: true; kind: SaveFileKind; romId: string; id?: string }
  | {
      ok: false;
      reason:
        | "invalid-file"
        | "format-mismatch"
        | "unsupported-version"
        | "rom-not-found";
      detail?: string;
    };

/**
 * Esito di un export. È un caso "rare-but-possible" che la ROM associata
 * sia stata cancellata fra la lettura del save state e l'export; per
 * coerenza con il resto del SaveService, lo esponiamo come esito esplicito
 * piuttosto che lanciare.
 */
export type ExportSaveStateResult =
  | { ok: true; blob: Blob; filename: string }
  | { ok: false; reason: "not-found" | "rom-not-found"; detail?: string };

// --- helper base64 (UTF-8 safe, no Buffer per stare cross-runtime) ------------

/**
 * Codifica un ArrayBuffer in base64. Non usiamo `Buffer` (Node-only) per
 * mantenere il dominio agnostico dall'ambiente; `btoa` opera su stringhe
 * binarie (latin-1), quindi convertiamo i bytes uno-a-uno. Chunking per
 * evitare stack overflow su payload grandi (`String.fromCharCode(...bytes)`
 * fallirebbe oltre ~125k argomenti).
 */
function bytesToBase64(buf: ArrayBuffer): string {
  const view = new Uint8Array(buf);
  const CHUNK = 0x8000;
  let bin = "";
  for (let i = 0; i < view.length; i += CHUNK) {
    const slice = view.subarray(i, i + CHUNK);
    bin += String.fromCharCode(...slice);
  }
  return typeof btoa === "function"
    ? btoa(bin)
    : // Fallback Node (es. vitest env:node): atob/btoa non sono sempre globali
      // su versioni più vecchie; in pratica Node ≥ 16 li espone.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).Buffer.from(bin, "binary").toString("base64");
}

/** Decodifica una stringa base64 in ArrayBuffer. Speculare a `bytesToBase64`. */
function base64ToBytes(b64: string): ArrayBuffer {
  const bin =
    typeof atob === "function"
      ? atob(b64)
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

// --- type guards (validano la struttura senza fidarsi del JSON arbitrario) ---

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Valida che `v` sia un envelope ben formato (formato + versione + campi
 * specifici per `kind`). Una validazione strutturale è necessaria perché
 * il JSON in input è arbitrario; lo type narrowing dà al chiamante l'envelope
 * tipizzato senza cast non sicuri.
 */
function parseEnvelope(v: unknown):
  | { ok: true; envelope: SaveFileEnvelope }
  | { ok: false; reason: "invalid-file" | "format-mismatch" | "unsupported-version"; detail?: string } {
  if (!isPlainObject(v)) {
    return { ok: false, reason: "invalid-file", detail: "Root JSON non è un oggetto." };
  }
  if (v.format !== SAVE_FILE_FORMAT) {
    return {
      ok: false,
      reason: "format-mismatch",
      detail: `Campo "format" atteso "${SAVE_FILE_FORMAT}", trovato ${JSON.stringify(v.format)}.`,
    };
  }
  if (v.version !== SAVE_FILE_VERSION) {
    return {
      ok: false,
      reason: "unsupported-version",
      detail: `Versione attesa ${SAVE_FILE_VERSION}, trovata ${JSON.stringify(v.version)}.`,
    };
  }
  if (typeof v.romId !== "string" || v.romId.length === 0) {
    return { ok: false, reason: "invalid-file", detail: "Campo \"romId\" assente o non stringa." };
  }
  if (typeof v.data !== "string") {
    return { ok: false, reason: "invalid-file", detail: "Campo \"data\" assente o non stringa." };
  }
  if (typeof v.createdAt !== "number") {
    return { ok: false, reason: "invalid-file", detail: "Campo \"createdAt\" assente o non numero." };
  }
  if (v.kind === "saveState") {
    if (typeof v.slot !== "number") {
      return { ok: false, reason: "invalid-file", detail: "Campo \"slot\" assente o non numero." };
    }
    if (typeof v.core !== "string") {
      return { ok: false, reason: "invalid-file", detail: "Campo \"core\" assente o non stringa." };
    }
    // CQRL iter-3 N-1: validazione strutturale del campo opzionale `rtcState`.
    // Policy strip (best-effort, ADR-009 §4): se `rtcState` è presente ma malformato
    // (non-oggetto, oppure oggetto con campi fuori range), lo silenziamo via delete
    // anziché rigettare l'intero import. Razionale: l'RTC è un sotto-sistema accessorio
    // (coerente con la policy save/load best-effort di SaveService) e un file altrimenti
    // valido NON deve essere reso non-importabile per un campo opzionale corrotto;
    // l'entry importata sarà priva di rtcState e l'eventuale loadState non chiamerà
    // setRtcState (no claim falsi, no payload spazzatura propagato all'engine).
    if (v.rtcState !== undefined) {
      const rtc = v.rtcState;
      // `validateRtcState` è tipizzato su RtcState e non gestisce null/non-object:
      // serve un pre-check `isPlainObject` per evitare TypeError a runtime.
      if (!isPlainObject(rtc) || !RtcService.validateRtcState(rtc as RtcState)) {
        // eslint-disable-next-line no-console
        console.warn("[parseEnvelope] rtcState malformato: ignorato");
        delete (v as Record<string, unknown>).rtcState;
      }
    }
    return { ok: true, envelope: v as SaveFileEnvelope };
  }
  if (v.kind === "sram") {
    return { ok: true, envelope: v as SaveFileEnvelope };
  }
  return {
    ok: false,
    reason: "invalid-file",
    detail: `Campo "kind" sconosciuto: ${JSON.stringify(v.kind)}.`,
  };
}

/**
 * Estrae il testo da un input flessibile: l'UI può passare un `Blob`/`File`
 * (input file), e i test possono passare direttamente la stringa JSON o
 * un `ArrayBuffer`. Mantenere un unico punto di estrazione semplifica il
 * call site e localizza il parsing/validation.
 */
async function readAsText(input: Blob | ArrayBuffer | string): Promise<string> {
  if (typeof input === "string") return input;
  if (input instanceof ArrayBuffer) {
    return new TextDecoder("utf-8").decode(new Uint8Array(input));
  }
  return input.text();
}

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
   *
   * TSK-129 (ADR-009 §3, US-067) — `rtcBridge?` opzionale: se passato e
   * non-null, lo stato corrente dell'orologio interno (`RtcService.getRtcState`)
   * viene incluso nell'entry persistita come campo opzionale `rtcState`. Policy
   * **best-effort, null-safe**:
   *  - `rtcBridge` assente / `null` / `undefined` → campo `rtcState` non incluso
   *    (comportamento invariato per i giochi senza RTC, compat all'indietro
   *    automatica con i call site preesistenti che non passano il bridge).
   *  - `RtcService.getRtcState(bridge)` ritorna `null` (engine senza RTC attivo)
   *    → campo `rtcState` non incluso (nessun claim di "RTC zero").
   *  - Un'eventuale eccezione del bridge non interrompe il save: viene
   *    registrata via `console.warn` e l'entry viene persistita comunque
   *    SENZA il campo `rtcState`. La policy "save dell'emulatore non bloccato
   *    da un sotto-sistema accessorio" è coerente con il dual best-effort
   *    su SRAM (ADR-006) e con la natura accessoria dell'RTC in EP-019.
   */
  async saveState(
    engine: EmulatorEngine,
    romId: string,
    slot: number,
    rtcBridge?: RtcBridge | null,
  ): Promise<string> {
    const rom = await this.storage.getRom(romId);
    if (!rom) {
      throw new Error(`SaveService.saveState: ROM non trovata (romId=${romId}).`);
    }
    // `engine.snapshot()` farà reject onesto se l'engine non supporta i save state
    // (capabilities.saveStates=false ⇒ rifiuto al chiamante).
    const snapshot = await engine.snapshot();

    // Cattura RTC best-effort (TSK-129). Confinata in try/catch: un bridge che
    // lancia non deve invalidare lo snapshot dell'emulatore (vedi nota di metodo).
    let rtcState: RtcState | null = null;
    if (rtcBridge) {
      try {
        rtcState = RtcService.getRtcState(rtcBridge);
      } catch (e) {
        // Best-effort: log + procedi senza rtcState (variabile già `null`).
        // eslint-disable-next-line no-console
        console.warn(
          `SaveService.saveState: cattura RTC fallita (romId=${romId}, slot=${slot}): ${(e as Error).message}. Procedo senza rtcState.`,
        );
      }
    }

    // Snapshot → Blob: passiamo il buffer come ArrayBuffer concreto per evitare
    // l'incompatibilità Uint8Array<ArrayBufferLike> ↔ BlobPart (lib TS 5.x
    // distingue SharedArrayBuffer da ArrayBuffer in BlobPart).
    // Il campo `rtcState` è incluso SOLO se non-null: spread condizionale
    // (`...(rtcState !== null && { rtcState })`) per evitare di scrivere
    // `rtcState: undefined` nell'entry (semantica IDB: undefined viene
    // serializzato; preferiamo l'assenza pulita del campo).
    const id = await this.storage.putSaveState({
      romId,
      slot,
      core: rom.core,
      snapshotBlob: new Blob([toArrayBuffer(snapshot)]),
      ...(rtcState !== null ? { rtcState } : {}),
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
    rtcBridge?: RtcBridge | null,
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

    // Restore RTC best-effort (TSK-129, ADR-009 §3, US-067). Policy null-safe:
    //  - `rec.rtcState` assente (entry legacy pre EP-019, oppure save fatto
    //    senza bridge) → no-op silenzioso, compat all'indietro by-design.
    //  - `rtcBridge` assente / null → no-op silenzioso (il chiamante non
    //    ha bridge da applicare; non c'è nulla da fare).
    //  - Eccezione dal bridge → `console.warn`, restore dell'emulatore già
    //    riuscito → restituiamo comunque `{ ok: true }` (l'utente vede il
    //    gioco caricato; il drift sull'orologio interno è degrade-graceful,
    //    coerente con la natura "accessoria" dell'RTC, ADR-009 §Decisione).
    if (rec.rtcState !== undefined && rtcBridge) {
      try {
        RtcService.setRtcState(rtcBridge, rec.rtcState);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(
          `SaveService.loadState: ripristino RTC fallito (saveStateId=${saveStateId}): ${(e as Error).message}. Restore dell'emulatore già completato; orologio non riallineato.`,
        );
      }
    }

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

  // === Export / Import (US-019, TSK-033) =======================================

  /**
   * Esporta un save state come file portabile, versionato (ADR-006 §Decisione p.3).
   *
   * Formato (vedi `SaveFileEnvelope`): JSON UTF-8 con
   *  { format:"soliboy-save", version:1, kind:"saveState", romId, core, slot,
   *    createdAt, data: base64(snapshotBlob) }.
   *
   * Scelte:
   *  - JSON+base64 sceglie portabilità (file di testo, mai-corrotto da editor)
   *    su compattezza: il save state è piccolo (<128 KB) e l'overhead ~33% del
   *    base64 è accettabile (US-019 — esperienza umana, no rete).
   *  - Il file include `core`: l'import valida la compatibilità cross-engine
   *    già al check-in (rifiuto onesto, mai un load mascherato).
   *
   * Ritorna un esito esplicito (no throw) anche per "save state non trovato",
   * coerente con `loadState`.
   */
  async exportSaveState(saveStateId: string): Promise<ExportSaveStateResult> {
    const rec = await this.storage.getSaveState(saveStateId);
    if (!rec) {
      return { ok: false, reason: "not-found", detail: `Save state ${saveStateId} non trovato.` };
    }
    // Verifica che la ROM esista ancora: un export di un orphan record sarebbe
    // un file inutile (impossibile reimportarlo — ADR-006). Esito esplicito.
    const rom = await this.storage.getRom(rec.romId);
    if (!rom) {
      return {
        ok: false,
        reason: "rom-not-found",
        detail: `ROM ${rec.romId} associata al save state non più presente.`,
      };
    }
    const bytes = await rec.snapshotBlob.arrayBuffer();
    // F-2/F-5/F-8 (review iter-2): propaga `rtcState` se presente sull'entry,
    // via spread condizionale per mantenere il campo assente quando undefined
    // (coerente con la policy null-safe del save: nessun claim su "RTC zero"
    // né sporcizia JSON con `rtcState: undefined`).
    const envelope: SaveFileEnvelope = {
      format: SAVE_FILE_FORMAT,
      version: SAVE_FILE_VERSION,
      kind: "saveState",
      romId: rec.romId,
      core: rec.core,
      slot: rec.slot,
      createdAt: rec.createdAt,
      data: bytesToBase64(bytes),
      ...(rec.rtcState !== undefined ? { rtcState: rec.rtcState } : {}),
    };
    // application/json + filename derivato dal titolo (sanitizzato) + slot.
    // Il filename è un suggerimento per il download — l'UI lo userà come
    // attributo `download` dell'anchor.
    const safeTitle = (rom.title ?? "save").replace(/[^a-z0-9._-]+/gi, "_");
    const filename = `${safeTitle}.slot${rec.slot}.soliboy-save.json`;
    const blob = new Blob([JSON.stringify(envelope)], { type: "application/json" });
    return { ok: true, blob, filename };
  }

  /**
   * Importa un file di salvataggio precedentemente esportato (US-019 AC2/AC3).
   *
   * Sequenza:
   *  1. Lettura come testo (Blob/File/ArrayBuffer/stringa).
   *  2. JSON.parse difensivo: errore → `invalid-file`.
   *  3. Validazione strutturale (`parseEnvelope`): `format`/`version` mismatch
   *     mappati a reason dedicate per UX comprensibile.
   *  4. Verifica esistenza ROM (riassociazione, US-019 Business Rule):
   *     assente → `rom-not-found` (non si persistono entry orfane).
   *  5. Persistenza via storage (`putSaveState`/`putSram`): nuova entry,
   *     `id`/`createdAt` derivati dall'adapter (il `createdAt` originale è
   *     informativo nel file, ma non sovrascriviamo l'invariante dello store).
   *
   * Nota su `kind:"sram"`: per US-017 una sola entry SRAM per ROM è ammessa.
   * `putSram(romId, blob)` sovrascrive l'entry esistente, coerente con
   * il comportamento di reimport.
   */
  async importSave(input: Blob | ArrayBuffer | string): Promise<ImportSaveResult> {
    let text: string;
    try {
      text = await readAsText(input);
    } catch (e) {
      return {
        ok: false,
        reason: "invalid-file",
        detail: `Impossibile leggere il file: ${(e as Error).message}`,
      };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return {
        ok: false,
        reason: "invalid-file",
        detail: `JSON malformato: ${(e as Error).message}`,
      };
    }
    const env = parseEnvelope(parsed);
    if (!env.ok) {
      return { ok: false, reason: env.reason, detail: env.detail };
    }
    const { envelope } = env;

    // Riassociazione: la ROM target deve esistere (US-019 Business Rule).
    const rom = await this.storage.getRom(envelope.romId);
    if (!rom) {
      return {
        ok: false,
        reason: "rom-not-found",
        detail: `La ROM ${envelope.romId} non è presente nella libreria.`,
      };
    }

    // Decodifica payload + persistenza per kind.
    let dataBuf: ArrayBuffer;
    try {
      dataBuf = base64ToBytes(envelope.data);
    } catch (e) {
      return {
        ok: false,
        reason: "invalid-file",
        detail: `Payload base64 non decodificabile: ${(e as Error).message}`,
      };
    }

    if (envelope.kind === "saveState") {
      // F-033-02 (ADR-006 §Conseguenze: "l'import valida la compatibilità"):
      // il `core` dell'envelope deve coincidere con quello canonico della ROM
      // target. Un saveState mGBA su una ROM GB sarebbe un'entry non caricabile
      // (il guard cross-engine la rifiuterebbe in `loadState`): rifiutiamo ora,
      // PRIMA di `putSaveState`, per evitare storage cruft / entry inutili.
      // Reason riusata: `format-mismatch` (mantiene invariata la mappatura
      // messaggi user-facing in Settings.tsx — vedi `handleImportFile`).
      if (rom.core !== envelope.core) {
        return {
          ok: false,
          reason: "format-mismatch",
          detail: `Core dell'envelope "${envelope.core}" diverso da quello della ROM "${rom.core}".`,
        };
      }
      // F-2/F-5/F-8 (review iter-2): se l'envelope porta `rtcState`, lo
      // ripristiniamo nell'entry persistita usando lo stesso spread condizionale
      // del path `saveState()` (nessun campo `rtcState: undefined` su IDB).
      const id = await this.storage.putSaveState({
        romId: envelope.romId,
        slot: envelope.slot,
        core: envelope.core,
        snapshotBlob: new Blob([dataBuf]),
        ...(envelope.rtcState !== undefined ? { rtcState: envelope.rtcState } : {}),
      });
      return { ok: true, kind: "saveState", romId: envelope.romId, id };
    }
    // kind === "sram"
    await this.storage.putSram(envelope.romId, new Blob([dataBuf]));
    return { ok: true, kind: "sram", romId: envelope.romId };
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
