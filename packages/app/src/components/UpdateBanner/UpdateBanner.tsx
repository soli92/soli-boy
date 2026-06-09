// TSK-057 (US-025) — Banner in-app per il ciclo di auto-update Electron.
//
// Mostra all'utente lo stato del processo di aggiornamento:
//   1. "Aggiornamento disponibile" → download in corso con barra di avanzamento
//   2. "Pronto per l'installazione" → pulsante "Riavvia per aggiornare"
//   3. Errore → messaggio dismissibile
//
// Guard web: su runtime web/mobile (nessun bridge `window.soliboyDesktop`) il
// componente è no-op (restituisce `null`) — nessun DOM renderizzato.
//
// Accessibilità: l'elemento radice usa `role="status"` con `aria-live="polite"`
// affinché i lettori di schermo annuncino il cambio di fase senza interrompere
// l'utente (WCAG 2.2 AA SC 4.1.3, ADR-002 §a11y). Non è `aria-hidden`.
//
// Stile: classi solids (`sd-card`, `sb-sec`, `sb-lbl`, `sb-btn`, `sb-note`,
// `sb-full`) coerenti con `PrivacyNotice` e `LegalNotice` (TSK-006, TSK-069).

import type { ReactElement } from "react";
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
  error: "Errore di aggiornamento",
  dismiss: "Chiudi",
} as const;

/**
 * Banner che si iscrive agli eventi di auto-update tramite `useUpdater`.
 * Su web è no-op (nessun bridge → `quitAndInstall` e `phase` non modificano
 * il DOM: il componente ritorna `null`).
 */
export function UpdateBanner(): ReactElement | null {
  const { phase, progress, errorMessage, quitAndInstall } = useUpdater();

  // Guard: su web il bridge non esiste → nessun DOM.
  // `quitAndInstall` è undefined SOLO su web; in desktop è sempre definito.
  // Usiamo la sua presenza come sentinella del runtime (evita un secondo sniff
  // di `window.soliboyDesktop` e centralizza la logica in `useUpdater`).
  if (!quitAndInstall) return null;

  // Fase idle o not-available: nessun banner (silenzioso).
  if (phase === "idle" || phase === "not-available" || phase === "checking") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sd-card sb-sec"
      data-testid="sb-update-banner"
    >
      {(phase === "available" || phase === "progress") && (
        <>
          <p className="sb-lbl">
            <i className="ti ti-refresh" aria-hidden="true" />{" "}
            {phase === "available" ? UPDATE_LABELS.available : UPDATE_LABELS.downloading}
          </p>
          {phase === "progress" && progress !== undefined && (
            <div className="sb-row" aria-label={`Download ${Math.round(progress.percent)}%`}>
              <progress
                value={Math.round(progress.percent)}
                max={100}
                aria-valuenow={Math.round(progress.percent)}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ width: "100%" }}
              />
              <span className="sb-note" aria-hidden="true">
                {Math.round(progress.percent)}%
              </span>
            </div>
          )}
        </>
      )}

      {phase === "downloaded" && (
        <>
          <p className="sb-lbl">
            <i className="ti ti-circle-check" aria-hidden="true" />{" "}
            {UPDATE_LABELS.downloaded}
          </p>
          <button
            type="button"
            className="sb-btn sb-btn-primary sb-full"
            onClick={quitAndInstall}
            aria-label={UPDATE_LABELS.restartCta}
            data-testid="sb-update-restart-btn"
          >
            {UPDATE_LABELS.restartCta}
          </button>
        </>
      )}

      {phase === "error" && (
        <p className="sb-note" role="alert">
          <i className="ti ti-alert-circle" aria-hidden="true" />{" "}
          {UPDATE_LABELS.error}
          {errorMessage ? `: ${errorMessage}` : ""}
        </p>
      )}
    </div>
  );
}
