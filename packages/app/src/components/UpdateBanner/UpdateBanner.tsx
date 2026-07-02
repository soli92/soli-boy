// TSK-057 (US-025) — Banner in-app per il ciclo di auto-update Electron.
// TSK-152 (US-098, EP-020) — Migrazione da classi solids (`sd-card`/`sb-sec`)
// a primitiva shadcn/ui Alert. Il guard web (`window.soliboyDesktop`) e i
// contratti di accessibilità (`role="status"`, `aria-live="polite"`) restano
// invarianti.
//
// Mostra all'utente lo stato del processo di aggiornamento:
//   1. "Aggiornamento disponibile" → download in corso con barra di avanzamento
//   2. "Pronto per l'installazione" → pulsante "Riavvia per aggiornare"
//   3. Errore → messaggio
//
// Guard web: su runtime web/mobile (nessun bridge `window.soliboyDesktop`) il
// componente è no-op (`null`). La presenza di `quitAndInstall` è la sentinella
// del runtime desktop (l'hook la espone solo se il bridge è presente).
//
// Accessibilità: l'elemento radice ha `role="status"` + `aria-live="polite"`
// per annunciare i cambi di fase senza interrompere l'utente (WCAG 2.2 AA
// SC 4.1.3, ADR-002 §a11y). Override esplicito del `role="alert"` di default
// di shadcn Alert (non vogliamo un annuncio assertivo su ogni transizione).

import { useState, type ReactElement } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUpdater } from "./useUpdater";

/**
 * Testo UI esportato per i test (assertion leggibili senza accoppiare la stringa
 * al markup interno).
 */
export const UPDATE_LABELS = {
  available: "Aggiornamento disponibile",
  downloading: "Download in corso…",
  downloaded: "Aggiornamento pronto",
  restartCta: "Riavvia per aggiornare",
  laterCta: "Più tardi",
  error: "Errore di aggiornamento",
  dismiss: "Chiudi",
} as const;

/**
 * Banner che si iscrive agli eventi di auto-update tramite `useUpdater`.
 * Su web è no-op (nessun bridge → `null`).
 */
export function UpdateBanner(): ReactElement | null {
  const { phase, progress, errorMessage, quitAndInstall } = useUpdater();
  // Dismiss locale (solo dopo download): consente all'utente di posticipare il
  // riavvio senza perdere l'invito. Il banner ricomparirebbe alla prossima
  // sessione (l'hook non persiste il dismiss — comportamento invariato).
  const [dismissed, setDismissed] = useState(false);

  // Guard: su web il bridge non esiste → nessun DOM.
  if (!quitAndInstall) return null;

  // Fasi silenziose: nessun banner.
  if (phase === "idle" || phase === "not-available" || phase === "checking") {
    return null;
  }

  // Dismiss utente in fase downloaded: nascondi il banner senza persistere.
  if (dismissed && phase === "downloaded") return null;

  return (
    <Alert
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="sb-update-banner"
      // z-index: fallback numerico (50) se il token `--sd-z-toast` non è
      // ancora definito nel theme solids — l'overlay resta sopra il layout.
      className="fixed top-0 inset-x-0 z-[var(--sd-z-toast,50)] rounded-none border-b"
    >
      {(phase === "available" || phase === "progress") && (
        <>
          <AlertTitle>
            <i className="ti ti-refresh" aria-hidden="true" />{" "}
            {phase === "available" ? UPDATE_LABELS.available : UPDATE_LABELS.downloading}
          </AlertTitle>
          {phase === "progress" && progress !== undefined && (
            <AlertDescription>
              <div
                className="flex items-center gap-2"
                aria-label={`Download ${Math.round(progress.percent)}%`}
              >
                <progress
                  value={Math.round(progress.percent)}
                  max={100}
                  aria-valuenow={Math.round(progress.percent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{ width: "100%" }}
                />
                <span className="text-xs text-muted-foreground" aria-hidden="true">
                  {Math.round(progress.percent)}%
                </span>
              </div>
            </AlertDescription>
          )}
        </>
      )}

      {phase === "downloaded" && (
        <>
          <AlertTitle>
            <i className="ti ti-circle-check" aria-hidden="true" />{" "}
            {UPDATE_LABELS.downloaded}
          </AlertTitle>
          <AlertDescription>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                onClick={quitAndInstall}
                aria-label={UPDATE_LABELS.restartCta}
                data-testid="sb-update-restart-btn"
              >
                {UPDATE_LABELS.restartCta}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDismissed(true)}
                aria-label={UPDATE_LABELS.laterCta}
              >
                {UPDATE_LABELS.laterCta}
              </Button>
            </div>
          </AlertDescription>
        </>
      )}

      {phase === "error" && (
        <AlertDescription role="alert">
          <i className="ti ti-alert-circle" aria-hidden="true" />{" "}
          {UPDATE_LABELS.error}
          {errorMessage ? `: ${errorMessage}` : ""}
        </AlertDescription>
      )}
    </Alert>
  );
}
