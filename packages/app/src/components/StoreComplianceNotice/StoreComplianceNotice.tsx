// TSK-070 (US-034) — Avviso legale in-app per conformità store: no-ROM protette.
// TSK-152 (US-098, EP-020) — Migrazione da classi solids (`sd-card`/`sb-sec`)
// a primitive shadcn/ui (Alert `variant="destructive"`). Il testo verbatim
// del TSK-070 §Technical Specs e i testid restano invariati.
//
// Sezione "Legale / About" SEMPRE consultabile in Settings e nella tab Info,
// per soddisfare il requisito Google Play + Apple App Store di dichiarazione
// esplicita di NON distribuzione di ROM/BIOS protetti da copyright.
//
// Aria: il container Alert espone `role="region"` (contenuto legale statico,
// non alert urgente). Il paragrafo principale mantiene `role="note"` con
// `aria-label="Avviso conformità store: no-ROM protette"` per essere
// individuato dai selettori e2e (`page.getByRole("note", { name: /avviso
// conformità store/i })`, vedi `e2e/helpers/app-nav.ts`).
//
// Il testo `STORE_COMPLIANCE_NOTICE_TEXT` è verbatim dal TSK-070
// §Technical Specs, `STORE_COMPLIANCE_NOTICE_DETAIL` completa gli use case
// legittimi (homebrew / dominio pubblico / responsabilità utente).

import type { ReactElement } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const HEADING = "Legale: nessuna ROM protetta";

/**
 * Testo principale dell'avviso legale di conformità store. Verbatim dal
 * TSK-070 §Technical Specs. Esportato per i test.
 */
export const STORE_COMPLIANCE_NOTICE_TEXT =
  "Soli-boy non include, distribuisce né supporta ROM o BIOS coperti da " +
  "copyright. Usa solo file di tua legittima proprietà.";

/**
 * Nota complementare che chiarisce gli use case legittimi (homebrew,
 * dominio pubblico, ROM legalmente possedute).
 */
export const STORE_COMPLIANCE_NOTICE_DETAIL =
  "L'app è destinata all'esecuzione di file di cui possiedi i diritti d'uso, " +
  "homebrew, o materiale di pubblico dominio. La responsabilità della " +
  "legalità dei file caricati è dell'utente.";

export interface StoreComplianceNoticeProps {
  /** Classi aggiuntive opzionali. */
  className?: string;
  /**
   * Quando `true`, sopprime l'intestazione interna (AlertTitle).
   * Usato da Settings quando il `<summary>` del `<details>` accordion già
   * fornisce il titolo "Legale" — evita il doppio header.
   */
  headingHidden?: boolean;
  /** Tono visivo: `destructive` (Settings) o `warning` (tab Info, prototipo). */
  tone?: "destructive" | "warning";
}

/**
 * Sezione "Legale" per Settings e Info. Sempre visibile, non dismissibile.
 * Cita esplicitamente la sezione Privacy (cross-link in-app, TSK-070
 * §Implementation Steps p.3).
 */
export function StoreComplianceNotice({
  className,
  headingHidden = false,
  tone = "destructive",
}: StoreComplianceNoticeProps): ReactElement {
  const headingId = "sb-store-compliance-heading";
  return (
    <Alert
      variant={tone === "destructive" ? "destructive" : "default"}
      role="region"
      aria-labelledby={headingHidden ? undefined : headingId}
      data-testid="sb-store-compliance-section"
      className={cn(
        tone === "warning" &&
          "border-amber-500/60 bg-amber-500/10 text-foreground [&>svg]:text-amber-600",
        className,
      )}
    >
      {!headingHidden && (
        <AlertTitle id={headingId}>{HEADING}</AlertTitle>
      )}
      <AlertDescription className="space-y-2">
        {/* aria-label distinto da "Avviso legale" (LegalNotice TSK-006): i
            selettori e2e/units cercano `role="note"` con questo nome per
            evitare collisioni fra i due componenti sulla stessa schermata. */}
        <p
          role="note"
          aria-label="Avviso conformità store: no-ROM protette"
        >
          <i className="ti ti-shield-lock" aria-hidden="true" />{" "}
          {STORE_COMPLIANCE_NOTICE_TEXT}
        </p>
        <p>{STORE_COMPLIANCE_NOTICE_DETAIL}</p>
        <p>
          <i className="ti ti-info-circle" aria-hidden="true" /> Per le pratiche
          di gestione dati on-device consulta la sezione{" "}
          <strong>Privacy: tutto resta sul tuo dispositivo</strong> qui sotto.
        </p>
      </AlertDescription>
    </Alert>
  );
}
