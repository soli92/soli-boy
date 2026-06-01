# Soli-boy — Mockup UI (SoliDS)

Set di mockup statici dell'interfaccia di **Soli-boy**, l'emulatore multipiattaforma per arcade e console handheld (GB/GBC, GBA, arcade FBNeo/MAME). Pensati per essere ingeriti da una wiki/knowledge base LLM come riferimento visivo e strutturale dell'UI.

## Cosa contiene

18 schermate HTML standalone, una per ogni combinazione di:

- **Sezione** (3): `library` (Libreria), `player` (Player di gioco), `settings` (Impostazioni)
- **Tema** (2): `dark`, `cyberpunk` — entrambi temi del design system SoliDS
- **Dispositivo** (3): `mobile` (~390px), `tablet` (~768px), `desktop` (~1280px)

Naming dei file: `screens/<sezione>-<tema>-<dispositivo>.html`
Esempio: `screens/library-cyberpunk-desktop.html`

Ogni file ha in testa un commento e un `<meta name="description">` con i metadati in formato `chiave=valore` per il parsing automatico.

## Struttura

```
soliboy-mockups/
├── index.html                 # indice navigabile con anteprime di tutte le schermate
├── README.md                  # questo file
├── assets/
│   └── solids-theme.css       # token SoliDS (--sd-*) + classi sd-* e sb-*; definisce i temi dark e cyberpunk
└── screens/
    ├── library-dark-mobile.html
    ├── library-dark-tablet.html
    ├── library-dark-desktop.html
    ├── library-cyberpunk-mobile.html
    ├── ... (18 file totali)
    └── settings-cyberpunk-desktop.html
```

## Design system

Le schermate applicano **SoliDS** (`@soli92/solids`, https://github.com/soli92/solids), il design system token-based del progetto:

- Token semantici `--sd-color-*` (testo, background, border, intent, primary), `--sd-space-*`, `--sd-radius-*`, `--sd-font-*` (Inter / DM Sans / JetBrains Mono).
- Classi utility `sd-*` (es. `sd-card`, `sd-badge`, `sd-flex`).
- Target touch minimo 44px (`--sd-layout-touch-target-min`) per accessibilità (WCAG 2.5.8 / Apple HIG).
- Temi globali via attributo `data-theme` su `<html>` (`dark`, `cyberpunk`).

### IMPORTANTE per il progetto reale

I valori esadecimali dei temi in `assets/solids-theme.css` sono un'**approssimazione** ad uso esclusivo di questi mockup statici: nel sandbox di generazione non è possibile importare il CSS reale del pacchetto npm. Nell'app reale si deve invece:

1. `npm install @soli92/solids`
2. importare `@import "@soli92/solids/css/index.css";`
3. selezionare il tema con `<html data-theme="dark">` o `data-theme="cyberpunk"`
4. eliminare i blocchi `:root` / `[data-theme]` di colore in `solids-theme.css`.

La **struttura** (nomi di token, classi, gerarchia DOM) è invece fedele e riutilizzabile.

I componenti reali in SoliDS seguono il modello shadcn/ui (`npx shadcn@latest add @solids/solids-ui`); qui sono replicati in HTML+classi a scopo illustrativo, non come componenti React effettivi.

## Note di adattamento per dispositivo

- **Library**: griglia giochi a 2 colonne (mobile), 3 (tablet), 5 (desktop); numero di giochi mostrati crescente.
- **Player**: layout verticale con controlli touch su mobile e tablet; su desktop layout orizzontale 16:10 con pannello laterale di save state e indicazione input tastiera/gamepad (niente controlli touch).
- **Settings**: sezioni in 1 colonna (mobile), 2 (tablet), 3 (desktop); la sezione "Dati" occupa sempre l'intera larghezza.

## Avvertenza legale (presente anche nelle schermate)

Soli-boy non distribuisce né include ROM o BIOS protetti da copyright; l'utente carica esclusivamente file di propria proprietà.
