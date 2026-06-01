---
type: entity
kind: asset
sources: ["raw/soliboy-brand/README.md"]
status: draft
created: 2026-06-01
updated: 2026-06-01
tags: [logo, asset, brand]
---

# Logo Soli-boy
> Lettermark/icona di Soli-boy in quattro varianti SVG + set PNG multi-dimensione.

## Varianti

Le varianti SVG sono: `soliboy-logo-horizontal.svg` (lettermark + wordmark + tagline), `soliboy-logo-mono.svg` (monocromatica `currentColor`), `soliboy-icon.svg` (icona app quadrata 512) e `soliboy-favicon.svg` (versione semplificata 64). [^src: raw/soliboy-brand/README.md §File]

## Variante monocromatica

`soliboy-logo-mono.svg` usa `currentColor` ed eredita il colore del testo del contenitore, utile su sfondi chiari, stampe o watermark; il colore si imposta via CSS (es. `color: #f0e9ff` su fondo scuro o `#140b22` su fondo chiaro). [^src: raw/soliboy-brand/README.md §Uso della variante monocromatica]

## Rendering e font

Gli SVG usano `shape-rendering="crispEdges"`; il wordmark usa i font di SoliDS (DM Sans, JetBrains Mono), con fallback di sistema nei PNG generati — per output definitivi rasterizzare con i font reali. [^src: raw/soliboy-brand/README.md §Note tecniche]

## Concetti correlati
[[brand-identita-soliboy]]

## Pagine collegate
[[2026-06-01-brand-kit]]
[[solids]]
