// TSK-128 — GameSession: wiring RtcService ↔ engine ↔ StoragePort
// (persist on stop / restore on start). ADR-009 §4-5, US-066.
//
// Orchestratore di dominio del ciclo di vita di una sessione di gioco focalizzato
// sui side-effect "trasversali" al singolo engine: in questo TSK, esclusivamente
// la persistenza/ripristino dello stato dell'orologio interno (RTC) — il quinto
// dato della cartuccia, terza categoria di salvataggio dopo SRAM e save state
// (ADR-009 §3).
//
// Perché un modulo separato (e non un'estensione del CoreWrapper):
//  - Il CoreWrapper (TSK-007) è un wrapper sottile sull'engine, agnostico
//    rispetto allo storage (ADR-003). Iniettare `StoragePort` lì violerebbe
//    l'invariante "il dominio core resta engine-agnostico, lo storage resta
//    fuori dal wrapper".
//  - `GameSession` è il punto naturale dove si compongono engine + storage
//    + servizi di dominio (RtcService): lo stesso shape sarà riusato in
//    Sprint 16+ per altre operazioni di dominio cross-cutting (es. SRAM
//    autosave, hook lifecycle).
//
// Contratto best-effort (ADR-009 §4, §5):
//  - persist-on-stop e restore-on-start NON DEVONO MAI bloccare il gioco.
//    Ogni branch che potrebbe fallire (bridge null, storage reject, bridge
//    che ritorna null) degrada silenziosamente a no-op. I fallimenti veri
//    (storage reject) sono loggati `console.warn` ma non rilanciati a monte.
//  - `engine.rtcBridge = null` è uno stato pienamente legittimo finché i
//    bridge concreti (WasmBoyRtcBridge / MgbaRtcBridge) non sono implementati
//    Sprint 16: il flusso gira a vuoto, restore/persist sono no-op silenzioso.

import type { EmulatorEngine } from "../core/core-wrapper";
import type { RtcStatePort } from "../storage/port";
import { RtcService, type RtcBridge, type RtcState } from "./rtc-service";

/**
 * Dipendenze iniettate alla GameSession.
 *
 * - `engine`:  l'EmulatorEngine attivo (espone `rtcBridge?: RtcBridge | null`).
 *              La sessione NON costruisce o muta l'engine — è il caller
 *              (Player UI) a gestire load/start/stop dell'engine vero e proprio
 *              via `CoreWrapper`. Qui usiamo l'engine SOLO per leggere
 *              `engine.rtcBridge`. Resta nella firma per consentire estensioni
 *              future (es. SRAM autosave) senza cambiare il costruttore.
 * - `storage`: porta di persistenza RTC (ADR-009 §3). Iniettata come
 *              `RtcStatePort` (interface segregation, ADR-006 §Decisione p.2):
 *              questa sessione consuma SOLO la capability RTC, non tutta la
 *              `SaveStoragePort`. L'adapter unico (`indexedDbStorage`) la
 *              soddisfa per estensione strutturale.
 * - `romId`:   chiave logica della ROM (FK verso `roms.id`, ADR-009 §3). Mai
 *              vuota: il chiamante deve avere risolto la ROM (TSK-001) prima
 *              di avviare la sessione.
 */
export interface GameSessionDeps {
  engine: EmulatorEngine;
  storage: RtcStatePort;
  romId: string;
}

/**
 * GameSession — orchestratore del ciclo di vita "dominio" di una sessione di
 * gioco, complementare al CoreWrapper (TSK-007) che orchestra il ciclo di vita
 * dell'engine.
 *
 * Esposta come oggetto (non classe) per coerenza con `RtcService` (stateless,
 * niente da incapsulare oltre alle deps). Le deps sono passate per call così:
 *  - la sessione resta facilmente testabile con mock leggeri;
 *  - non c'è "engine corrente" da gestire come mutable state (l'engine attivo
 *    è proprietà del Player UI / CoreWrapper, non della sessione).
 *
 * Operazioni:
 *  - `restoreOnStart(deps)`: legge lo stato RTC persistito e lo applica
 *                            all'engine, se entrambi presenti. Best-effort.
 *  - `persistOnStop(deps)`:  legge lo stato RTC dall'engine e lo persiste,
 *                            se non null. Best-effort.
 *
 * Entrambe sono `Promise<void>` (lo storage è async, il bridge è sync):
 * il caller può `await` per sequenziare con altre operazioni di stop/start,
 * ma il valore di ritorno è void by-design (best-effort, no esito esplicito —
 * fail-silent + console.warn).
 */
export const GameSession = {
  /**
   * Ripristina lo stato RTC all'avvio della sessione (ADR-009 §4 "restore on start").
   *
   * Sequenza:
   *  1. Se `engine.rtcBridge` è null/undefined → no-op silenzioso.
   *     Coerente con gli stub `rtcBridge = null` di WasmBoy/Mgba engine prima
   *     dei bridge reali (Sprint 16): il flusso gira a vuoto.
   *  2. Legge lo stato persistito via `storage.getRtcState(romId)`. Se assente
   *     (prima sessione del gioco, o nessun setRtcState fatto prima) → no-op.
   *     Il core dell'engine userà il suo default (epoch base MBC3 / BCD reset).
   *  3. Se presente, applica live al core via `RtcService.setRtcState(bridge, state)`.
   *
   * Failure mode (best-effort, ADR-009 §5):
   *  - `storage.getRtcState` reject (es. IDB transaction error) → catturato,
   *    `console.warn` emesso, **NON** rilanciato. Il gioco prosegue.
   *  - `bridge.setRtcState` throw (improbabile su stub, possibile in futuro
   *    sui bridge reali con cartucce non-RTC che venissero mis-routed) →
   *    catturato, `console.warn` emesso, **NON** rilanciato.
   *
   * Non viene fatta detection runtime `hasRtc(platform)`: la presenza/assenza
   * del bridge è già una capability check sufficiente (ADR-009 §1: la detection
   * è per-cartuccia, non per-piattaforma; il bridge concreto incapsulerà la
   * detection MBC3/S-3511A). Lo stato persistito di una piattaforma senza RTC
   * semplicemente non esiste (perché `persistOnStop` non lo avrebbe scritto).
   */
  async restoreOnStart(deps: GameSessionDeps): Promise<void> {
    const { engine, storage, romId } = deps;
    const bridge: RtcBridge | null | undefined = engine.rtcBridge;
    if (!bridge) {
      // Stub null o assente: no-op silenzioso (ADR-009 §4 best-effort).
      return;
    }
    let persistedState: RtcState | null;
    try {
      persistedState = await storage.getRtcState(romId);
    } catch (err) {
      console.warn(
        `GameSession.restoreOnStart: lettura RTC dallo storage fallita per romId=${romId}; il gioco prosegue con il default del core.`,
        err,
      );
      return;
    }
    if (persistedState === null) {
      // Prima sessione di questo gioco (nessun put precedente): il core usa
      // il suo default. Non è un errore — comportamento atteso.
      return;
    }
    try {
      RtcService.setRtcState(bridge, persistedState);
    } catch (err) {
      console.warn(
        `GameSession.restoreOnStart: applicazione RTC al core fallita per romId=${romId}; il gioco prosegue con il default del core.`,
        err,
      );
    }
  },

  /**
   * Persiste lo stato RTC alla fermata della sessione (ADR-009 §4 "persist on stop").
   *
   * Sequenza:
   *  1. Se `engine.rtcBridge` è null/undefined → no-op silenzioso (stub).
   *  2. Legge lo stato corrente via `RtcService.getRtcState(bridge)`. Se ritorna
   *     null (cartuccia senza RTC, o RTC non latched) → no-op: niente da
   *     persistere.
   *  3. Se non null, scrive su storage via `storage.putRtcState(romId, state)`.
   *
   * Failure mode (best-effort, ADR-009 §5):
   *  - `bridge.getRtcState` throw → catturato, `console.warn`, **NON** rilanciato.
   *    Lo stop deve poter procedere anche se il bridge ha un bug runtime.
   *  - `storage.putRtcState` reject (es. IDB quota exceeded, IDB transaction
   *    abort) → catturato, `console.warn`, **NON** rilanciato. Lo stop procede
   *    e l'utente non resta bloccato in "salvataggio in corso".
   *
   * Nota di ordering: questo metodo NON dovrebbe essere invocato DOPO
   * `engine.stop()` se l'engine concreto resetta lo stato del core (es. WasmBoy
   * azzera `cartridgeRam` su quit). Il caller (Player UI) deve invocare
   * `persistOnStop` PRIMA di `engine.stop()` per catturare uno stato vivo.
   * Questo è coerente con il pattern già adottato per SRAM autosave (ADR-006
   * §Decisione p.3): "su stop/pausa, prima leggi dal core poi spegni".
   */
  async persistOnStop(deps: GameSessionDeps): Promise<void> {
    const { engine, storage, romId } = deps;
    const bridge: RtcBridge | null | undefined = engine.rtcBridge;
    if (!bridge) {
      // Stub null o assente: no-op silenzioso (ADR-009 §4 best-effort).
      return;
    }
    let currentState: RtcState | null;
    try {
      currentState = RtcService.getRtcState(bridge);
    } catch (err) {
      console.warn(
        `GameSession.persistOnStop: lettura RTC dal core fallita per romId=${romId}; lo stop procede ma lo stato RTC non sarà persistito.`,
        err,
      );
      return;
    }
    if (currentState === null) {
      // Cartuccia senza RTC (es. GBC con MBC1) o bridge non-latched: nulla
      // da persistere. Coerente con il contratto RtcBridge.getRtcState (vedi
      // rtc-service.ts §RtcBridge).
      return;
    }
    try {
      await storage.putRtcState(romId, currentState);
    } catch (err) {
      console.warn(
        `GameSession.persistOnStop: persistenza RTC fallita per romId=${romId}; lo stop procede comunque.`,
        err,
      );
    }
  },
};
