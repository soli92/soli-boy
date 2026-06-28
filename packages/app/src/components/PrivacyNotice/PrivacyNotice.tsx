// TSK-069 (US-033) — Privacy policy on-device: informativa utente.
//
// Componente UI con due varianti di rendering, controllate dalla prop `variant`:
//
// - `variant="banner"` (default): banner di primo avvio, mostrato sopra
//   l'app finché l'utente non clicca "Ho capito". Dismissibile. Pensato per
//   essere renderizzato in App.tsx solo se `!acknowledged`. Aria role=`region`
//   con `aria-labelledby` per essere riconoscibile da assistive tech.
//
// - `variant="section"`: sezione informativa SEMPRE disponibile in Settings
//   (TSK-069 §Technical Specs: "sempre disponibile in Settings → Privacy").
//   Non dismissibile, niente call-to-action. Stesso testo, layout coerente
//   con le altre sezioni di Settings (`sb-sec` + `sb-lbl`).
//
// Il contenuto del testo è in `PRIVACY_NOTICE_*` (esportati per i test).
// Citazioni di fonti verificabili nel codice (R.2 zero invenzione):
//
// - "Tutti i tuoi dati (...) restano sul tuo dispositivo": invariante
//   esplicitato in ADR-002 §Conseguenze "nessun dato lascia il dispositivo
//   (privacy on-device, US-033)" e materializzato dagli adapter
//   `IndexedDBAdapter` (web/mobile) e `NativeFsAdapter` (desktop) della
//   `StoragePort`/`SaveStoragePort`/`ConfigPort`.
// - "Nessun file viene inviato a server esterni": invariante US-033
//   "Nessun invio dei file dell'utente a server esterni" + ADR-002.
// - "Nessun account richiesto" e "Nessun tracking/analytics/telemetria":
//   formulazioni VERITIERE basate sul fatto che il codice non chiama API
//   di autenticazione né di analytics (verificabile in packages/app/src/**).
//   Mantenute generiche e onestamente verificabili (no claim su SDK
//   specifici di terze parti, dato che il claim è sull'assenza).
//
// Stile: classi solids (`sd-card`, `sb-sec`, `sb-note`, `sb-btn`) coerenti
// con `Settings` e `LegalNotice` (TSK-006). Nessun design system improvvisato.

import type { ReactElement } from "react";

const HEADING = "Privacy: tutto resta sul tuo dispositivo";

/**
 * Punti dell'informativa. Ogni voce riflette un comportamento REALE dell'app
 * (ADR-002 §Conseguenze, US-033 §Business Rules). Esportati per i test.
 */
export const PRIVACY_NOTICE_POINTS: ReadonlyArray<string> = [
  "Tutti i tuoi dati (ROM, salvataggi, configurazioni) restano sul tuo dispositivo.",
  "Nessun file viene inviato a server esterni.",
  "Non è richiesto alcun account: l'app funziona offline.",
  "Nessun tracking, analytics o telemetria.",
];

/**
 * Etichetta del pulsante di dismissione del banner di primo avvio.
 * Esportata per i test (assertion sul `getByRole('button', {name})`).
 */
export const PRIVACY_ACK_LABEL = "Ho capito";

export type PrivacyNoticeVariant = "banner" | "section";

export interface PrivacyNoticeProps {
  /**
   * Variante di rendering. Default `"banner"`: banner di primo avvio
   * dismissibile. `"section"`: sezione SEMPRE consultabile in Settings.
   */
  variant?: PrivacyNoticeVariant;
  /**
   * Invocata quando l'utente clicca "Ho capito" sul banner. Ignorata se
   * `variant="section"` (la sezione di Settings non è dismissibile).
   *
   * Pattern allineato a `LegalNotice` (TSK-006): il componente è UI-only,
   * la persistenza dell'ack è di competenza del chiamante (App.tsx via
   * `usePrivacyAck`).
   */
  onAcknowledge?: () => void;
  /** Classi aggiuntive opzionali (allineato a `LegalNotice`). */
  className?: string;
  /**
   * Quando `true`, sopprime l'intestazione interna (`<p className="sb-lbl">`).
   * Usato da Settings quando il `<summary>` del `<details>` accordion già
   * fornisce il titolo "Privacy" — evita il doppio header. Default `false`:
   * nessuna variazione del rendering in tutti gli altri usi del componente
   * (banner di primo avvio, modale, ecc.).
   */
  headingHidden?: boolean;
}

/** Lista dei punti privacy (markup condiviso fra banner e sezione). */
function PointList(): ReactElement {
  return (
    <ul className="sb-keymap" aria-label="Punti informativa privacy">
      {PRIVACY_NOTICE_POINTS.map((p) => (
        <li key={p} className="sb-row">
          <span className="sb-key">
            <i className="ti ti-shield-check" aria-hidden="true" /> {p}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PrivacyNotice({
  variant = "banner",
  onAcknowledge,
  className,
  headingHidden = false,
}: PrivacyNoticeProps): ReactElement {
  // ID stabile per il legame `aria-labelledby`. Distinto fra varianti così
  // banner + sezione possono coesistere nella stessa pagina senza id duplicati
  // (es. in Settings la sezione è sempre presente; il banner è rimosso da
  // App.tsx dopo l'ack, ma garantiamo unicità by design).
  const headingId = `sb-privacy-heading-${variant}`;

  if (variant === "section") {
    return (
      <section
        className={["sd-card", "sb-sec", className].filter(Boolean).join(" ")}
        aria-labelledby={headingHidden ? undefined : headingId}
        data-testid="sb-privacy-section"
      >
        {!headingHidden && (
          <h2 id={headingId} className="sb-lbl">
            {HEADING}
          </h2>
        )}
        <PointList />
        <p className="sb-note" role="note">
          <i className="ti ti-info-circle" aria-hidden="true" /> Questa app è
          progettata per funzionare interamente sul tuo dispositivo (vedi
          ADR-002 §Conseguenze). Nessuna parte dei tuoi dati di gioco viene
          condivisa con noi o con terze parti.
        </p>
      </section>
    );
  }

  // variant === "banner"
  return (
    <section
      className={["sd-card", "sb-sec", className].filter(Boolean).join(" ")}
      role="region"
      aria-labelledby={headingHidden ? undefined : headingId}
      data-testid="sb-privacy-banner"
    >
      {!headingHidden && (
        <h2 id={headingId} className="sb-lbl">
          {HEADING}
        </h2>
      )}
      <PointList />
      <button
        type="button"
        className="sb-btn sb-full"
        onClick={() => onAcknowledge?.()}
        aria-label={PRIVACY_ACK_LABEL}
      >
        {PRIVACY_ACK_LABEL}
      </button>
    </section>
  );
}
