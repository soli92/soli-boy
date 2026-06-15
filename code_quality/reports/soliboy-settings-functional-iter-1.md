# Functional Oracle — soliboy-settings iter 1

**Verdict**: `pass` | **Timestamp**: 2026-06-15T00:00:00Z

## Scenario eseguito

Flusso: apri tab Impostazioni → verifica sezione Settings visibile →
verifica accordion "Controlli — rimappatura" aperto di default → verifica lista keymap →
verifica button "Salva profilo" presente

## Assertion Results

| id | kind | severity | outcome | detail |
|---|---|---|---|---|
| settings-section-visible | selector_visible | blocking | pass | section[aria-label='Impostazioni controlli'] visibile |
| controls-accordion-visible | selector_visible | blocking | pass | details[open] summary.sb-lbl — "Controlli — rimappatura" aperto di default |
| keymap-list-visible | selector_visible | blocking | pass | ul.sb-keymap presente con mappatura tasti |
| save-profile-button-visible | selector_visible | blocking | pass | button "Salva profilo" visibile |
| no-console-error | console_no_error | advisory | pass | 0 errori console |
| no-5xx | network_no_5xx | advisory | pass | 0 risposte 5xx |

Blocking: 4/4 pass | Advisory: 2/2 pass (fallite 0, soglia 2)

## Note comportamento osservato

- Settings.tsx renderizza `<section aria-label="Impostazioni controlli">` come root
- Il primo accordion (`details[open]`) è aperto di default: `Controlli — rimappatura`
- Il componente non richiede ROM caricata — accessibile in stato idle app
- La sezione `Aspetto — tema UI` (accordion 3) è presente ma chiusa: richiede `theme` + `onThemeChange` props (cablate da App.tsx via `useTheme`)

## Critic Findings (advisory)

Nessun finding ammissibile.

## Trace

Artefatti in: `code_quality/reports/soliboy-settings-functional-iter-1/`
Screenshot: step-00-initial.png, step-01-settings-tab.png, step-02-final.png
Console log: `console.log.json` | Network log: `network.log.json`

## Loop status

Iterazione 1 / 3. Next action: `done`.
