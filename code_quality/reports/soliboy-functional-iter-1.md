# Functional Oracle — soliboy iter 1

**Verdict**: `pass` | **Timestamp**: 2026-06-15T00:00:00Z

## Scenario Trace

| step | action | status | duration_ms | detail |
|---|---|---|---|---|
| 0 | goto | ok | — | http://127.0.0.1:4173/ |
| 1 | click:Ho-capito | ok | 64ms | privacy notice dismissed |
| 2 | set_input_files | ok | 1511ms | gba-tests-thumb.gba loaded via input[aria-label="Carica ROM"] |
| 2.5 | click:tab-Libreria | ok | 519ms | navigate to Library tab |
| 3 | click:gba-tests-thumb | ok | 515ms | ROM selected from Library, app auto-navigates to Play tab |
| 4 | click:Avvia | ok | 15ms | engine start triggered |
| 5 | wait_for:canvas | ok | 4ms | [data-testid="sb-canvas-host"] canvas visible |
| 6 | wait_ms:1500 | ok | 1501ms | settling wait |

## Assertion Results

| id | kind | severity | outcome | detail |
|---|---|---|---|---|
| engine-running | selector_visible | blocking | **pass** | button:has-text("Pausa") is visible — engine confirmed in running state |
| avvia-consumed | selector_absent | blocking | **pass** | button:has-text("Avvia") absent — consumed by state transition to running |
| canvas-advancing | canvas_pixel_variance | advisory | **fail** | canvas pixel read failed: no-2d-ctx — COEP (require-corp) blocks canvas getImageData in headless Chromium. Advisory: spec note confirms test-ROM statica → variance~0 expected. |
| no-console-error | console_no_error | advisory | **pass** | no console errors. 5 warnings (WebGL ReadPixels GPU stall x4, ScriptProcessorNode deprecated x1). |

Blocking: 2/2 pass | Advisory: 1/2 pass (failed 1, soglia advisory_max: 2)

**Verdict: pass** — tutte le asserzioni blocking passano; advisory failures (1) entro soglia (2).

## Critic Findings (advisory)

1. **COEP blocks canvas_pixel_variance**: WebGL `canvas.getImageData` fails under `Cross-Origin-Embedder-Policy: require-corp` in headless Chromium. The assertion is structurally non-executable in this environment. Advisory fail is within threshold. Evidence: `soliboy-functional-iter-1/console.log.json` — 4x GL Driver Message GPU stall warnings confirm WebGL canvas active but pixel read blocked.

2. **ScriptProcessorNode deprecated**: Web Audio API warning. Engine uses `ScriptProcessorNode`; migration to `AudioWorkletNode` recommended but does not affect functional correctness. Evidence: `soliboy-functional-iter-1/console.log.json` — "The ScriptProcessorNode is deprecated. Use AudioWorkletNode instead."

## Network Summary

All requests: HTTP 200. No 5xx errors.

| url | status |
|---|---|
| http://127.0.0.1:4173/ | 200 |
| /assets/index-1y80-Fj9.js | 200 |
| /assets/index-Dovp0Zkl.css | 200 |
| /assets/mgba-BQ3wh8tg.js | 200 |
| /assets/mgba-BOLOBbvb.js | 200 (x5 — SharedArrayBuffer workers) |
| /assets/mgba-2tQpynw2.wasm | 200 |

## Trace

Artefatti in: `code_quality/reports/soliboy-functional-iter-1/`

Screenshots: step-00-goto.png, step-01-click.png, step-02-set_input_files.png, step-03-click.png, step-04-click.png, step-05-click.png, step-06-wait_for.png, step-07-final.png | Console log: `console.log.json` | Network log: `network.log.json`

## Loop status

Iterazione 1 / 3. Next action: `done` — verdict `pass`, pronto per code-review (ordering ADR-066 §B).
