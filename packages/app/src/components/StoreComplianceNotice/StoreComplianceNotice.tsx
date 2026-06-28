// TSK-070 (US-034) — Avviso legale in-app per conformità store: no-ROM protette.
//
// Sezione "Legale / About" SEMPRE consultabile in Settings (TSK-070
// §Implementation Steps: "Creare (o aggiornare) sezione 'About / Legale' in
// Settings"). Soddisfa il requisito di pubblicazione Google Play + Apple
// App Store che impone agli emulatori una dichiarazione esplicita di NON
// distribuzione di ROM/BIOS protetti da copyright (US-034 §Business Rules:
// "L'app non distribuisce ROM o BIOS protetti, con avviso esplicito").
//
// Differenza rispetto agli altri componenti "legali" già in repo
// (R.2 zero invenzione, evitare duplicazioni cieche):
//
// - `LegalNotice` (TSK-006, US-006): nota breve nel panel "Info & Privacy"
//   (App.tsx tab `info`), focalizzata sul caricamento file ("non distribuisce
//   né include ROM o BIOS protetti da copyright. L'esecuzione avviene
//   esclusivamente su file forniti dall'utente.").
//
// - `PrivacyNotice` (TSK-069, US-033): informativa privacy on-device. Tema
//   diverso (privacy, non legale-copyright). Già presente in Settings.
//
// - `StoreComplianceNotice` (questo, TSK-070): sezione dedicata alla
//   compliance store, con testo richiesto verbatim dal TSK e cross-link
//   verso la sezione Privacy della stessa schermata Settings (TSK-070
//   §Implementation Steps p.3: "Collegare al PrivacyNotice").
//
// Il testo `STORE_COMPLIANCE_NOTICE_TEXT` è verbatim dal TSK-070
// §Technical Specs e fedele al modello reale dell'app:
// - "non include, distribuisce né supporta": invariante stack
//   (raw/tech_stack.md §Vincoli trasversali "nessuna distribuzione di
//   ROM/BIOS protetti") e architettura (FileLoader carica file utente,
//   nessuna fonte remota di ROM).
// - "Usa solo file di tua legittima proprietà": principio US-006/US-034
//   (l'utente è responsabile della legalità dei file caricati). Onesto:
//   evita claim non verificabili e non promette nulla che l'app non faccia.
//
// Stile: classi solids (`sd-card`, `sb-sec`, `sb-lbl`, `sb-note`) per
// continuità con `Settings` e `PrivacyNotice` (nessun design system
// improvvisato — raw/tech_stack.md §Design system).

import type { ReactElement } from "react";

const HEADING = "Legale: nessuna ROM protetta";

/**
 * Testo principale dell'avviso legale di conformità store. Verbatim dal
 * TSK-070 §Technical Specs. Esportato per i test (assertion sul contenuto).
 */
export const STORE_COMPLIANCE_NOTICE_TEXT =
  "Soli-boy non include, distribuisce né supporta ROM o BIOS coperti da " +
  "copyright. Usa solo file di tua legittima proprietà.";

/**
 * Nota complementare che chiarisce gli use case legittimi (homebrew,
 * dominio pubblico, ROM legalmente possedute). Mantenuta separata dal testo
 * principale così l'assertion "verbatim" del TSK resta secca e leggibile.
 */
export const STORE_COMPLIANCE_NOTICE_DETAIL =
  "L'app è destinata all'esecuzione di file di cui possiedi i diritti d'uso, " +
  "homebrew, o materiale di pubblico dominio. La responsabilità della " +
  "legalità dei file caricati è dell'utente.";

export interface StoreComplianceNoticeProps {
  /** Classi aggiuntive opzionali (allineato a LegalNotice / PrivacyNotice). */
  className?: string;
  /**
   * Quando `true`, sopprime l'intestazione interna (`<p className="sb-lbl">`).
   * Usato da Settings quando il `<summary>` del `<details>` accordion già
   * fornisce il titolo "Legale" — evita il doppio header. Default `false`:
   * nessuna variazione del rendering in tutti gli altri usi del componente.
   */
  headingHidden?: boolean;
}

/**
 * Sezione "Legale" per Settings. Sempre visibile, non dismissibile. Cita
 * esplicitamente la sezione Privacy della stessa schermata (cross-link in-app
 * richiesto dal TSK-070 §Implementation Steps p.3).
 */
export function StoreComplianceNotice({
  className,
  headingHidden = false,
}: StoreComplianceNoticeProps): ReactElement {
  const headingId = "sb-store-compliance-heading";
  return (
    <section
      className={["sd-card", "sb-sec", className].filter(Boolean).join(" ")}
      aria-labelledby={headingHidden ? undefined : headingId}
      data-testid="sb-store-compliance-section"
    >
      {!headingHidden && (
        <h2 id={headingId} className="sb-lbl">
          {HEADING}
        </h2>
      )}
      {/* aria-label distinto da "Avviso legale" (LegalNotice TSK-006): query e2e
          in tab Info & Privacy via helpers/app-nav.ts (openInfoPrivacyTab). */}
      <p
        className="sb-note"
        role="note"
        aria-label="Avviso conformità store: no-ROM protette"
      >
        <i className="ti ti-shield-lock" aria-hidden="true" />{" "}
        {STORE_COMPLIANCE_NOTICE_TEXT}
      </p>
      <p className="sb-note">{STORE_COMPLIANCE_NOTICE_DETAIL}</p>
      <p className="sb-note">
        <i className="ti ti-info-circle" aria-hidden="true" /> Per le pratiche di
        gestione dati on-device consulta la sezione{" "}
        <strong>Privacy: tutto resta sul tuo dispositivo</strong> qui sotto.
      </p>
    </section>
  );
}
