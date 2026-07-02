// TSK-069 (US-033) — Privacy policy on-device: informativa utente.
// TSK-152 (US-098, EP-020) — Migrazione da classi solids (`sd-card`/`sb-sec`) a
// primitive shadcn/ui (Card per la sezione, Alert per il banner di primo avvio).
// Il contratto pubblico (props, testid, aria-labelledby, testi esportati)
// resta invariato: cambia solo il markup di rendering.
//
// - `variant="banner"` (default): overlay fixed sopra l'app finché l'utente
//   non clicca "Ho capito". Ancorato in basso, full-width, sopra il layout.
//   Aria `role="region"` (non `role="alert"`: contenuto informativo non
//   urgente) con `aria-labelledby` per essere riconoscibile da assistive tech.
//
// - `variant="section"`: sezione informativa SEMPRE consultabile in Settings
//   e nella tab Info & Privacy. Non dismissibile, niente call-to-action.
//
// Il contenuto testuale (`PRIVACY_NOTICE_*`, `PRIVACY_ACK_LABEL`) è esportato
// per i test e per garantire stabilità delle stringhe (assertion verbatim).
// Citazioni delle fonti (R.2 zero invenzione) — invarianti ADR-002 §Conseguenze
// e US-033 §Business Rules: nessun dato lascia il dispositivo, nessun invio a
// server esterni, nessun account, nessun tracking/analytics/telemetria.

import type { ReactElement } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
   * Il componente è UI-only: la persistenza dell'ack è di competenza del
   * chiamante (App.tsx via `usePrivacyAck`).
   */
  onAcknowledge?: () => void;
  /** Classi aggiuntive opzionali. */
  className?: string;
  /**
   * Quando `true`, sopprime l'intestazione interna (CardHeader o AlertTitle).
   * Usato da Settings quando il `<summary>` del `<details>` accordion già
   * fornisce il titolo "Privacy" — evita il doppio header.
   */
  headingHidden?: boolean;
}

/** Lista dei punti privacy (markup condiviso fra banner e sezione). */
function PointList(): ReactElement {
  return (
    <ul
      className="space-y-2 text-sm text-muted-foreground"
      aria-label="Punti informativa privacy"
    >
      {PRIVACY_NOTICE_POINTS.map((p) => (
        <li key={p} className="flex items-start gap-2">
          <i className="ti ti-shield-check mt-0.5 shrink-0" aria-hidden="true" />
          <span>{p}</span>
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
  // banner + sezione possono coesistere nella stessa pagina senza id duplicati.
  const headingId = `sb-privacy-heading-${variant}`;

  if (variant === "section") {
    // Sezione informativa: Card con header opzionale + contenuto.
    return (
      <Card
        className={className}
        aria-labelledby={headingHidden ? undefined : headingId}
        data-testid="sb-privacy-section"
      >
        {!headingHidden && (
          <CardHeader>
            {/* h2 semantico esplicito: CardTitle in shadcn è un <div>,
                ma qui il livello di heading conta (screen reader outline). */}
            <h2
              id={headingId}
              className="font-semibold leading-none tracking-tight"
            >
              {HEADING}
            </h2>
          </CardHeader>
        )}
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <PointList />
          <p className="text-xs" role="note">
            <i className="ti ti-info-circle" aria-hidden="true" /> Questa app è
            progettata per funzionare interamente sul tuo dispositivo (vedi
            ADR-002 §Conseguenze). Nessuna parte dei tuoi dati di gioco viene
            condivisa con noi o con terze parti.
          </p>
        </CardContent>
      </Card>
    );
  }

  // variant === "banner"
  // Alert con role="region" override: l'informativa è statica, non un
  // annuncio urgente (che sarebbe role="alert", il default di shadcn Alert).
  return (
    <Alert
      role="region"
      aria-labelledby={headingHidden ? undefined : headingId}
      data-testid="sb-privacy-banner"
      className={cn(
        // z-index: fallback numerico (50) se il token `--sd-z-toast` non è
        // ancora definito nel theme solids — l'overlay resta sopra il layout.
        "fixed bottom-0 inset-x-0 z-[var(--sd-z-toast,50)] rounded-none border-t",
        className,
      )}
    >
      {!headingHidden && (
        <AlertTitle id={headingId}>{HEADING}</AlertTitle>
      )}
      <AlertDescription className="space-y-3">
        <PointList />
        <Button
          type="button"
          size="sm"
          onClick={() => onAcknowledge?.()}
          aria-label={PRIVACY_ACK_LABEL}
        >
          {PRIVACY_ACK_LABEL}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
