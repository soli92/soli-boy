# Soli-boy — Brand kit

Logo e icona di **Soli-boy**, l'emulatore multipiattaforma per arcade e console handheld. Identità agganciata al brand Soli, concept pixel-art / 8-bit, mood retro neon cyberpunk.

## Concept

Una lettera **S** in pixel art che sfuma dal **magenta** (brand Soli) al **cyan**, racchiusa in una silhouette che richiama una console handheld, con due tasti A/B (cyan e giallo). Funziona come lettermark orizzontale e come icona quadrata, e resta leggibile fino a 16 px.

## Palette (tema cyberpunk SoliDS)

| Ruolo | Hex |
|------|-----|
| Magenta primario | `#ff2bd6` |
| Magenta chiaro | `#ff5be4` |
| Cyan accento | `#00e5ff` |
| Giallo accento | `#faff00` |
| Fondo scuro | `#140b22` |
| Fondo schermo | `#0a0612` |
| Bordo viola | `#5a35a0` |
| Testo chiaro | `#f0e9ff` |

> Nota: i colori derivano dalla palette cyberpunk del design system SoliDS come ponte verso il brand Soli. Non sono stati verificati sui brand asset ufficiali (`soli-icons` nel pacchetto npm). Allineare le tonalità esatte quando disponibili.

## File

```
soliboy-brand/
├── README.md
├── svg/
│   ├── soliboy-logo-horizontal.svg   # lettermark + wordmark + tagline
│   ├── soliboy-logo-mono.svg         # variante monocromatica (currentColor)
│   ├── soliboy-icon.svg              # icona app quadrata 512
│   └── soliboy-favicon.svg           # versione semplificata 64
└── png/
    ├── icon-16/32/48/64/128/180/192/256/512/1024.png
    ├── favicon-32/64.png
    └── logo-horizontal-680/1360.png
```

### Dimensioni utili
- **Web favicon**: `favicon-32.png`, `favicon-64.png` (+ `soliboy-favicon.svg`)
- **PWA / web manifest**: `icon-192.png`, `icon-512.png`
- **iOS app icon**: `icon-180.png` (e `icon-1024.png` per App Store)
- **Android**: `icon-192.png`, `icon-512.png`
- **Logo in-app / sito**: `soliboy-logo-horizontal.svg` (preferire l'SVG; PNG come fallback)

## Uso della variante monocromatica

`soliboy-logo-mono.svg` usa `currentColor`: eredita il colore del testo del contenitore. Utile su sfondi chiari, stampe, watermark, o dove serve un logo sobrio. Imposta il colore via CSS, es. `color: #f0e9ff` su fondo scuro o `color: #140b22` su fondo chiaro.

## Note tecniche
- Gli SVG usano `shape-rendering="crispEdges"` sui pixel per bordi netti.
- I PNG fino a 128 px sono ridimensionati con nearest-neighbor per preservare l'estetica pixel; le taglie maggiori con Lanczos.
- I font del wordmark (DM Sans, JetBrains Mono) sono quelli di SoliDS: per il rendering del PNG sono stati usati i fallback di sistema; per output definitivi rasterizzare con i font reali installati.
