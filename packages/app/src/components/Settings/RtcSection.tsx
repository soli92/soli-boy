// TSK-126 — Settings: sezione data/ora RTC (US-065, ADR-009).
//
// Sezione del pannello Settings dedicata all'orologio interno (Real Time Clock)
// della cartuccia in esecuzione. La sezione è visibile **solo** quando la
// piattaforma corrente ha un RTC (`RtcService.hasRtc(platform)`) E l'engine
// espone un `bridge` non-null (fail-safe: niente sezione = niente azione su
// engine non disponibile, US-065 §Acceptance Criteria).
//
// Form a 6 campi (anno/mese/giorno/ora/minuto/secondo) con validazione range
// in-form (`RtcService.validateRtcState`): pulsante "Imposta" disabilitato se
// almeno un campo è fuori range; campo fuori range marcato `aria-invalid="true"`.
//
// Convenzioni UI: stesso pattern delle altre sezioni di `Settings.tsx`
// (accordion `<details>`, classi SoliDS `sb-*`, label accessibili, aria-live
// non intrusivo per i messaggi). Vedi anche TSK-066 (toggle), TSK-033 (Dati).
//
// Note ADR-009 §5 (timezone): l'`RtcState` canonico è UTC, ma l'UI presenta i
// campi nel timezone locale del dispositivo (più naturale per l'utente). In
// questo TSK la conversione UTC ⇄ locale **non è implementata** per ridurre
// scope e collegata semantica al modello (i bridge concreti dello Sprint 16
// sono comunque stub e non producono ancora valori reali): i campi sono trattati
// come wall-clock diretti. La conversione locale ⇄ UTC sarà introdotta quando
// `WasmBoyRtcBridge` / `MgbaRtcBridge` esporranno valori reali — al momento il
// `bridge` è null in tutti gli engine attivi (gli `EmulatorEngine` non
// inizializzano ancora `rtcBridge`), quindi questo componente di fatto non
// viene MAI montato in produzione: serve la pipeline UI in attesa dei bridge.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  hasRtc,
  RtcService,
  type RtcBridge,
  type RtcState,
} from "../../domain/rtc-service";

export interface RtcSectionProps {
  /** Piattaforma corrente (es. "gb", "gbc", "gba"). Determina la visibilità. */
  platform: string;
  /**
   * Bridge verso l'engine concreto. Se `null` (nessun gioco in esecuzione, o
   * engine senza RTC bridge inizializzato) la sezione non viene renderizzata.
   * Convenzione ADR-009 §4: il dominio è agnostico rispetto al payload core;
   * qui consumiamo solo `get/setRtcState`.
   */
  bridge: RtcBridge | null;
}

/**
 * Stato iniziale di fallback quando il bridge non espone valori (ritorna `null`
 * da `getRtcState()`). Allineato all'epoca canonica della factory (2026): è un
 * valore-segnaposto editabile, non una "ora corrente" (US-068 — sync-to-device
 * è gestito in TSK-131 con un'azione esplicita).
 */
const DEFAULT_STATE: RtcState = {
  year: 2026,
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
};

/** Per ogni campo: range [min, max] esposto sia come HTML `min/max` (UX
 * browser-native: stepper limits) sia per la validazione `aria-invalid`. La
 * SOURCE OF TRUTH del verdict valido/invalido resta `RtcService.validateRtcState`
 * (ADR-009 §5 "Validazione"): qui i bound HTML servono solo come hint visuale,
 * non per il gating del pulsante.
 */
const FIELD_RANGES: Record<keyof RtcState, { min: number; max: number }> = {
  year: { min: 2000, max: 9999 },
  month: { min: 1, max: 12 },
  day: { min: 1, max: 31 },
  hour: { min: 0, max: 23 },
  minute: { min: 0, max: 59 },
  second: { min: 0, max: 59 },
};

/**
 * Helper per il check per-campo: torna `true` se il singolo campo è nel range
 * accettato. Identico in semantica a `validateRtcState` ma scomposto per
 * marcare `aria-invalid` puntualmente sull'input incriminato (US-065 AC4
 * "feedback comprensibile"). Tenere in sync con i range di `validateRtcState`.
 */
function isFieldValid(field: keyof RtcState, value: number): boolean {
  if (!Number.isFinite(value) || !Number.isInteger(value)) return false;
  const { min, max } = FIELD_RANGES[field];
  return value >= min && value <= max;
}

/**
 * Etichette user-facing per i campi (italiano, coerente con il resto della UI).
 * Mantenute come funzione pura per consentire eventuale i18n futuro.
 */
const FIELD_LABELS: Record<keyof RtcState, string> = {
  year: "Anno",
  month: "Mese",
  day: "Giorno",
  hour: "Ora",
  minute: "Minuto",
  second: "Secondo",
};

/** Ordine di rendering dei campi (data ⇒ ora, naturale per l'utente). */
const FIELD_ORDER: (keyof RtcState)[] = [
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
];

export function RtcSection({ platform, bridge }: RtcSectionProps) {
  const [state, setState] = useState<RtcState>(DEFAULT_STATE);
  const [confirmed, setConfirmed] = useState(false);
  // Messaggio temporaneo per esiti "soft" del sync (es. `getRtcState` ritorna
  // null dopo `syncToDevice`: lo stato pre-sync resta invariato e l'utente
  // viene informato che il sync non ha prodotto valori applicabili). Non è un
  // errore bloccante: vive nella stessa `role="status"` della conferma di
  // "Imposta" perché entrambi sono notifiche non intrusive (US-065 AC4).
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Mount: popola dai valori del bridge se disponibili (ADR-009 — getRtcState
  // può ritornare null se il core non ha latched ancora un'orologio). Dipende
  // solo dall'identità del bridge: una nuova istanza di bridge → reload.
  //
  // Guard `hasRtc(platform)`: l'early-return JSX di visibilità avviene DOPO
  // gli hook (rules-of-hooks), quindi senza questo guard l'effect chiamerebbe
  // `getRtcState` anche per piattaforme senza RTC (es. 'gba'). Con i bridge
  // mock-style attuali è benigno; con i bridge concreti dello Sprint 16 può
  // produrre side-effect indesiderati (lettura registri inesistenti, log
  // spurious, ecc.). F-05 / review-iter-1.
  useEffect(() => {
    if (!hasRtc(platform)) return;
    if (bridge) {
      const current = RtcService.getRtcState(bridge);
      if (current) {
        setState(current);
      }
    }
  }, [bridge, platform]);

  // `useCallback` evita re-create della closure ad ogni render quando il
  // componente è stabile (i.e. bridge non cambia). Memoizziamo anche il
  // verdict di validità per evitare di re-computare 6 range check per ogni
  // re-render dei campi.
  //
  // NB regole hooks: tutti gli hook sono invocati PRIMA dell'early return
  // di visibilità — altrimenti il numero di hook varia tra render (es. quando
  // il `platform` cambia da `gba` a `gbc`) violando le rules-of-hooks di React.
  const validity = useMemo(
    () => ({
      year: isFieldValid("year", state.year),
      month: isFieldValid("month", state.month),
      day: isFieldValid("day", state.day),
      hour: isFieldValid("hour", state.hour),
      minute: isFieldValid("minute", state.minute),
      second: isFieldValid("second", state.second),
    }),
    [state],
  );

  const allValid = useMemo(
    () => RtcService.validateRtcState(state),
    [state],
  );

  const handleFieldChange = useCallback(
    (field: keyof RtcState, raw: string) => {
      // Input vuoto → `NaN`: lo stato porta NaN sul campo, che `isFieldValid`
      // marca come invalido (Number.isFinite/isInteger falsi). L'input HTML
      // mostra stringa vuota perché `displayValue` ricalcola `String(value)`
      // solo se finite (vedi sotto), quindi l'utente vede il campo vuoto e
      // `aria-invalid` correttamente settato a true. F-04 / review-iter-1:
      // il commento precedente diceva "convertiamo a 0" ma il codice produce
      // NaN — corretto qui per coerenza.
      const parsed = raw === "" ? Number.NaN : Number(raw);
      setState((prev) => ({ ...prev, [field]: parsed }));
      // Reset dei messaggi di conferma e sync: cambiare un campo dopo aver
      // premuto "Imposta" / "Usa ora del dispositivo" significa che l'utente
      // sta editando di nuovo, le notifiche precedenti non sono più rilevanti.
      setConfirmed(false);
      setSyncNotice(null);
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!bridge) return; // safety net: in teoria mai null qui (early return).
    if (!RtcService.validateRtcState(state)) return; // double-check pre-call.
    RtcService.setRtcState(bridge, state);
    setConfirmed(true);
    // Una volta confermata l'impostazione, eventuale notice "sync non
    // disponibile" non è più rilevante (è stato applicato uno stato valido).
    setSyncNotice(null);
  }, [bridge, state]);

  // TSK-131 — Sync esplicito all'orologio del dispositivo (US-068, ADR-009 §5).
  //
  // Semantica:
  //  1. `syncToDevice(bridge)` scrive il wall-clock UTC corrente sul core
  //     (side-effect immediato sul gioco — gli AC US-068 lo prescrivono).
  //  2. Ri-leggiamo lo stato via `getRtcState(bridge)` per popolare il form
  //     con i valori effettivamente applicati. Il bridge mock-style del test
  //     restituirebbe gli stessi valori scritti; in produzione il bridge
  //     reale potrebbe arrotondare (es. MBC3 ha granularità secondo, ma il
  //     payload BCD GBA pure — quindi semantica lossless atteso).
  //  3. NON marchiamo `confirmed = true`: la UX prescrive che il sync
  //     popoli i campi ma lasci all'utente la conferma esplicita con
  //     "Imposta". Resettiamo `confirmed` (l'utente sta editando di nuovo,
  //     stesso pattern di `handleFieldChange`).
  //
  // Nessuna chiamata di rete: l'unica sorgente di tempo è `new Date()` di
  // sistema dentro `RtcService.syncToDevice` (vedi RNF-05/RNF-06, ADR-009 §5).
  const handleSyncToDevice = useCallback(() => {
    if (!bridge) return; // safety net: in teoria mai null qui (early return).
    RtcService.syncToDevice(bridge);
    const current = RtcService.getRtcState(bridge);
    if (current) {
      setState(current);
      // Sync riuscito: nessuna notice (l'utente vede i campi popolati).
      setSyncNotice(null);
    } else {
      // F-03 / review-iter-1 — Sync ha avuto effetto sul core ma il bridge
      // non riesce a rileggere lo stato (es. core latched ma non ancora
      // sincronizzato, oppure bridge concreto stub). Manteniamo lo stato
      // pre-sync (i campi non cambiano: lo `setState(current)` è skippato)
      // e mostriamo una notice non bloccante nella `role="status"` esistente
      // così l'utente sa che il sync non ha prodotto valori applicabili al
      // form. Niente errore: il side-effect su core può comunque essere
      // andato a buon fine, semplicemente non visibile da qui.
      setSyncNotice("Sincronizzazione non disponibile");
    }
    setConfirmed(false);
  }, [bridge]);

  // Visibilità condizionale (ADR-009 §1 + US-065 §Acceptance Criteria):
  // sezione assente dal DOM se la piattaforma non ha RTC, o se non c'è un
  // bridge attivo (no game running). Posto DOPO tutti gli hook per rispettare
  // le rules-of-hooks (numero di hook stabile fra render).
  if (!hasRtc(platform) || bridge === null) {
    return null;
  }

  return (
    <details data-testid="sb-rtc-section">
      <summary>
        <h3 className="sb-lbl">Orologio interno (RTC) — data e ora</h3>
      </summary>
      <p className="sb-note">
        Imposta l'orologio interno della cartuccia. Valori espressi nel
        fuso orario locale del dispositivo.
      </p>
      <ul className="sb-keymap" aria-label="Impostazioni orologio interno RTC">
        {FIELD_ORDER.map((field) => {
          const { min, max } = FIELD_RANGES[field];
          const value = state[field];
          const valid = validity[field];
          // `Number.isNaN(value)` (NaN coerciato dall'input vuoto) viene
          // mostrato come campo vuoto in `<input type="number">` se passiamo
          // stringa vuota; passare `NaN` come `value` darebbe un warning React.
          const displayValue = Number.isFinite(value) ? String(value) : "";
          return (
            <li key={field} className="sb-row">
              <label className="sb-key" htmlFor={`sb-rtc-${field}`}>
                {FIELD_LABELS[field]}
              </label>
              <input
                id={`sb-rtc-${field}`}
                type="number"
                className="sb-sel"
                inputMode="numeric"
                min={min}
                max={max}
                step={1}
                value={displayValue}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                // F-01 / review-iter-1 — quando `valid` è true non emettiamo
                // l'attributo `aria-invalid="false"` (alcuni screen reader
                // l'hanno annunciato come "non valido: falso", confondente).
                // Con `undefined` React omette del tutto l'attributo.
                aria-invalid={!valid || undefined}
                aria-describedby={!valid ? `sb-rtc-${field}-error` : undefined}
                data-testid={`sb-rtc-${field}`}
              />
              {!valid && (
                // F-02 / review-iter-1 — niente `role="note"`: lo span è già
                // associato all'input via `aria-describedby`, lo screen reader
                // lo leggerà al focus dell'input incriminato. `role="note"`
                // non è una live region e qui era ridondante.
                <span
                  id={`sb-rtc-${field}-error`}
                  className="sb-note"
                  data-testid={`sb-rtc-${field}-error`}
                >
                  Valore fuori intervallo ({min}–{max}).
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="sb-btn sb-btn-primary sb-full"
        onClick={handleSubmit}
        disabled={!allValid}
        aria-label="Imposta data e ora dell'orologio interno"
        data-testid="sb-rtc-submit"
      >
        Imposta
      </button>
      {/* TSK-131 / US-068 — Azione esplicita "Usa ora del dispositivo".
          Sempre attiva quando la sezione è renderizzata (la visibilità è già
          gated da `hasRtc(platform) && bridge !== null`): nessun `disabled`,
          perché il sync è un'azione di reset deterministica indipendente
          dalla validità dei campi correnti. */}
      <button
        type="button"
        className="sb-btn sb-full"
        onClick={handleSyncToDevice}
        aria-label="Usa ora del dispositivo"
        data-testid="sb-rtc-sync-device"
      >
        Usa ora del dispositivo
      </button>
      {confirmed && (
        <p className="sb-note" role="status" data-testid="sb-rtc-confirmed">
          Orologio interno impostato.
        </p>
      )}
      {syncNotice && (
        // F-03 / review-iter-1 — Notice non bloccante per esito "soft" del
        // sync (es. bridge che non rilegge stato dopo `syncToDevice`).
        // Stessa `role="status"` (live region polite, non intrusiva) usata
        // dalla conferma "Imposta": coerente con la convenzione UI della
        // sezione (US-065 AC4 "feedback comprensibile, non modale").
        <p className="sb-note" role="status" data-testid="sb-rtc-sync-notice">
          {syncNotice}
        </p>
      )}
    </details>
  );
}
