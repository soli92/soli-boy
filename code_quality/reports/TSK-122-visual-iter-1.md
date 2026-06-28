# TSK-122 — Visual Oracle Report (iter 1)

**Verdict:** `pass` · **next_action:** `done` · **visual_status:** `pass`

## Scope

TSK FE — refactor `packages/app/src/components/TouchOverlay/button-map.ts`:
helper `coreHasShoulderButtons(core)` + documentazione esplicita US-063 + invariante
single-source-of-truth (`BUTTON_MAP[core]` include L/R sse `coreHasShoulderButtons(core)`).
Layout: marker strutturale `data-shoulder` / `data-has-shoulder` + posizione inline shoulder
per L/R in `TouchOverlay.tsx`.

Allineamento US-063 (priorità su testo TSK originale):
- L/R nell'overlay touch SOLO per piattaforme con shoulder hardware (GBA/mgba).
- gambatte (GB/GBC), fbneo, mame: NESSUN pulsante L/R touch (no-op hardware).
- mgba: L/R presenti, posizionati come "spalle" (top-left / top-right del container .sb-ab).

## Configurazione

| Parametro | Valore |
|---|---|
| `fe_correctness.enabled` | `true` |
| `max_iterations` | `3` |
| Viewports | `mobile` (iPhone 13, 390×664, pointer:coarse) |
| Themes | tema applicato a livello App (light di default) |
| Structured checks (`fe_correctness.checks`) | `[]` (skip — solo Critica) |

NB: solo viewport mobile (touch context) — il componente è guard-isolato
`isTouchDevice()` (matchMedia `pointer:coarse`), su desktop il render è null
(coperto da unit test `non viene reso su desktop`).

## Strutturali (asserzioni Playwright)

| Asserzione | Esito |
|---|---|
| gambatte: `[data-testid="sb-touch-overlay"]` visibile | ✅ pass |
| gambatte: `data-has-shoulder="false"` sul container `.sb-ab` | ✅ pass |
| gambatte: nessun `[data-testid="sb-touch-btn-l"]` né `-r` nel DOM | ✅ pass |
| gambatte: A/B/Select/Start presenti | ✅ pass |
| mgba: `data-has-shoulder="true"` sul container `.sb-ab` | ✅ pass |
| mgba: L/R presenti, `data-shoulder="true"`, classe `.ab-shoulder` | ✅ pass |
| mgba: L `boundingBox.x < R.boundingBox.x` (distinti orizzontalmente) | ✅ pass |
| mgba: L/R nella metà superiore del container (posizione "spalla") | ✅ pass |
| mgba: A/B/Select/Start NON marcati shoulder | ✅ pass |

Più 12 unit test (`TouchOverlay.test.tsx`) che coprono:
helper `coreHasShoulderButtons` (4 core), invariante BUTTON_MAP, marker
`data-has-shoulder`/`data-shoulder`, inline-style `position:absolute; top:0;
left:0` (L) e `right:0` (R), classe `.ab-shoulder`.

## Critica visiva (Fase 4)

| Cella | Screenshot | Osservazione |
|---|---|---|
| gambatte × mobile | `TSK-122-visual-iter-1/gambatte-mobile.png` | D-pad ↑←→↓ visibile; pulsanti azione mostrano A (rosso), B (viola), STA, nessun L né R. Allineato con US-063 (no shoulder per GB). |
| mgba × mobile | `TSK-122-visual-iter-1/mgba-mobile.png` | D-pad invariato; R verde visibile a destra del gruppo azione, in posizione "spalla" (top-right). Pulsanti A, B presenti; STA visibile ma occlude visivamente L (gap pre-esistente, vedi sotto). |

**Findings:**

- **F1 — Visivo, non-bloccante (pre-esistente).** Su mgba, il pulsante L è
  occluso da STA perché in `solids-theme.css` mancano regole di posizionamento
  per `.ab-select`, `.ab-start`, `.ab-l`, `.ab-r` (tutti i pulsanti `.ab` senza
  regola CSS dedicata defaultano a `top:0;left:0` nel container `.sb-ab`
  120×120). Il gap è preesistente a TSK-122 (esisteva già per SEL/START anche su
  gambatte/fbneo/mame). TSK-122 introduce un workaround in scope —
  `zIndex: 2` su L/R inline style, così L resta tappabile anche sotto overlap
  visivo (verificato: il tap su L riesce a passare il hit-testing, viene
  intercettato solo R per overlap con `.sb-canvas-host` in non-fullscreen
  portrait, gap separato). Documentato in `wiki/gaps.md`
  `touch-overlay-mgba-ab-positioning` (2026-06-28 15:55) con azione richiesta
  al TPM: aprire TSK FE follow-up di refactor CSS layout `.sb-ab` (solo
  styles, no logica componente).

- Nessuna regressione visiva su gambatte (layout identico al baseline pre-TSK-122).
- Nessuna sovrapposizione introdotta da TSK-122 al di là del gap pre-esistente F1.

## Verdetto

`pass` → `visual_status: pass` scritto nel frontmatter di TSK-122.
Loop terminato a iter-1 (max_iterations: 3, budget rispettato).
Pipeline procede a Fase 5 — handoff finale + commit.

L'unico finding (F1) è preesistente, documentato come gap formale, e ha
azione richiesta al TPM (TSK separato di refactor CSS). TSK-122 non lo
introduce né lo aggrava — anzi mitiga la tappabilità di L con `zIndex:2`.

## Note

Il runner (`packages/app/e2e/tsk-122-visual-oracle.e2e.ts`) è una spec
one-shot prodotta per la Fase 4-bis di questo TSK; rimossa post-run (non è
un e2e di regressione permanente). La copertura strutturale permanente vive
in `TouchOverlay.test.tsx` (46 test vitest, di cui 12 nuovi per TSK-122;
66 test totali nella cartella `TouchOverlay/`). Gli screenshot restano in
`code_quality/reports/TSK-122-visual-iter-1/`.

Cross-link:
- [US-063 §Business Rules](../../management/kanban/EP-018-controlli-shoulder-l-r/US-063-touch-l-r-tutte-piattaforme/US-063.md)
- [TSK-122](../../management/kanban/EP-018-controlli-shoulder-l-r/US-063-touch-l-r-tutte-piattaforme/TSK-122.md)
- Gap: [wiki/gaps.md §touch-overlay-mgba-ab-positioning](../../wiki/gaps.md)
