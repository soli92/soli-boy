# Visual Oracle — TSK-105 (iter 1)

- **TSK**: TSK-105 — Aspect-ratio CSS invariante su `.sb-screen` (canvas idle no-jump)
- **Epic / Story**: EP-015 / US-055
- **Data**: 2026-06-15
- **Protocollo**: visual-oracle-protocol v2.17 (skill `visual-oracle-protocol`)
- **Verdict**: **pass**
- **Defects**: 0 major / 0 minor / 0 trivial
- **Iter**: 1 / 3

## Sintesi

TSK-105 risolve completamente UX-021: il container `.sb-screen` in stato idle (nessuna
ROM caricata) **non collassa più** all'altezza minima ~24px. L'`aspect-ratio: 3 / 2`
applicato via CSS custom property `--sb-canvas-aspect` nel CSS scoped iniettato da
`Player.tsx` mantiene il container a 320×213.3px in tutti e quattro le combinazioni
viewport × schema colore.

La rimozione di `style.aspectRatio = "auto"` da `useVideoSettings.ts` per
`aspect=stretch` lascia che il fallback CSS faccia il suo lavoro: l'aspect-ratio
resta invariante (l'inline `style="aspect-ratio: 3 / 2;"` osservato nell'HTML è
generato a partire dalla custom property nel CSS scoped, non da hardcode JS).

## Misurazioni `.sb-screen` (stato idle)

| Viewport          | Color scheme | Width (px) | Height (px) | aspect-ratio computed | Position | Stato |
|-------------------|--------------|------------|-------------|-----------------------|----------|-------|
| mobile-375        | light        | 320.0      | 213.33      | `3 / 2`               | relative | idle  |
| mobile-375        | dark         | 320.0      | 213.33      | `3 / 2`               | relative | idle  |
| desktop-1280      | light        | 320.0      | 213.33      | `3 / 2`               | relative | idle  |
| desktop-1280      | dark         | 320.0      | 213.33      | `3 / 2`               | relative | idle  |

Threshold criterio primario: **height > 100px** → osservato **213.33px** (2.13× threshold).
Threshold criterio secondario: **aspect ~3:2 (1.5)** → osservato **1.5001** (perfetto).

`data-state="idle"` confermato nell'`outerHTML`; testo "Premi Avvia" presente; nessuna
ROM caricata. `data-aspect="original"` (default).

## Screenshot

| Viewport     | Light                                            | Dark                                            |
|--------------|--------------------------------------------------|-------------------------------------------------|
| mobile-375   | `TSK-105-visual-iter-1/mobile-375-light.png`     | `TSK-105-visual-iter-1/mobile-375-dark.png`     |
| desktop-1280 | `TSK-105-visual-iter-1/desktop-1280-light.png`   | `TSK-105-visual-iter-1/desktop-1280-dark.png`   |

Note: i 4 PNG mostrano il container `.sb-screen` chiaramente visibile con proporzioni
3:2 sotto i tab "Play / Libreria / Impostazioni / Info & Privacy". Su mobile-375 il
container occupa l'intera larghezza disponibile (320px effettivi su viewport 375).
Su desktop-1280 il container mantiene 320×213px (inline `width: 320px` applicato da
Player, comportamento preesistente).

## Critica visiva (3 criteri)

### Criterio primario — `.sb-screen` non collassato

- **Soglia**: height > 100px in stato idle.
- **Misurato**: 213.33px su tutti i viewport e schemi colore.
- **Esito**: **pass**.
- **Confronto bug iniziale**: il bug UX-021 riportava altezza ~24px in idle.
  Risolto di un fattore ~9× rispetto alla baseline rotta.

### Criterio secondario — proporzione ~3:2

- **Soglia**: rapporto larghezza/altezza ~1.5 (tolleranza ±0.05).
- **Misurato**: 320 / 213.328125 = **1.5001** (precisione macchina contro 3/2 esatto).
- **CSS computed `aspect-ratio`**: `3 / 2` (custom property `--sb-canvas-aspect`
  applicata correttamente).
- **Esito**: **pass**.

### Criterio terziario — nessuna regressione TSK-103 (HUD/testi)

- **Mobile-375**: testo "Premi Avvia" centrato visibilmente nel container. Tab
  navigation ("Play / Libreria / Impostazioni / Info & Privacy") leggibile e attiva
  (Play selezionato con underline magenta del tema).
- **Desktop-1280**: HUD inferiore "Nessun gioco selezionato" (sinistra) e "Premi Avvia"
  (destra) entrambi visibili sotto il canvas. Logo Soli-boy in alto, banner privacy
  intatto. Nessun overflow o shift di layout.
- **Esito**: **pass**.

## Critic findings

Nessuno. Zero finding di severità major/minor/trivial attribuibili a TSK-105.

## Osservazioni non bloccanti (fuori scope TSK-105)

1. **Inline `width: 320px` su desktop**. Su viewport 1280px il container resta a 320px
   lasciando whitespace orizzontale. È comportamento preesistente del Player (non
   introdotto da TSK-105), eventualmente discutibile in un TSK separato di layout
   responsive del Player frame.
2. **Color-scheme system preference ignorata**. L'app forza
   `data-theme="90s-party"` indipendentemente da `prefers-color-scheme: light|dark`.
   Per questo i quattro screenshot mostrano lo stesso tema scuro. Fuori scope
   TSK-105 (è scelta del theme system di soli-boy).

## Console errors

Nessuno (catturati via `pageerror` + `console.error` su ciascuna pagina; array vuoto
in tutti e 4 i run).

## Conclusione

**Verdict: pass.** TSK-105 chiude correttamente UX-021. Il TSK può transitare a
`status: done` e procedere a Fase 5 del `dev-protocol`. Nessun loop necessario.
