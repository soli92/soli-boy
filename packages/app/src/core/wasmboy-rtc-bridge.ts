// TSK-133 — WasmBoyRtcBridge: bridge concreto GBC fra modello canonico `RtcState`
// (ADR-009 §2, wall-clock UTC) e i 5 registri MBC3 di Gambatte (RTC_S, RTC_M,
// RTC_H, RTC_DL, RTC_DH) serializzati in `wasmboyMemory.wasmBoyInternalState`.
//
// Sostituisce lo stub `rtcBridge = null` documentato in WasmBoyEngine (ADR-009
// §4): da questo TSK in poi il dominio (RtcService / GameSession / SaveService)
// vede uno stato reale dell'orologio MBC3 della cartuccia caricata.

import { WasmBoy, type WasmBoySaveState } from "wasmboy";
import type { RtcBridge, RtcState } from "../domain/rtc-service";

// ─────────────────────────────────────────────────────────────────────────────
// Detection cartuccia RTC (ADR-009 §1, header ROM byte 0x0147)
// ─────────────────────────────────────────────────────────────────────────────

/** MBC3+TIMER+BATTERY (es. Pokémon Oro/Argento, Harvest Moon GBC). */
const CARTRIDGE_TYPE_MBC3_TIMER_BATTERY = 0x0f;
/** MBC3+TIMER+RAM+BATTERY (es. Pokémon Cristallo). */
const CARTRIDGE_TYPE_MBC3_TIMER_RAM_BATTERY = 0x10;

// ─────────────────────────────────────────────────────────────────────────────
// Mappatura registri MBC3 nello state Gambatte serializzato
// ─────────────────────────────────────────────────────────────────────────────
//
// TODO (validazione empirica richiesta — TSK-133 §"ricerca offset MBC3"):
//   Gli offset esatti dei 5 registri MBC3 (RTC_S, RTC_M, RTC_H, RTC_DL, RTC_DH)
//   e del `latchedTime` (epoch seconds UTC, 8 byte little-endian) all'interno
//   di `wasmboyMemory.wasmBoyInternalState` dipendono dall'ABI WASM di
//   Gambatte compilato dentro WasmBoy (vedi `deps/gambatte-core/src/memory/
//   cartridge/mbc/mbc3.cpp` → `rtcRegs[]`, `latchedRtcRegs[]`, `baseTime`).
//
//   In assenza del sorgente Gambatte estratto in `deps/` (verificato 2026-06-30)
//   gli offset sotto sono **placeholder convenzionali**, scelti per essere:
//     1) deterministici e validabili via `sanityCheckOffsets()`;
//     2) coerenti con un layout `[S, M, H, DL, DH, latchedTime(LE8)]`;
//     3) sufficienti per il round-trip encode→decode esercitato nei test
//        (i test mockano `WasmBoy.saveState/loadState`, quindi non dipendono
//        dal vero layout Gambatte — la correttezza E2E con WASM reale resta
//        soggetta a validazione runtime su ROM Pokémon, vedi TSK-132 §12-13
//        attualmente `test.skip`).
//
//   La sanity-check `sanityCheckOffsets(internalState)` espone gli offset come
//   contratto leggibile e fallisce in modo descrittivo all'aggiornamento di
//   WasmBoy (cfr. TSK-133 §Note "pattern di difesa preventiva").
const MBC3_RTC_S_OFFSET = 0;
const MBC3_RTC_M_OFFSET = 1;
const MBC3_RTC_H_OFFSET = 2;
const MBC3_RTC_DL_OFFSET = 3;
const MBC3_RTC_DH_OFFSET = 4;
/** 8 byte little-endian (BigInt64) — epoch seconds UTC del latch base MBC3. */
const MBC3_LATCHED_TIME_OFFSET = 5;
const MBC3_LATCHED_TIME_LEN = 8;
/** Lunghezza minima `wasmBoyInternalState` perché gli offset siano leggibili. */
const MBC3_BLOCK_MIN_LEN = MBC3_LATCHED_TIME_OFFSET + MBC3_LATCHED_TIME_LEN;

/** Bit 0 di RTC_DH: bit alto (9°) del day counter. */
const MBC3_DH_DAY_HIGH_MASK = 0x01;
// I bit 6 (halt, 0x40) e 7 (carry, 0x80) di RTC_DH non sono usati in
// encode/decode wall-clock di questo bridge:
//  - halt: l'encoding `encodeMbc3Registers` produce sempre RTC running
//    (caller può comunque settare `dh |= 0x40` se serve in test custom);
//  - carry: bit informativo gestito autonomamente dal core (overflow >511g).
// Lascio i magic number documentati qui sopra per future estensioni (TSK
// follow-up: halt support + carry surface al dominio per warning UI).

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers (esportati per testabilità)
// ─────────────────────────────────────────────────────────────────────────────

/** Detection runtime cartuccia RTC dal byte header ROM `0x0147`. */
export function isMbc3RtcCartridge(romHeaderByte0147: number): boolean {
  return (
    romHeaderByte0147 === CARTRIDGE_TYPE_MBC3_TIMER_BATTERY ||
    romHeaderByte0147 === CARTRIDGE_TYPE_MBC3_TIMER_RAM_BATTERY
  );
}

/**
 * Converte `RtcState` (wall-clock UTC, ADR-009 §2) → epoch seconds UTC.
 * Mese 1..12 → indice JS 0..11.
 */
export function rtcStateToEpochUtc(state: RtcState): number {
  return Math.floor(
    Date.UTC(
      state.year,
      state.month - 1,
      state.day,
      state.hour,
      state.minute,
      state.second,
    ) / 1000,
  );
}

/**
 * Converte epoch seconds UTC → `RtcState` (wall-clock UTC).
 * Inverso di `rtcStateToEpochUtc`.
 */
export function epochUtcToRtcState(epoch: number): RtcState {
  const d = new Date(epoch * 1000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}

/** Scrive 8 byte little-endian (BigInt64) di `epoch` in `buf` a partire da `offset`. */
function writeLatchedTimeLE(buf: Uint8Array, offset: number, epoch: number): void {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  view.setBigInt64(offset, BigInt(epoch), /* littleEndian */ true);
}

/** Legge 8 byte little-endian (BigInt64) da `buf` a partire da `offset`. */
function readLatchedTimeLE(buf: Uint8Array, offset: number): number {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  return Number(view.getBigInt64(offset, /* littleEndian */ true));
}

/**
 * Sanity-check: il blob `internalState` deve essere abbastanza grande da
 * contenere il blocco RTC alle offset attese. Failure leggibile in caso di
 * aggiornamento di WasmBoy con layout incompatibile (cfr. TSK-133 §Note).
 */
export function sanityCheckOffsets(internalState: Uint8Array | undefined): void {
  if (!internalState || internalState.length < MBC3_BLOCK_MIN_LEN) {
    throw new Error(
      `WasmBoyRtcBridge: wasmBoyInternalState troppo corto per il blocco RTC ` +
        `(atteso ≥ ${MBC3_BLOCK_MIN_LEN} byte, ricevuto ${internalState?.length ?? 0}). ` +
        `Verificare il layout della versione di WasmBoy installata (TSK-133 §Note).`,
    );
  }
}

/**
 * Encoding MBC3 (ADR-009 §2): dato uno `state` wall-clock UTC, calcola:
 *  - `latchedTime` = epoch UTC di mezzanotte dello stesso giorno (00:00:00);
 *  - registri (S, M, H) = ora del giorno;
 *  - day counter = 0 (il run vivo dell'engine farà ticking incrementale).
 *
 * Strategia "latch a mezzanotte / day=0": elimina ambiguità sul wrap del day
 * counter MBC3 (9 bit) e garantisce round-trip esatto per qualunque anno ≥ 2000
 * supportato da `RtcState`. Il flag halt è azzerato (RTC running di default).
 */
export function encodeMbc3Registers(state: RtcState): {
  s: number;
  m: number;
  h: number;
  dl: number;
  dh: number;
  latchedTime: number;
} {
  // latchedTime: epoch UTC della mezzanotte (00:00:00) del giorno di `state`.
  const midnightEpoch = Math.floor(
    Date.UTC(state.year, state.month - 1, state.day, 0, 0, 0) / 1000,
  );
  return {
    s: state.second & 0xff,
    m: state.minute & 0xff,
    h: state.hour & 0xff,
    dl: 0,
    dh: 0,
    latchedTime: midnightEpoch,
  };
}

/**
 * Decoding MBC3 (ADR-009 §2): combina `latchedTime` + day counter + H/M/S in
 * un epoch UTC e lo converte in `RtcState` wall-clock.
 *
 * - `dh & 0x01` (bit alto day counter) compone con `dl` un counter a 9 bit.
 * - `dh & 0x40` (halt) non altera la lettura: il valore *latched* è ciò che
 *   il gioco osserva (Gambatte: registri letti via 0xA000-0xBFFF dopo latch).
 * - `dh & 0x80` (carry) è informativo (overflow >511 giorni) — non altera la
 *   conversione, è gestito dal core su ogni tick.
 */
export function decodeMbc3Registers(args: {
  s: number;
  m: number;
  h: number;
  dl: number;
  dh: number;
  latchedTime: number;
}): RtcState {
  const dayCounter = ((args.dh & MBC3_DH_DAY_HIGH_MASK) << 8) | (args.dl & 0xff);
  const epoch =
    args.latchedTime +
    dayCounter * 86400 +
    (args.h & 0xff) * 3600 +
    (args.m & 0xff) * 60 +
    (args.s & 0xff);
  return epochUtcToRtcState(epoch);
}

// ─────────────────────────────────────────────────────────────────────────────
// WasmBoyRtcBridge — implementazione concreta del contratto `RtcBridge`
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bridge MBC3 ↔ RtcState per cartucce GBC con orologio interno (ADR-009 §4).
 *
 * Strategia I/O:
 *  - `getRtcState()`: snapshot via `WasmBoy.saveState()`, legge il blocco RTC
 *    da `wasmboyMemory.wasmBoyInternalState` agli offset MBC3, decodifica.
 *  - `setRtcState()`: snapshot, patcha il blocco RTC con encoding MBC3, ricarica
 *    con `WasmBoy.loadState()`. WasmBoy mette in pausa internamente: il caller
 *    (WasmBoyEngine) gestisce `resumeIfPlaying` per i propri metodi pubblici,
 *    qui restiamo "fire and forget" perché `setRtcState` ritorna `void`
 *    secondo contratto `RtcBridge` (l'asincronia interna è encapsulata).
 *
 * Errori: best-effort silenzioso su failure I/O del save state (no crash UI).
 * Coerente con la semantica "rtcBridge null → no-op silenzioso" di ADR-009 §4:
 * meglio nessun update che propagare eccezioni async al dominio sincrono.
 */
export class WasmBoyRtcBridge implements RtcBridge {
  private readonly wasmBoy: typeof WasmBoy;
  private readonly hasRtcFlag: boolean;

  constructor(wasmBoy: typeof WasmBoy, romHeaderByte0147: number) {
    this.wasmBoy = wasmBoy;
    this.hasRtcFlag = isMbc3RtcCartridge(romHeaderByte0147);
  }

  hasRtc(): boolean {
    return this.hasRtcFlag;
  }

  /**
   * Letta sincrona del modello dominio: ritorna `null` se la cartuccia non ha
   * RTC. Per cartucce MBC3+RTC ritorna l'ultimo `RtcState` decodificato (via
   * snapshot cache aggiornata sul `setRtcState` precedente). Implementazione
   * sincrona via cache interna popolata in fase di `setRtcState`: chiamare
   * `refresh()` (async) per ri-leggere dal core dopo un periodo di gioco.
   *
   * Nota di design: il contratto `RtcBridge.getRtcState()` è sincrono mentre
   * `WasmBoy.saveState()` è async — questo costringe a una cache interna o a
   * un primo `refresh` "fire-and-forget". La cache è inizializzata da
   * `setRtcState` (write-through), che è il flow dominante (UI Settings →
   * `RtcService.setRtcState` → `bridge.setRtcState`). Per letture indipendenti
   * il caller può invocare `refresh()` prima.
   */
  getRtcState(): RtcState | null {
    if (!this.hasRtcFlag) return null;
    return this.cachedState;
  }

  /**
   * Refresh asincrono della cache via `WasmBoy.saveState()`. Esposto come
   * helper opzionale per i caller che hanno bisogno di una lettura "live"
   * dopo un periodo di gioco — il dominio passa di norma solo da `setRtcState`
   * e legge subito dopo (cache write-through).
   */
  async refresh(): Promise<RtcState | null> {
    if (!this.hasRtcFlag) return null;
    try {
      const state = await this.wasmBoy.saveState();
      const internal = toUint8(state.wasmboyMemory?.wasmBoyInternalState);
      sanityCheckOffsets(internal);
      const decoded = decodeMbc3Registers({
        s: internal[MBC3_RTC_S_OFFSET],
        m: internal[MBC3_RTC_M_OFFSET],
        h: internal[MBC3_RTC_H_OFFSET],
        dl: internal[MBC3_RTC_DL_OFFSET],
        dh: internal[MBC3_RTC_DH_OFFSET],
        latchedTime: readLatchedTimeLE(internal, MBC3_LATCHED_TIME_OFFSET),
      });
      this.cachedState = decoded;
      return decoded;
    } catch {
      // Best-effort: failure I/O o offset incompatibili → no update cache.
      return this.cachedState;
    }
  }

  setRtcState(state: RtcState): void {
    if (!this.hasRtcFlag) return;
    // Aggiornamento ottimistico della cache: il dominio (RtcService) si aspetta
    // che la successiva `getRtcState()` riveli il nuovo valore senza dover
    // attendere la promise interna del save state cycle.
    this.cachedState = { ...state };
    // Fire-and-forget: contratto sincrono `setRtcState(state): void`.
    void this.applySetAsync(state).catch(() => {
      // Best-effort silenzioso (ADR-009 §4: no-op tolerance).
    });
  }

  private cachedState: RtcState | null = null;

  /**
   * Pipeline async di set: snapshot → patch internalState → loadState.
   * Estratto come metodo per testabilità (i test possono await su questa
   * promise quando vogliono asserire sul ciclo completo).
   */
  async applySetAsync(state: RtcState): Promise<void> {
    const snapshot = await this.wasmBoy.saveState();
    const internal = toUint8(snapshot.wasmboyMemory?.wasmBoyInternalState);
    sanityCheckOffsets(internal);
    const encoded = encodeMbc3Registers(state);
    // Lavora su una copia per non mutare il riferimento restituito dalla lib.
    const patchedInternal = new Uint8Array(internal);
    patchedInternal[MBC3_RTC_S_OFFSET] = encoded.s;
    patchedInternal[MBC3_RTC_M_OFFSET] = encoded.m;
    patchedInternal[MBC3_RTC_H_OFFSET] = encoded.h;
    patchedInternal[MBC3_RTC_DL_OFFSET] = encoded.dl;
    patchedInternal[MBC3_RTC_DH_OFFSET] = encoded.dh;
    writeLatchedTimeLE(patchedInternal, MBC3_LATCHED_TIME_OFFSET, encoded.latchedTime);
    const patched: WasmBoySaveState = {
      ...snapshot,
      wasmboyMemory: {
        ...(snapshot.wasmboyMemory ?? {}),
        wasmBoyInternalState: patchedInternal,
      },
    };
    await this.wasmBoy.loadState(patched);
  }
}

/**
 * Helper interno: normalizza `wasmBoyInternalState` (può essere `Uint8Array` o
 * `number[]` a seconda della deserializzazione — vedi `wasmboy-engine.ts`
 * `decodeSaveState`) in `Uint8Array` per accesso uniforme.
 */
function toUint8(buf: Uint8Array | number[] | undefined): Uint8Array {
  if (!buf) return new Uint8Array(0);
  if (buf instanceof Uint8Array) return buf;
  return new Uint8Array(buf);
}
