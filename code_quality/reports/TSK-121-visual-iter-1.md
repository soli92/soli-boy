# TSK-121 — Visual Oracle Report (iter 1)

**Verdict:** `pass` · **next_action:** `done` · **visual_status:** `pass`

## Scope

TSK FE che aggiunge `"l"` e `"r"` all'array `BUTTONS` in
`packages/app/src/components/Settings/Settings.tsx`, abilitando la rimappatura UI
dei pulsanti shoulder GBA dopo che TSK-120 ha introdotto i default in
`DEFAULT_KEY_PROFILE` (q=l, w=r) e `DEFAULT_GAMEPAD_MAP` (4=l, 5=r).

## Configurazione

| Parametro | Valore |
|---|---|
| `fe_correctness.enabled` | `true` |
| `max_iterations` | `3` |
| Viewports | `mobile (375)`, `desktop (1280)` |
| Themes | `light=90s-party`, `dark` (helper `setThemeViaDB`, TSK-073) |
| Structured checks (`fe_correctness.checks`) | `[]` (skip — solo Critica) |

## Strutturali (asserzioni Playwright)

| Asserzione | Esito |
|---|---|
| `<select aria-label="Pulsante per ArrowUp">` contiene `[up, down, left, right, l, b, a, r, start, select]` nell'ordine esatto | ✅ pass |
| `<select aria-label="Pulsante per q">` ha `value="l"` (consistente con TSK-120) | ✅ pass |
| `<select aria-label="Pulsante per w">` ha `value="r"` (consistente con TSK-120) | ✅ pass |

## Critica visiva (Fase 4)

| Cella | Screenshot | Osservazione |
|---|---|---|
| mobile × light | `TSK-121-visual-iter-1/mobile-light.png` | 10 righe visibili (4 arrows + z + x + Enter + Shift + q + w); layout coerente con righe pre-esistenti, nessun overflow a 375px. |
| mobile × dark  | `TSK-121-visual-iter-1/mobile-dark.png`  | Idem, tema dark applicato correttamente (data-theme=dark verificato dal helper fail-loud). |
| desktop × light | `TSK-121-visual-iter-1/desktop-light.png` | Layout wide, select allineate a destra, identico al baseline pre-TSK con +2 righe in coda. |
| desktop × dark  | `TSK-121-visual-iter-1/desktop-dark.png`  | Idem, tema dark. |

**Findings:** nessuno. Le righe `q→l` / `w→r` riusano lo stesso template `.sb-row > .sb-key + select.sb-sel` delle 8 righe pre-esistenti; nessuna regressione di padding/allineamento/tipografia. Il `<select>` opzioni nascoste (closed state) non è ispezionato visivamente perché lo screenshot è dell'accordion espanso, ma è coperto dall'asserzione strutturale sul DOM (`allTextContents`).

## Verdetto

`pass` → `visual_status: pass` scritto nel frontmatter di TSK-121.
Loop terminato a iter-1 (max_iterations: 3, budget rispettato).
Pipeline procede a Fase 5 — handoff finale + commit.

## Note

Il runner (`packages/app/e2e/tsk-121-visual-oracle.e2e.ts`) è una spec one-shot
prodotta per la Fase 4-bis di questo TSK; rimossa post-run (non è un e2e di
regressione permanente). Gli screenshot restano in `code_quality/reports/`
(gitignored via `code_quality/reports/*-visual-iter-*/`).
