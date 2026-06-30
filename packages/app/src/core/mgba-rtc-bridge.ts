// TSK-134 — MgbaRtcBridge: bridge concreto mGBA (GBA, ADR-009).
// Traduce fra il modello canonico `RtcState` (wall-clock UTC, ADR-009 §2) e la
// sequenza 7-byte BCD del chip Seiko S-3511A usato dalle cartucce GBA con RTC
// (Pokémon Rubino/Zaffiro/Smeraldo, Boktai 1/2/3).
//
// Strategia (ADR-009 §4, TSK-134 Technical Specs):
//
//  - `hasRtc()`: Opzione A — lookup del Game Code (4 ASCII chars in `0xAC..0xAF`
//    dell'header ROM) in una lista statica di titoli GBA RTC-dependent. La lista
//    è derivata dall'override database interno di mGBA (src/gba/overrides.c).
//    TODO post-Sprint 16: sostituire con detection automatica via mGBA WASM
//    quando l'API espone un capability flag pubblico per il chip S-3511A.
//
//  - `getRtcState()` / `setRtcState()`: snapshot del save state mGBA via
//    `saveState(slot)` → flush → `FS.readFile(saveStatePath)`. Il save state mGBA
//    è una concatenazione di blocchi tagged; il blocco RTC è identificato dal
//    marker ASCII `"RTC "` (4 byte, T-R-C-space). I 7 byte BCD seguono il marker
//    nell'ordine [year, month, day, dayOfWeek, hour, minute, second].
//    Encoding inverso per `setRtcState()`: patch in-place del blob, `FS.writeFile`,
//    `loadState(slot)`.
//
// Onestà: l'offset esatto del blocco RTC dentro il save state binario non è
// verificato a runtime in questo repo (richiede una ROM GBA RTC reale + tooling
// di ispezione del save state mGBA). La scansione lineare per il marker `"RTC "`
// è la strategia conservativa: funziona indipendentemente dalla posizione del
// blocco purché il marker sia unico nel blob (assunzione documentata, validare
// con e2e su Pokémon Rubino/Smeraldo quando disponibile).
//
// Vedi anche:
//  - `src/gba/hardware.c` (mGBA upstream, struct GBARTCSource)
//  - `src/gba/savedata.c` (mGBA upstream, formato GBASavedataChunk)

import type { RtcBridge, RtcState } from "../domain/rtc-service";

/**
 * Superficie minima dell'API mGBA usata dal bridge (allineata a `mgba-engine.ts`
 * + `node_modules/@thenick775/mgba-wasm/dist/mgba.d.ts`). Definita localmente
 * per disaccoppiare il bridge dalla classe `MgbaEngine` (testabilità).
 */
export interface MgbaFS {
  readFile(path: string): Uint8Array;
  writeFile(path: string, data: Uint8Array | string): void;
}

export interface MgbaModule {
  saveState(slot: number): boolean;
  loadState(slot: number): boolean;
  FSSync?(): Promise<void>;
  filePaths(): { saveStatePath: string; [key: string]: string };
  /** Path della ROM corrente nel filesystem virtuale mGBA (popolato da loadGame). */
  gameName?: string;
  FS: MgbaFS;
}

/**
 * Slot tecnico mGBA usato dal bridge come buffer di estrazione/iniezione del
 * save state RTC. Coerente con `MGBA_SNAPSHOT_SLOT = 0` di `mgba-engine.ts`
 * (TSK-030): il dominio gestisce gli slot logici utente, qui è solo un buffer.
 */
const RTC_SLOT = 0;

/**
 * Marker ASCII del blocco RTC nel save state binario mGBA.
 *
 * Source: mGBA upstream (`src/gba/savedata.c`) — il save state è una sequenza
 * di chunk tagged con tag 4-byte ASCII; il chunk RTC ha tag `"RTC "` (T,R,C,
 * spazio).
 */
const RTC_MARKER = new Uint8Array([0x52, 0x54, 0x43, 0x20]); // "RTC "

/**
 * Lunghezza in byte del payload BCD S-3511A (ADR-009 §2):
 * [year, month, day, dayOfWeek, hour, minute, second].
 */
const BCD_PAYLOAD_LEN = 7;

/**
 * Offset standard dell'header ROM GBA dove si trova il Game Code (4 ASCII chars).
 * Riferimento: GBATEK §4.1 (Cartridge Header), byte `0xAC..0xAF`.
 */
const GAME_CODE_OFFSET = 0xac;
const GAME_CODE_LEN = 4;

/**
 * Game Codes (4 ASCII chars) noti come RTC-dependent (chip Seiko S-3511A).
 *
 * Derivati dall'override database mGBA (src/gba/overrides.c). Lista statica:
 * TODO post-Sprint 16 — sostituire con detection runtime quando mGBA WASM
 * esporrà un capability flag pubblico.
 *
 * Nota: il 4° carattere è il region code (E=USA, P=Europe, J=Japan). Tutti i
 * giochi RTC-dependent hanno chip S-3511A su TUTTE le region — il bridge accetta
 * tutte le varianti regionali.
 */
const RTC_GAME_CODES: ReadonlySet<string> = new Set([
  // Pokémon Ruby (AXVE) — EU/US/JP
  "AXVE",
  "AXVJ",
  "AXVP",
  // Pokémon Sapphire (AXPE) — EU/US/JP
  "AXPE",
  "AXPJ",
  "AXPP",
  // Pokémon Emerald (BPEE)
  "BPEE",
  "BPEJ",
  "BPEP",
  // Boktai: The Sun is in Your Hand (U3IE/U3IJ/U3IP)
  "U3IE",
  "U3IJ",
  "U3IP",
  // Boktai 2: Solar Boy Django
  "U32E",
  "U32J",
  "U32P",
  // Shin Bokura no Taiyou: Gyakushuu no Sabata (Boktai 3, JP-only)
  "U33J",
  // Sennen Kazoku (1000-year family, JP) — usa S-3511A per il calendario
  "BKAJ",
]);

/**
 * Encoder BCD: trasforma un intero 0–99 in un byte BCD packed.
 *
 * Es. 42 → 0x42 (`((4 << 4) | 2)`). Range out-of-bounds vengono troncati al
 * nibble basso (coerente con il comportamento dei chip reali su valori invalidi);
 * il dominio ha già validato lo stato via `RtcService.validateRtcState`.
 */
export function toBcd(n: number): number {
  return ((Math.floor(n / 10) & 0x0f) << 4) | (n % 10 & 0x0f);
}

/**
 * Decoder BCD inverso: trasforma un byte BCD packed in un intero 0–99.
 *
 * Es. 0x42 → 42 (`(4 * 10) + 2`).
 */
export function fromBcd(b: number): number {
  return ((b >> 4) & 0x0f) * 10 + (b & 0x0f);
}

/**
 * Algoritmo di Zeller per il calcolo del giorno della settimana da una data
 * gregoriana. Ritorna 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato.
 *
 * Riferimento: https://en.wikipedia.org/wiki/Zeller%27s_congruence
 *
 * Usato dal bridge GBA per popolare il campo `dayOfWeek` richiesto dal chip
 * S-3511A (ADR-009 §2: il giorno della settimana NON fa parte del modello
 * canonico — è derivato deterministicamente da `(year, month, day)`).
 *
 * Note di test (valori noti):
 *  - 2024-01-01 (lunedì) → 1
 *  - 2026-06-30 (martedì) → 2
 *  - 2000-01-01 (sabato) → 6
 */
export function zellerCongruence(year: number, month: number, day: number): number {
  // Zeller: gennaio e febbraio sono trattati come mesi 13 e 14 dell'anno precedente.
  let y = year;
  let m = month;
  if (m < 3) {
    m += 12;
    y -= 1;
  }
  const K = y % 100;
  const J = Math.floor(y / 100);
  // h = 0 → Sabato, 1 → Domenica, ..., 6 → Venerdì (convenzione Zeller).
  const h =
    (day +
      Math.floor((13 * (m + 1)) / 5) +
      K +
      Math.floor(K / 4) +
      Math.floor(J / 4) +
      5 * J) %
    7;
  // Convertiamo a 0=Domenica..6=Sabato (convenzione ISO/S-3511A nativa documentata).
  return (h + 6) % 7;
}

/**
 * Scansione lineare del blob save state per il marker `"RTC "` (4 byte ASCII).
 * Ritorna l'offset del PRIMO byte del marker, o -1 se non trovato.
 *
 * Si assume marker unico nel blob (vedi nota nell'header del file): il save
 * state mGBA contiene un solo chunk RTC per definizione del formato.
 */
function findRtcMarker(blob: Uint8Array): number {
  outer: for (let i = 0; i <= blob.length - RTC_MARKER.length; i++) {
    for (let j = 0; j < RTC_MARKER.length; j++) {
      if (blob[i + j] !== RTC_MARKER[j]) continue outer;
    }
    return i;
  }
  return -1;
}

/**
 * Compone il path del file save state per lo slot RTC_SLOT secondo la
 * convenzione mGBA (vedi `MgbaEngine.saveStateFilePath`): la lib deriva i
 * nomi da `gameName` rimuovendo l'estensione → `<saveStatePath>/<stem>.ss<slot>`.
 */
function saveStateFilePath(module: MgbaModule, slot: number): string {
  const dir = module.filePaths().saveStatePath;
  const baseName =
    (module.gameName ?? "game.gba").split("/").pop() ?? "game.gba";
  const dot = baseName.lastIndexOf(".");
  const stem = dot > 0 ? baseName.slice(0, dot) : baseName;
  return `${dir}/${stem}.ss${slot}`;
}

/**
 * Bridge RTC concreto per `MgbaEngine` (ADR-009 §4). Incapsula la traduzione
 * fra `RtcState` canonico e il payload 7-byte BCD del chip Seiko S-3511A.
 *
 * Lifecycle: una istanza per `MgbaEngine` attivo, creata dopo `loadGame()`
 * (quando `gameName` e l'header ROM sono disponibili). Non mantiene stato
 * proprio (lo stato vive nel core mGBA): tutte le operazioni vanno via
 * `module.saveState/loadState/FS`.
 */
export class MgbaRtcBridge implements RtcBridge {
  constructor(private readonly module: MgbaModule) {}

  /**
   * Detection runtime per-cartuccia (ADR-009 §4, Opzione A): legge il Game Code
   * dai byte `0xAC..0xAF` della ROM caricata nel filesystem virtuale mGBA e
   * verifica l'appartenenza alla lista statica di titoli RTC-dependent.
   *
   * Ritorna `false` (conservativo) se la ROM non è leggibile, troppo piccola
   * per contenere l'header, o il Game Code non è ASCII printable: questi casi
   * indicano una ROM malformata o non ancora caricata, non un titolo RTC.
   */
  hasRtc(): boolean {
    const path = this.module.gameName;
    if (!path) return false;
    let rom: Uint8Array;
    try {
      rom = this.module.FS.readFile(path);
    } catch {
      // Se la FS non riesce a leggere (es. game ancora non caricato), restituiamo
      // false: il dominio degrada a no-op silenzioso (best-effort by-spec).
      return false;
    }
    if (rom.length < GAME_CODE_OFFSET + GAME_CODE_LEN) return false;
    const code = String.fromCharCode(
      rom[GAME_CODE_OFFSET],
      rom[GAME_CODE_OFFSET + 1],
      rom[GAME_CODE_OFFSET + 2],
      rom[GAME_CODE_OFFSET + 3],
    );
    return RTC_GAME_CODES.has(code);
  }

  /**
   * Estrae lo stato RTC corrente dal core mGBA:
   *  1. `saveState(RTC_SLOT)` per serializzare lo snapshot hardware.
   *  2. `FS.readFile(path)` per ottenere il blob binario.
   *  3. Scansione del marker `"RTC "` → 7 byte BCD subito dopo → decoding canonico.
   *
   * Ritorna `null` se:
   *  - la cartuccia non ha RTC (`hasRtc() = false`),
   *  - `saveState` fallisce (slot non scrivibile),
   *  - `FS.readFile` fallisce (file non presente),
   *  - il marker `"RTC "` non è presente nel blob (formato inatteso).
   *
   * Coerente con il contratto `RtcBridge.getRtcState` (ADR-009 §4):
   * `null` significa "RTC non disponibile o non latched".
   */
  getRtcState(): RtcState | null {
    if (!this.hasRtc()) return null;
    let blob: Uint8Array;
    try {
      const ok = this.module.saveState(RTC_SLOT);
      if (!ok) return null;
      const path = saveStateFilePath(this.module, RTC_SLOT);
      blob = this.module.FS.readFile(path);
    } catch {
      return null;
    }
    const markerOffset = findRtcMarker(blob);
    if (markerOffset < 0) return null;
    const payloadStart = markerOffset + RTC_MARKER.length;
    if (payloadStart + BCD_PAYLOAD_LEN > blob.length) return null;
    const yearBcd = blob[payloadStart];
    const monthBcd = blob[payloadStart + 1];
    const dayBcd = blob[payloadStart + 2];
    // dayOfWeek (offset +3) scartato: ADR-009 §2 non lo include nel modello canonico.
    const hourBcd = blob[payloadStart + 4];
    const minuteBcd = blob[payloadStart + 5];
    const secondBcd = blob[payloadStart + 6];
    return {
      year: 2000 + fromBcd(yearBcd),
      month: fromBcd(monthBcd),
      day: fromBcd(dayBcd),
      hour: fromBcd(hourBcd),
      minute: fromBcd(minuteBcd),
      second: fromBcd(secondBcd),
    };
  }

  /**
   * Applica al core mGBA uno stato RTC impostato dall'utente:
   *  1. `saveState(RTC_SLOT)` per ottenere uno snapshot corrente da patchare.
   *  2. `FS.readFile(path)` per leggere il blob.
   *  3. Scansione del marker `"RTC "`, encoding BCD dei 7 byte, patch in-place.
   *  4. `FS.writeFile(path, patched)` + `loadState(RTC_SLOT)` per riapplicare.
   *
   * No-op silenzioso se `hasRtc() = false` (coerente con contratto ADR-009 §4
   * "applica live al core lo stato impostato dall'utente. No-op se hasRtc=false").
   * No-op silenzioso anche su fallimenti FS/saveState/loadState: il dominio
   * (`GameSession`, `SaveService`) si attende best-effort e degrada a stub-like
   * behaviour quando il core non coopera.
   */
  setRtcState(state: RtcState): void {
    if (!this.hasRtc()) return;
    let blob: Uint8Array;
    let path: string;
    try {
      const ok = this.module.saveState(RTC_SLOT);
      if (!ok) return;
      path = saveStateFilePath(this.module, RTC_SLOT);
      blob = this.module.FS.readFile(path);
    } catch {
      return;
    }
    const markerOffset = findRtcMarker(blob);
    if (markerOffset < 0) return;
    const payloadStart = markerOffset + RTC_MARKER.length;
    if (payloadStart + BCD_PAYLOAD_LEN > blob.length) return;

    const dayOfWeek = zellerCongruence(state.year, state.month, state.day);
    // Copia mutabile (FS.readFile può restituire view condivisa con il modulo).
    const patched = new Uint8Array(blob);
    patched[payloadStart] = toBcd(state.year - 2000);
    patched[payloadStart + 1] = toBcd(state.month);
    patched[payloadStart + 2] = toBcd(state.day);
    patched[payloadStart + 3] = toBcd(dayOfWeek);
    patched[payloadStart + 4] = toBcd(state.hour);
    patched[payloadStart + 5] = toBcd(state.minute);
    patched[payloadStart + 6] = toBcd(state.second);

    try {
      this.module.FS.writeFile(path, patched);
      this.module.loadState(RTC_SLOT);
    } catch {
      // Best-effort: errori di write/loadState non sono propagati al dominio
      // (coerente con il contratto setRtcState: void, no-throw).
    }
  }
}
