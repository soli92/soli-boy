---
report_id: soliboy-functional-iter-1
type: functional_oracle
target: http://127.0.0.1:4317/ (build dist servita via vite preview)
acceptance_spec: code_quality/acceptance/soliboy.acceptance.yaml
fixture: packages/app/public/test-roms/gba-tests-thumb.gba (test ROM mGBA, freely distributable)
agent: functional-oracle (pipeline EP-018, esecuzione reale)
timestamp: 2026-06-09 16:54
verdict: reject
iterations: 1
evidence_dir: soliboy-functional-iter-1/
---

# Functional Oracle — soli-boy: carica ROM → avvia → **l'emulazione NON parte**

> **Prima esecuzione funzionale reale di soli-boy.** Esercita il flusso core con una ROM di test reale
> (non uno screenshot statico). È ciò che né la review visiva (EP-008) né l'a11y (EP-007) né uno
> screenshot idle potevano rivelare: l'app **renderizza** ma **non funziona**.

## Esito: **reject** — 2/3 asserzioni blocking FALLITE

| Asserzione | kind | Esito | Evidenza |
|---|---|---|---|
| `canvas-advancing` | canvas_pixel_variance | **FAIL** | digest canvas identico per 8 frame (distinct=2: solo blank→primo frame, poi **congelato**) |
| `state-running` | text_matches "In esecuzione" | **FAIL** | `.sb-screen` mostra "gba-tests-thumb" (titolo), mai "In esecuzione" |
| `no-console-error` | console_no_error | pass | 0 errori console |

Verdict **reject** (qualsiasi blocking fail → reject, ADR-065 §D).

## Flusso eseguito (tutti gli step UI riescono)

`privacy dismissed → ROM caricata in libreria → voce libreria cliccata → Player montato → "Avvia"
cliccato → canvas visibile`. **Nessuno step UI fallisce** — il problema è a valle: dopo `Avvia`,
il canvas resta su un frame statico e lo stato non diventa `running`.

Digest canvas (8 campionamenti @300ms): `1983932487:2118` → poi `970685579:1942` ripetuto identico ×7.
Lo screenshot `player-after-avvia.png` mostra il viewport del Player **nero/vuoto**: nessun frame di gioco.

## Diagnosi root cause (responsabile, NON fabbricata)

- **Esclusa l'ipotesi serving/cross-origin isolation**: gli header COOP/COEP sono corretti
  (`Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`,
  `vite.config.ts` server+preview), e in pagina `crossOriginIsolated: true` + `SharedArrayBuffer: true`.
  Il WASM threaded **ha** l'ambiente che gli serve. Il freeze NON è un problema di header.
- **Causa quindi app-level**: dopo `wrapper.start()` il run-loop dell'emulatore non avanza i frame
  e lo stato non transita a `running` in questo contesto. **Cause candidate** (da verificare in
  debug app, NON asserite come certe — l'oracolo rileva, non ripara):
  1. il loop di emulazione (rAF/step del core mGBA/WasmBoy) non parte o si ferma subito dopo `start()`;
  2. possibile sensibilità all'esecuzione **headless/automatizzata** (gesture utente per audio context,
     WebGL/swiftshader, throttling rAF) — da confermare con una run headed prima di concludere «bug puro».

Entrambe le piste sono **azionabili**; nessuna è dichiarata come verità senza prova (disciplina
evidence-provenance, stessa che ha fatto scartare il finding "label corrotte" nella review visiva).

## Significato (perché questo chiude il cerchio)

Questo è il difetto esatto che avevi notato («funzionalmente non usabile») e che **nessuna capability
precedente poteva vedere**: lo screenshot idle «renderizza ✓», axe dà 1 solo minor, 0 errori console —
eppure **il gioco non parte**. Solo esercitando il flusso reale (carica → avvia → osserva i frame) il
difetto emerge. Verdict riproducibile.

## Prossimo passo

Handoff a un dev-agent FE (loop bounded, ADR-067 §C): debug del run-loop post-`start()` +
una run headed di controllo per isolare app-bug vs sensibilità-headless. Poi re-run
`/functional-oracle soliboy` per verificare il fix.
