# Functional Oracle — soliboy-player-controls iter 1

**Verdict**: `pass` | **Timestamp**: 2026-06-15T00:00:00Z

## Scenario eseguito

Flusso: carica ROM (gba-tests-thumb.gba) → naviga Libreria → click GameTile → Avvia → canvas visibile →
Pausa → [check: Riprendi visibile, Pausa assente] → Riprendi → [check: Pausa visibile, Riprendi assente] → Arresta → [check: stato idle]

## Assertion Results

| id | kind | severity | outcome | detail |
|---|---|---|---|---|
| player-idle-after-stop | selector_visible | blocking | pass | button Avvia visibile dopo Arresta — idle confermato |
| pausa-absent-after-stop | selector_absent | blocking | pass | button Pausa assente dopo Arresta |
| riprendi-absent-after-stop | selector_absent | blocking | pass | button Riprendi assente dopo Arresta |
| arresta-absent-after-stop | selector_absent | blocking | pass | button Arresta assente dopo stop |
| no-console-error | console_no_error | advisory | pass | 0 errori console (5 warning WebGL/ScriptProcessorNode — non fatali) |

Blocking: 4/4 pass | Advisory: 1/1 pass (fallite 0, soglia 1)

## Check intermedi (evidenza trace)

| Momento | Riprendi visibile | Pausa assente |
|---|---|---|
| Dopo click Pausa | true | true |
| Dopo click Riprendi | n/a | Pausa torna visibile: true; Riprendi sparisce: true |

## Critic Findings (advisory)

Nessun finding ammissibile. Nessun errore console. Flusso completato senza anomalie.

## Trace

Artefatti in: `code_quality/reports/soliboy-player-controls-functional-iter-1/`
Screenshot: step-00-initial.png, step-01-rom-loaded.png, step-02-library.png, step-03-game-selected.png,
step-04-avvia-clicked.png, step-05-canvas-visible.png, step-06-pausa.png, step-07-riprendi.png,
step-08-arresta.png, step-09-final-idle.png
Console log: `console.log.json` | Network log: `network.log.json`

## Loop status

Iterazione 1 / 3. Next action: `done`.
