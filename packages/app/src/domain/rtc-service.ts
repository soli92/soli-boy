// TSK-125 — RtcService: interfaccia dominio dell'orologio interno (ADR-009, US-065).
// Astrae il concetto di Real-Time Clock dell'emulatore (es. MBC3 per Gambatte,
// S-3511A per mGBA su cartucce GBA con RTC). A questo layer il servizio è
// tecnologia-agnostico: espone un wall-clock con campi (year/month/day/hour/
// minute/second, semantica UTC) e tre operazioni di dominio:
//   1. hasRtc(platform)        — capability check conservativo (vedi nota sotto).
//   2. getRtcState(bridge)     — legge lo stato corrente dell'orologio dal core.
//   3. setRtcState(bridge, st) — applica al core uno stato impostato dall'utente.
//
// Il bridge concreto verso l'engine (WasmBoyRtcBridge / MgbaRtcBridge) è uno
// stub di interfaccia in questo TSK: le implementazioni reali sono Sprint 16
// e gestiranno il formato payload specifico del core.

/**
 * Stato dell'orologio interno della cartuccia, come wall-clock UTC.
 *
 * La semantica è deliberatamente "tipo-domain", indipendente dal formato
 * binario del core (5 registri MBC3 per Gambatte vs 7-byte BCD S-3511A per
 * mGBA): la conversione da/verso il payload engine è confinata nei bridge
 * concreti (ADR-009 §Decisione).
 *
 * Campi:
 *  - `year`   : anno (≥ 2000 — soglia post-Y2K, vedi `validateRtcState`).
 *  - `month`  : mese 1-12 (1 = gennaio).
 *  - `day`    : giorno 1-31 (range bound; non valida i giorni per mese).
 *  - `hour`   : ora 0-23.
 *  - `minute` : minuto 0-59.
 *  - `second` : secondo 0-59.
 */
export type RtcState = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/**
 * Capability flag che indica se l'entità in esame (piattaforma o cartuccia)
 * ha un orologio interno. È un wrapper esplicito per non confondersi con
 * `boolean` nudi in firma agli adapter.
 */
export type RtcCapability = {
  hasRtc: boolean;
};

/**
 * Bridge verso l'engine concreto. Il dominio NON conosce il formato payload
 * dell'engine (5 registri MBC3 per Gambatte, 7-byte BCD S-3511A per mGBA):
 * la conversione è confinata nelle implementazioni concrete.
 *
 * ADR-009: formato payload engine (5 registri MBC3 per Gambatte, 7-byte BCD
 * S-3511A per mGBA) confinato nei bridge concreti Sprint 16.
 *
 * Contratto (ADR-009 §4):
 *  - `hasRtc()` detection runtime per-cartuccia (vera fonte canonica della
 *    capability; la `hasRtc(platform)` esportata in questo modulo è solo un
 *    fallback conservativo basato sulla stringa piattaforma).
 *  - `getRtcState()` ritorna `null` se l'engine non ha (o non espone) un RTC
 *    in questo istante (es. nessuna ROM caricata, oppure cartuccia senza RTC).
 *    Il dominio non distingue i due casi a questo livello.
 *  - `setRtcState(state)` applica lo stato al core. Si assume che il chiamante
 *    abbia già validato lo stato via `RtcService.validateRtcState`.
 */
export interface RtcBridge {
  hasRtc(): boolean; // ADR-009 §4: detection runtime per-cartuccia
  getRtcState(): RtcState | null;
  setRtcState(state: RtcState): void;
}

/**
 * Capability check di piattaforma: indica se la piattaforma emulata "in
 * genere" ha un orologio interno.
 *
 * ADR-009: fallback conservativo — detection runtime canonica via
 * RtcBridge.hasRtc() nei bridge Sprint 16. A questo TSK il check è basato
 * sulla sola stringa piattaforma (GB/GBC → true, GBA/arcade/altro → false):
 * la realtà è che l'RTC è una caratteristica della *cartuccia* (MBC3 con
 * batteria su GB/GBC, S-3511A su alcune cartucce GBA), non della piattaforma.
 * I bridge concreti dello Sprint 16 esporranno una detection per-cartuccia
 * che sostituirà questo fallback nella pipeline reale.
 *
 * @param platform — id piattaforma (es. "gb", "gbc", "gba", "arcade").
 * @returns true per "gb"/"gbc"; false altrimenti.
 */
export function hasRtc(platform: string): boolean {
  // ADR-009: fallback conservativo — detection runtime canonica via
  // RtcBridge.hasRtc() nei bridge Sprint 16.
  // Case-insensitive: `recognizePlatform` espone Platform uppercase ("GB"),
  // mentre gli e2e URL param usano lowercase ("gbc").
  const p = platform.toLowerCase();
  return p === "gb" || p === "gbc";
}

/**
 * Servizio di dominio per l'orologio interno (TSK-125, ADR-009, US-065).
 *
 * Espresso come oggetto modulo (singleton stateless) anziché classe perché
 * non c'è stato di istanza da incapsulare: il `bridge` viene passato per call
 * (uno per engine attivo), e `validateRtcState` è puramente funzionale.
 *
 * Note di design:
 *  - La validazione di `validateRtcState` è **range-based**, non calendaristica:
 *    accetta es. 31/02 (giorni 1-31 e mesi 1-12 sono entrambi nei range).
 *    Validare i giorni effettivi del mese (28-31) introdurrebbe semantica
 *    locale (anni bisestili) non richiesta dall'US e fuori scope ADR-009.
 *    Le cartucce reali (MBC3, S-3511A) accettano comunque "day-of-year" o
 *    valori grezzi: il check stringente sarebbe più severo del core stesso.
 *  - La soglia `year >= 2000` è un sanity-check post-Y2K: prima del 2000
 *    nessun titolo GBC con RTC è stato programmato (Pokémon Crystal è del
 *    2000), e l'utente non ha ragione di impostare anni inferiori. Non è
 *    un upper bound: l'utente può impostare anche anni futuri (utile per
 *    aggirare eventi time-locked di Pokémon Gold/Silver/Crystal).
 */
export const RtcService = {
  /**
   * Legge lo stato corrente dell'orologio dal core via bridge.
   * Ritorna `null` se l'engine non ha RTC attivo (vedi contratto `RtcBridge`).
   */
  getRtcState(bridge: RtcBridge): RtcState | null {
    return bridge.getRtcState();
  },

  /**
   * Applica al core uno stato data/ora. Non valida internamente lo stato:
   * il chiamante deve invocare `validateRtcState` prima (separazione delle
   * responsabilità — il servizio non decide cosa fare in caso di stato
   * invalido, lascia la policy al chiamante / UI).
   */
  setRtcState(bridge: RtcBridge, state: RtcState): void {
    bridge.setRtcState(state);
  },

  /**
   * Valida lo stato RTC su range puramente numerici. Vedi nota di classe
   * sulla scelta range-based (non calendaristica).
   *
   * Range accettati:
   *  - year   ≥ 2000      (sanity post-Y2K; nessun upper bound — vedi nota)
   *  - month  ∈ [1, 12]
   *  - day    ∈ [1, 31]
   *  - hour   ∈ [0, 23]
   *  - minute ∈ [0, 59]
   *  - second ∈ [0, 59]
   *
   * @returns true se TUTTI i campi sono nei range; false altrimenti.
   */
  validateRtcState(state: RtcState): boolean {
    return (
      state.year >= 2000 &&
      state.month >= 1 &&
      state.month <= 12 &&
      state.day >= 1 &&
      state.day <= 31 &&
      state.hour >= 0 &&
      state.hour <= 23 &&
      state.minute >= 0 &&
      state.minute <= 59 &&
      state.second >= 0 &&
      state.second <= 59
    );
  },

  /**
   * Allinea l'orologio interno all'orologio del dispositivo (US-068, TSK-130).
   *
   * Legge `new Date()` locale del runtime, costruisce un `RtcState` in
   * **semantica wall-clock UTC** (campi `getUTC*`) come prescritto da
   * ADR-009 §5: il modello canonico `RtcState` è UTC; la conversione locale
   * ⇄ UTC è confinata al solo form UI Settings (rendering-time, stateless),
   * mentre `syncToDevice` opera sul payload persistito → UTC by-spec.
   *
   * Vincoli (ADR-009 §5 / RNF-05 sicurezza / RNF-06 privacy):
   *  - **Nessuna chiamata di rete**: l'unica sorgente è l'orologio di sistema
   *    locale del dispositivo (`Date.now()` via costruttore `Date`).
   *  - **Esplicito**: invocato solo su azione utente (vedi TSK-131), MAI
   *    automaticamente all'avvio/apertura Settings/ripresa.
   *  - **Guard bridge nullo/assente**: se `bridge` è `null`/`undefined` (es.
   *    nessuna ROM caricata, oppure engine senza RTC), il metodo è no-op
   *    silenzioso. Coerente con l'idempotenza degli stub `rtcBridge = null`
   *    documentati in ADR-009 §4 ("no-op silenzioso, comportamento già
   *    pianificato come best-effort").
   *
   * Nota implementativa: il metodo ritorna `void` perché `syncToDevice` scrive
   * direttamente sul bridge (effetto già osservabile via `bridge.setRtcState`)
   * e non ha bisogno di restituire lo stato applicato: il chiamante che voglia
   * refreshare i campi UI può ri-leggere lo stato via `getRtcState(bridge)`.
   * Discrepanza nota con TSK-130 Technical Specs (che indicava ritorno
   * `RtcState` + uso di `getFullYear/...` locale): la semantica UTC è risolta
   * in favore di ADR-009 §5 (gerarchia fonti: ADR > TSK), vedi log handoff
   * TSK-130. La firma `void` resta motivata dal contratto write-through del
   * bridge, non dalla gerarchia delle fonti.
   */
  syncToDevice(bridge: RtcBridge | null | undefined): void {
    if (!bridge) {
      // Guard: nessun engine / nessuna ROM / cartuccia senza RTC → no-op.
      return;
    }
    const now = new Date();
    const state: RtcState = {
      year: now.getUTCFullYear(),
      // getUTCMonth() ritorna 0..11; RtcState.month è 1..12 (ADR-009 §2).
      month: now.getUTCMonth() + 1,
      day: now.getUTCDate(),
      hour: now.getUTCHours(),
      minute: now.getUTCMinutes(),
      second: now.getUTCSeconds(),
    };
    bridge.setRtcState(state);
  },
};
