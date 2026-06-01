// TSK-006 — Avviso legale no-copyright (US-006).
// Componente riusabile su token/classi del design system solids (sd-*).
// Riferimento visivo: nota in calce a schermata-settings (mockup).

const NOTICE_TEXT =
  "Soli-boy non distribuisce né include ROM o BIOS protetti da copyright. " +
  "L'esecuzione avviene esclusivamente su file forniti dall'utente.";

export interface LegalNoticeProps {
  /** classi aggiuntive opzionali. */
  className?: string;
}

export function LegalNotice({ className }: LegalNoticeProps) {
  return (
    <p
      className={["sb-note", className].filter(Boolean).join(" ")}
      role="note"
      aria-label="Avviso legale"
    >
      <i className="ti ti-info-circle" aria-hidden="true" /> {NOTICE_TEXT}
    </p>
  );
}

export { NOTICE_TEXT };
